/* The game on play.html: a small top-down town to walk around, drawn by
   play-art.js from the map in play-world.js. Every building opens a window
   with real content from content.js, and nothing is locked behind playing:
   the map (M) reaches every section, and a link like play.html#projects
   (or #about, #work, #school, #skills, #contact, #map) opens one directly. */
(function () {
  "use strict";

  const S = window.SITE;
  const ART = window.PixelArt;
  const TOWN = window.PixelTown;
  if (!S || !ART || !TOWN) {
    console.error("play.html needs content.js, play-art.js and play-world.js.");
    return;
  }

  const P = S.person;
  const C = ART.C;
  const T = ART.TILE;
  const root = document.documentElement;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  root.classList.toggle("touch", touch);
  const NAME = String(P.firstName || "Me").toUpperCase();

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
  const rich = (v) => esc(v).replace(/\*(.+?)\*/g, "<em>$1</em>");

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const pad = (n, width = 2) => String(n).padStart(width, "0");
  const url = (canvas) => canvas.toDataURL();
  const lines = (v) => (typeof v === "function" ? v(S, touch) : v || []);

  const prettyUrl = (u) => String(u).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

  const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  function fmtDate(value) {
    if (!value) return "Present";
    const [y, m] = String(value).split("-").map(Number);
    return m ? MONTH.format(new Date(y, m - 1)) : String(y);
  }
  const dateRange = (e) => (e.start ? `${fmtDate(e.start)} – ${fmtDate(e.end)}` : fmtDate(e.end));
  const sortKey = (v) => (v ? String(v).padEnd(7, "-13") : "9999-99");
  const byRecent = (a, b) =>
    sortKey(b.end).localeCompare(sortKey(a.end)) || sortKey(b.start).localeCompare(sortKey(a.start));

  // Where a tool has been used, as on the Toolbox page (see main.js).
  function usesOf(tool) {
    const cv = S.cv || {};
    const name = tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^\\w#+.])${name}(?![\\w#+])`);
    const mentions = (list) => re.test((list || []).join(" "));
    const work = (cv.experience || []).filter((e) => mentions(e.bullets));
    return {
      projects: (S.projects || []).filter((p) => (p.tags || []).includes(tool) || mentions([p.description])),
      work: [...new Set(work.map((e) => e.org))],
      study: [...new Set((cv.education || []).filter((e) => mentions(e.details)).map((e) => e.school))],
      now: work.some((e) => !e.end),
    };
  }

  /* ── Saved progress ──────────────────────────────────────────────────── */

  const SAVE_KEY = "pixel-town";
  const save = Object.assign({ visited: [], squashed: 0, sound: false, done: false, night: null }, readSave());

  function readSave() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function store() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (_) {
      /* storage unavailable: progress just isn't kept */
    }
  }

  /* ── The town ────────────────────────────────────────────────────────── */

  const MAP = TOWN.map;
  const MW = MAP[0].length;
  const MH = MAP.length;
  const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const at = (x, y) => (inside(x, y) ? MAP[y][x] : "T");

  // Buildings: a capital letter from `places` marks the footprint, and the
  // same letter in lower case is the door.
  const found = {};
  const buildingAt = new Map();
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const ch = at(x, y);
      const key = ch.toUpperCase();
      const def = TOWN.places[key];
      if (!def || (ch !== key && ch !== key.toLowerCase())) continue;
      const b = found[key] || (found[key] = Object.assign({}, def, { x, y, x1: x, y1: y, door: null }));
      b.x = Math.min(b.x, x);
      b.y = Math.min(b.y, y);
      b.x1 = Math.max(b.x1, x);
      b.y1 = Math.max(b.y1, y);
      if (ch !== key) b.door = { x, y };
      buildingAt.set(y * MW + x, b);
    }
  }
  const buildings = TOWN.order.map((id) => Object.values(found).find((b) => b.id === id)).filter((b) => b && b.door);
  buildings.forEach((b) => {
    b.w = b.x1 - b.x + 1;
    b.h = b.y1 - b.y + 1;
    b.front = { x: b.door.x, y: b.door.y + 1 };
  });
  const byId = Object.fromEntries(buildings.map((b) => [b.id, b]));
  const buildingOf = (x, y) => (inside(x, y) && buildingAt.get(y * MW + x)) || null;

  const cars = [];
  const fountains = [];
  const flowerTiles = [];
  const waterTiles = [];
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const ch = at(x, y);
      if (ch === "v" && at(x - 1, y) !== "v") cars.push(Object.assign({ x, y }, TOWN.cars[cars.length % TOWN.cars.length]));
      if (ch === "F" && at(x - 1, y) !== "F" && at(x, y - 1) !== "F") fountains.push({ x, y });
      if (ch === ":") flowerTiles.push({ x, y });
      if (ch === "~") waterTiles.push({ x, y });
    }
  }
  const carAt = (x, y) => cars.find((c) => c.y === y && (c.x === x || c.x + 1 === x));
  const duck = TOWN.duck;

  const model = { w: MW, h: MH, at, isBuilding: (x, y) => !!buildingOf(x, y), buildings, cars, fountains };

  // The map is baked once for day and once for night, on first use.
  let night = typeof save.night === "boolean" ? save.night : new Date().getHours() >= 20 || new Date().getHours() < 7;
  const bakes = {};
  const baked = () => {
    const key = night ? "night" : "day";
    return bakes[key] || (bakes[key] = ART.bakeMap(model, night));
  };

  /* ── Canvas ──────────────────────────────────────────────────────────── */
  // Everything is drawn into `view` at art resolution, then copied to the
  // screen at a whole number of device pixels per art pixel.

  const screen = $("#game");
  const sg = screen.getContext("2d");
  const view = document.createElement("canvas");
  const vg = view.getContext("2d");
  const shade = document.createElement("canvas"); // the dark of night, with holes for the lights
  const hg = shade.getContext("2d");
  let scale = 4;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    const across = w < 640 ? 12 : w < 1100 ? 17 : 22; // tiles across the screen
    scale = Math.max(1, Math.min(Math.round(pw / (across * T)), Math.floor(ph / (9 * T))));
    view.width = shade.width = Math.ceil(pw / scale);
    view.height = shade.height = Math.ceil(ph / scale);
    screen.width = view.width * scale;
    screen.height = view.height * scale;
    screen.style.width = `${screen.width / dpr}px`;
    screen.style.height = `${screen.height / dpr}px`;
    sg.imageSmoothingEnabled = false;
  }

  /* ── People ──────────────────────────────────────────────────────────── */

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
  const FLOOR = new Set([".", ":", '"', "=", ">", "_", "q"]);

  function walker(x, y, dir, look) {
    return { x, y, dir, from: { x, y }, t: 1, moving: false, step: 0, speed: 4.6, frames: ART.character(look) };
  }

  const player = walker(TOWN.start.x, TOWN.start.y, TOWN.start.dir, TOWN.look);
  const npcs = TOWN.npcs.map((def) =>
    Object.assign(walker(def.x, def.y, def.dir, def.look), { def, idle: 1 + Math.random() * 3, speed: 2.6, talking: false })
  );
  const walkers = [player, ...npcs];
  // People keep out of the way of doors.
  const doorstep = new Set(buildings.map((b) => b.front.y * MW + b.front.x));

  const occupied = (x, y, self) =>
    walkers.some((w) => w !== self && ((w.x === x && w.y === y) || (w.moving && w.from.x === x && w.from.y === y)));
  const open = (x, y, self) => FLOOR.has(at(x, y)) && !occupied(x, y, self);

  function step(w, dir) {
    w.dir = dir;
    const [dx, dy] = DIRS[dir];
    if (!open(w.x + dx, w.y + dy, w)) return false;
    w.from = { x: w.x, y: w.y };
    w.x += dx;
    w.y += dy;
    w.t = 0;
    w.moving = true;
    w.step ^= 1;
    return true;
  }

  // Moves `w` along its step. Returns the time left over once it arrives,
  // or -1 while it's still on the way (or standing still).
  function advance(w, dt) {
    if (!w.moving) return -1;
    w.t += dt * w.speed;
    if (w.t < 1) return -1;
    const left = (w.t - 1) / w.speed;
    w.t = 1;
    w.moving = false;
    return left;
  }

  const pos = (w) => ({ x: (w.from.x + (w.x - w.from.x) * w.t) * T, y: (w.from.y + (w.y - w.from.y) * w.t) * T });

  function teleport(x, y, dir) {
    Object.assign(player, { x, y, from: { x, y }, t: 1, moving: false, dir });
  }

  const dirTo = (x, y) => {
    const dx = x - player.x;
    const dy = y - player.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  };

  /* ── State ───────────────────────────────────────────────────────────── */

  // title → play, with talk, window and battle on top of play.
  let mode = "title";
  let clock = 0;
  let idle = 0; // how long you've stood still
  let route = []; // directions still to walk
  let goal = null; // { goals, face, then, grass } for the walk in progress
  let marker = null; // where a click sent you
  let grassSteps = 0;
  let nextEncounter = 3;
  let lastBug = -1;
  let lastBump = 0;
  let blink = 2;

  function setMode(next) {
    mode = next;
    document.body.dataset.mode = next;
    if (next !== "play") {
      held.length = 0;
      hideHover();
    }
  }

  /* ── Input ───────────────────────────────────────────────────────────── */

  const held = []; // directions held down, the latest last
  const pressedAt = {};
  let running = false;

  const KEY_DIRS = {
    ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  };
  const KEY_A = new Set(["Space", "Enter", "NumpadEnter", "KeyE", "KeyZ"]);
  const KEY_B = new Set(["Escape", "KeyX"]);

  function press(dir) {
    if (!held.includes(dir)) {
      held.push(dir);
      pressedAt[dir] = performance.now();
    }
    route = [];
    goal = null;
    marker = null;
  }

  function release(dir) {
    const i = held.indexOf(dir);
    if (i >= 0) held.splice(i, 1);
  }

  // The A button: talk, read, go in, carry on.
  function pressA() {
    if (mode === "title") startGame();
    else if (mode === "play") interactFront();
    else if (mode === "talk") talkNext();
    else if (mode === "battle") battleA();
  }

  // The B button: back out.
  function pressB() {
    if (mode === "talk") talkBack();
    else if (mode === "window") closeWindow();
    else if (mode === "battle") battleB();
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target instanceof Element ? e.target : document.body;
    if (target.closest("input, textarea, select")) return;
    const onControl = !!target.closest("a, button");
    const dir = KEY_DIRS[e.code];
    if (e.key === "Shift") running = true;

    if (mode === "window") {
      if (KEY_B.has(e.code)) {
        e.preventDefault();
        closeWindow();
      } else if (e.key === "Tab") trapFocus(e);
      return;
    }
    if (mode === "battle") {
      if (dir) {
        e.preventDefault();
        battleMove();
      } else if (KEY_A.has(e.code) && !e.repeat) {
        e.preventDefault();
        battleA();
      } else if (KEY_B.has(e.code)) battleB();
      return;
    }
    if (mode === "talk") {
      if (dir === "up" || dir === "down") {
        e.preventDefault();
        moveChoice(dir === "up" ? -1 : 1);
      } else if ((KEY_A.has(e.code) || KEY_B.has(e.code)) && !e.repeat) {
        e.preventDefault();
        if (KEY_A.has(e.code)) talkNext();
        else talkBack();
      }
      return;
    }
    if (mode === "title") {
      if (KEY_A.has(e.code) && !onControl) {
        e.preventDefault();
        startGame();
      }
      return;
    }
    if (mode !== "play") return;
    if (dir) {
      e.preventDefault();
      press(dir);
    } else if (KEY_A.has(e.code) && !onControl) {
      e.preventDefault();
      if (!e.repeat) interactFront();
    } else if (e.code === "KeyM") openWindow("map");
    else if (e.code === "KeyN") toggleNight();
  });

  document.addEventListener("keyup", (e) => {
    const dir = KEY_DIRS[e.code];
    if (dir) release(dir);
    if (e.key === "Shift") running = false;
  });

  window.addEventListener("blur", () => {
    held.length = 0;
    running = false;
  });

  // Clicking (or tapping) the town walks you there, and to whatever you
  // clicked on.
  function tileAt(e) {
    const r = screen.getBoundingClientRect();
    const x = (e.clientX - r.left) * (view.width / r.width) + cam.rx;
    const y = (e.clientY - r.top) * (view.height / r.height) + cam.ry;
    return { x: Math.floor(x / T), y: Math.floor(y / T) };
  }

  screen.addEventListener("click", (e) => {
    if (mode === "title") return startGame();
    if (mode !== "play") return;
    const { x, y } = tileAt(e);
    clickTile(x, y);
  });

  const hover = $("#hover");
  let hoverKey = "";
  function hideHover() {
    hover.hidden = true;
    hoverKey = "";
    screen.style.cursor = "";
  }

  screen.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || mode !== "play") return hideHover();
    const { x, y } = tileAt(e);
    const thing = thingAt(x, y);
    const label = thing ? labelOf(thing)[1] : "";
    screen.style.cursor = thing ? "pointer" : "";
    hover.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 34}px)`;
    if (label !== hoverKey) {
      hoverKey = label;
      hover.textContent = label;
      hover.hidden = !label;
    }
  });
  screen.addEventListener("pointerleave", hideHover);

  /* ── Walking somewhere ───────────────────────────────────────────────── */

  // Shortest walk (as directions) from you to any of `goals`. Avoids tall
  // grass unless `grass` is set, and never leaves town by accident.
  function findRoute(goals, grass) {
    const want = new Set(goals.map((g) => g.y * MW + g.x));
    const start = player.y * MW + player.x;
    if (want.has(start)) return [];
    const prev = new Map([[start, null]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const k = queue[i];
      const x = k % MW;
      const y = (k / MW) | 0;
      for (const dir in DIRS) {
        const nx = x + DIRS[dir][0];
        const ny = y + DIRS[dir][1];
        const nk = ny * MW + nx;
        if (!inside(nx, ny) || prev.has(nk) || !open(nx, ny, player)) continue;
        const ch = at(nx, ny);
        if (!want.has(nk) && ((ch === '"' && !grass) || ch === ">")) continue;
        prev.set(nk, [k, dir]);
        if (want.has(nk)) {
          const dirs = [];
          for (let c = nk; prev.get(c); c = prev.get(c)[0]) dirs.unshift(prev.get(c)[1]);
          return dirs;
        }
        queue.push(nk);
      }
    }
    return null;
  }

  // Walks to one of `goals`, then faces `face` and calls `then`.
  function travel(goals, face, then) {
    const grass = goals.some((g) => at(g.x, g.y) === '"');
    const r = findRoute(goals, grass);
    if (!r) return false;
    route = r;
    goal = { goals, face, then, grass };
    return true;
  }

  function finishGoal() {
    const g = goal;
    goal = null;
    marker = null;
    if (g.face) player.dir = g.face;
    if (g.then) g.then();
  }

  function walkTo(b) {
    if (travel([b.front], "up", () => enter(b))) return;
    // No way through (someone's in the way): skip the walk.
    dip(() => teleport(b.front.x, b.front.y, "up")).then(() => enter(b));
  }

  // The tiles a thing covers, so you can walk up to any side of it.
  function footprint(thing, x, y) {
    if (thing.kind === "fountain") {
      const f = fountains.find((fo) => x >= fo.x && x < fo.x + 3 && y >= fo.y && y < fo.y + 3);
      if (f) return Array.from({ length: 9 }, (_, i) => ({ x: f.x + (i % 3), y: f.y + ((i / 3) | 0) }));
    }
    if (thing.kind === "car") return [{ x: thing.car.x, y: thing.car.y }, { x: thing.car.x + 1, y: thing.car.y }];
    return [{ x, y }];
  }

  function clickTile(x, y) {
    const thing = thingAt(x, y);
    marker = { x, y };
    if (thing && thing.kind === "building") {
      if (!travel([thing.b.front], "up", () => enter(thing.b))) walkTo(thing.b);
      return;
    }
    if (thing) {
      const tiles = footprint(thing, x, y);
      const spots = [];
      tiles.forEach((t) =>
        Object.values(DIRS).forEach(([dx, dy]) => {
          const sx = t.x - dx;
          const sy = t.y - dy;
          const mine = sx === player.x && sy === player.y;
          if ((mine || open(sx, sy, player)) && !tiles.some((o) => o.x === sx && o.y === sy)) spots.push({ x: sx, y: sy });
        })
      );
      const face = () => {
        const near = tiles.find((t) => Math.abs(t.x - player.x) + Math.abs(t.y - player.y) === 1) || tiles[0];
        player.dir = dirTo(near.x, near.y);
        interact(thing);
      };
      if (!travel(spots, null, face)) bumpSound();
      return;
    }
    if (!FLOOR.has(at(x, y)) || !travel([{ x, y }], null, null)) {
      marker = null;
      bumpSound();
    }
  }

  /* ── Things to look at ───────────────────────────────────────────────── */

  function thingAt(x, y) {
    const npc = npcs.find((n) => n.x === x && n.y === y);
    if (npc) return { kind: "npc", npc };
    const b = buildingOf(x, y);
    if (b) return { kind: "building", b };
    const ch = at(x, y);
    if (!inside(x, y)) return null;
    if (/[1-9]/.test(ch)) return { kind: "sign", id: ch };
    if (ch === "M") return { kind: "mailbox" };
    if (ch === "F") return { kind: "fountain" };
    if (ch === "v") return { kind: "car", car: carAt(x, y) };
    if (ch === "n") return { kind: "net" };
    if (ch === "L") return { kind: "lamp" };
    if (ch === "~") return duck && x === duck.x && y === duck.y ? { kind: "duck" } : { kind: "water" };
    return null;
  }

  function labelOf(thing) {
    switch (thing.kind) {
      case "building":
        return ["ENTER", thing.b.label];
      case "npc":
        return ["TALK", thing.npc.def.name];
      case "sign":
        return ["READ", "SIGN"];
      case "mailbox":
        return ["CHECK", "POSTBOX"];
      case "fountain":
        return ["CHECK", "FOUNTAIN"];
      case "car":
        return ["CHECK", "CAR"];
      case "net":
        return ["CHECK", "NET"];
      case "lamp":
        return ["CHECK", "LAMP"];
      case "duck":
        return ["CHECK", "DUCK"];
      default:
        return ["CHECK", "POND"];
    }
  }

  function interactFront() {
    if (player.moving) return;
    const [dx, dy] = DIRS[player.dir];
    const thing = thingAt(player.x + dx, player.y + dy);
    if (thing) interact(thing);
  }

  async function interact(thing) {
    route = [];
    goal = null;
    marker = null;
    const things = TOWN.things;
    switch (thing.kind) {
      case "building": {
        const b = thing.b;
        if (b.door.x === player.x && b.door.y === player.y - 1) return enter(b);
        return say(null, [`${b.title}. The door is around the front.`]);
      }
      case "npc": {
        const n = thing.npc;
        const before = n.dir;
        n.talking = true;
        if (!n.moving) n.dir = OPPOSITE[player.dir];
        await say(n.def.name, lines(n.def.lines));
        n.talking = false;
        if (!n.def.wander) n.dir = before;
        return;
      }
      case "sign":
        return say(null, lines(TOWN.signs[thing.id]));
      case "mailbox":
        await say(null, lines(things.mailbox));
        if (byId.contact) {
          visit("contact");
          openWindow("contact", byId.contact);
        }
        return;
      case "car":
        return say(null, lines(thing.car && thing.car.lines));
      default:
        return say(null, lines(things[thing.kind]));
    }
  }

  async function enter(b) {
    route = [];
    goal = null;
    marker = null;
    player.dir = "up";
    sfx("door");
    if (!save.visited.includes(b.id)) await say(NAME, lines(b.hello));
    await dip(() => {
      visit(b.id);
      openWindow(b.panel, b);
    });
  }

  function visit(id) {
    if (save.visited.includes(id)) return;
    save.visited.push(id);
    store();
    renderHud();
  }

  async function leaveTown() {
    const pick = await say(null, lines(TOWN.things.exit), [
      { label: "YES", value: true },
      { label: "NO", value: false },
    ]);
    if (pick) {
      location.href = "index.html";
      return;
    }
    step(player, "left");
  }

  async function finishTour() {
    save.done = true;
    store();
    sfx("star");
    toast("ACHIEVEMENT UNLOCKED", `You met ${P.firstName}!`);
    const pick = await say(NAME, lines(TOWN.outro), [
      { label: "CONTACT ME", value: "contact" },
      { label: "KEEP EXPLORING", value: null },
    ]);
    if (pick && byId[pick]) openWindow(byId[pick].panel, byId[pick]);
  }

  /* ── Dialogue ────────────────────────────────────────────────────────── */

  const talkEl = $("#talk");
  const talkName = $("#talk-name");
  const talkText = $("#talk-text");
  const talkSr = $("#talk-sr");
  const talkChoices = $("#talk-choices");
  let talk = null;

  // Shows `pages` one at a time in the text box, typed out. With `choices`
  // ([{ label, value }]) the last page asks, and the promise gives the value.
  function say(who, pages, choices) {
    const list = (pages || []).filter(Boolean);
    if (!list.length) return Promise.resolve();
    return new Promise((resolve) => {
      talk = { who, pages: list, i: 0, choices: choices || null, pick: 0, resolve };
      setMode("talk");
      talkEl.hidden = false;
      talkName.hidden = !who;
      talkName.textContent = who || "";
      showPage();
    });
  }

  function showPage() {
    talk.text = talk.pages[talk.i];
    talk.shown = still ? talk.text.length : 0;
    talkText.textContent = still ? talk.text : "";
    talkSr.textContent = (talk.who ? `${talk.who}: ` : "") + talk.text;
    talkEl.classList.remove("is-done");
    talkChoices.hidden = true;
    if (still) pageDone();
  }

  function typeTalk(dt) {
    if (!talk || talk.shown >= talk.text.length) return;
    const before = Math.floor(talk.shown);
    talk.shown = Math.min(talk.text.length, talk.shown + dt * 55);
    const now = Math.floor(talk.shown);
    if (now === before) return;
    talkText.textContent = talk.text.slice(0, now);
    if (now % 3 === 0 && talk.text[now - 1] !== " ") sfx("blip");
    if (now >= talk.text.length) pageDone();
  }

  function pageDone() {
    talkText.textContent = talk.text;
    talkEl.classList.add("is-done");
    if (talk.choices && talk.i === talk.pages.length - 1) {
      talkChoices.innerHTML = talk.choices
        .map((c, i) => `<button class="choice" type="button" tabindex="-1" data-i="${i}" aria-selected="${i === talk.pick}">${esc(c.label)}</button>`)
        .join("");
      talkChoices.hidden = false;
    }
  }

  function moveChoice(d) {
    if (!talk || !talk.choices || talkChoices.hidden) return;
    talk.pick = (talk.pick + d + talk.choices.length) % talk.choices.length;
    $$(".choice", talkChoices).forEach((b, i) => b.setAttribute("aria-selected", String(i === talk.pick)));
    sfx("blip");
  }

  function talkNext() {
    if (!talk) return;
    if (talk.shown < talk.text.length) {
      talk.shown = talk.text.length;
      pageDone();
      return;
    }
    if (talk.i < talk.pages.length - 1) {
      talk.i += 1;
      sfx("select");
      showPage();
      return;
    }
    endTalk(talk.choices ? talk.choices[talk.pick].value : undefined);
  }

  // B finishes the line, answers "no" to a question, or moves on.
  function talkBack() {
    if (!talk) return;
    const asking = talk.choices && talk.i === talk.pages.length - 1 && talk.shown >= talk.text.length;
    if (asking) endTalk(talk.choices[talk.choices.length - 1].value);
    else talkNext();
  }

  function endTalk(value) {
    const t = talk;
    talk = null;
    talkEl.hidden = true;
    talkChoices.hidden = true;
    setMode("play");
    t.resolve(value);
  }

  talkEl.addEventListener("click", (e) => {
    if (mode !== "talk") return;
    const choice = e.target.closest(".choice");
    if (choice) endTalk(talk.choices[+choice.dataset.i].value);
    else talkNext();
  });

  /* ── Windows ─────────────────────────────────────────────────────────── */

  const layer = $("#layer");
  const winEl = $(".win", layer);
  const winTitle = $("#win-title");
  const winBody = $("#win-body");
  const CARTS = [C.red, C.blue, C.green, C.orange, C.plum, C.teal];
  const SLOTS = [C.blue, C.green, C.orange, C.plum];
  const TYPES = [
    [C.red, C.white], [C.orange, C.ink], [C.yellow, C.ink], [C.green, C.ink], [C.teal, C.white],
    [C.blue, C.white], [C.sky, C.ink], [C.plum, C.white], [C.slate, C.white], [C.lime, C.ink],
  ];
  const typeStyle = (tag) => {
    const [bg, fg] = TYPES[ART.hash([...tag].reduce((n, c) => n * 31 + c.charCodeAt(0), 7)) % TYPES.length];
    return `--type:${bg};--type-ink:${fg}`;
  };

  function itemCode(name) {
    const known = {
      JavaScript: "JS", TypeScript: "TS", Python: "PY", Assembly: "ASM", PostgreSQL: "SQL", "Node.js": "NODE",
      "Next.js": "NEXT", "GitHub Actions": "CI", "VS Code": "VSC", "Unified Process": "UP", Scrum: "SCRM", React: "RCT",
    };
    if (known[name]) return known[name];
    if (name.length <= 4) return name.toUpperCase();
    const caps = name.match(/[A-Z]/g) || [];
    return caps.length >= 2 ? caps.join("").slice(0, 4) : name.slice(0, 3).toUpperCase();
  }

  function links(which) {
    const L = P.links || {};
    const all = {
      cv: { href: "cv.html", label: "CV" },
      classic: { href: "index.html", label: "CLASSIC SITE" },
      github: L.github && { href: L.github, label: "GITHUB", ext: true },
      linkedin: L.linkedin && { href: L.linkedin, label: "LINKEDIN", ext: true },
    };
    const items = which.map((k) => all[k]).filter(Boolean);
    if (!items.length) return "";
    return `<div class="win-actions">${items
      .map((l) => `<a class="px-btn" href="${esc(l.href)}"${l.ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${l.label}</a>`)
      .join("")}</div>`;
  }

  const portrait = () =>
    P.photo
      ? `<img class="card-photo" src="${esc(P.photo)}" alt="Photo of ${esc(P.name)}">`
      : `<img class="card-photo px" src="${url(player.frames.down[0])}" alt="Pixel-art ${esc(P.firstName)}">`;

  const WINDOWS = {
    about() {
      const facts = Object.entries(S.facts || {});
      const label = (k) => k.replace(/_/g, " ").toUpperCase();
      const plain = (v) => (Array.isArray(v) ? v.join(", ") : String(v));
      const langs = (S.cv && S.cv.languages) || [];
      return {
        title: "TRAINER CARD",
        html: `
          <article class="card">
            <header class="card-head"><span>${esc(P.name)}</span><span>ID No.${esc(P.initials || "")}</span></header>
            <div class="card-main">
              <dl class="card-facts">
                ${facts.map(([k, v]) => `<div><dt>${esc(label(k))}</dt><dd>${esc(plain(v))}</dd></div>`).join("")}
              </dl>
              ${portrait()}
            </div>
            <ul class="badges" aria-label="Badges">
              ${langs.map((l) => `<li class="badge"><b>${esc(l.name)}</b><small>${esc(l.level)}</small></li>`).join("")}
              <li class="badge is-gold"><b>Quests</b><small>${save.visited.length} of ${buildings.length}</small></li>
              <li class="badge is-red"><b>Bugs</b><small>${save.squashed} squashed</small></li>
            </ul>
          </article>
          <div class="prose">${(S.about || []).map((p) => `<p>${rich(p)}</p>`).join("")}</div>
          ${links(["cv", "github", "linkedin"])}`,
      };
    },

    projects() {
      const list = S.projects || [];
      const intro = ((S.pages || {}).projects || {}).intro;
      return {
        title: "CARTRIDGES",
        html: `
          ${intro ? `<p class="win-intro">${rich(intro)}</p>` : ""}
          <div class="carts-layout">
            <ul class="carts" aria-label="Projects">
              ${list
                .map(
                  (p, i) => `
                <li><button class="cart" type="button" data-i="${i}" style="--cart:${CARTS[i % CARTS.length]}" aria-pressed="false">
                  <span class="cart-label"><b>${esc(p.name)}</b><small>${esc(p.year || "")}</small></span>
                </button></li>`
                )
                .join("")}
            </ul>
            <div class="dex" aria-live="polite"></div>
          </div>`,
        setup(body) {
          const dex = $(".dex", body);
          const carts = $$(".cart", body);
          const show = (i) => {
            const p = list[i];
            carts.forEach((c, j) => c.setAttribute("aria-pressed", String(i === j)));
            dex.innerHTML = `
              <p class="dex-no">No.${pad(i + 1, 3)}</p>
              <h3 class="dex-name">${esc(p.name)}</h3>
              <ul class="types" aria-label="Built with">
                ${(p.tags || []).map((t) => `<li class="type" style="${typeStyle(t)}">${esc(t)}</li>`).join("")}
              </ul>
              <p class="dex-desc">${esc(p.description || "")}</p>
              <div class="win-actions">
                ${p.live ? `<a class="px-btn is-primary" href="${esc(p.live)}" target="_blank" rel="noopener noreferrer"><span class="tri" aria-hidden="true"></span>PLAY</a>` : ""}
                ${p.repo ? `<a class="px-btn" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">SOURCE</a>` : ""}
              </div>`;
          };
          carts.forEach((c) =>
            c.addEventListener("click", () => {
              show(+c.dataset.i);
              sfx("select");
            })
          );
          if (list.length) show(0);
        },
      };
    },

    quests(place) {
      const cv = S.cv || {};
      const groups = [
        { id: "work", title: "WORK", list: cv.experience || [], fields: (e) => [e.role, e.org, e.bullets] },
        { id: "education", title: "EDUCATION", list: cv.education || [], fields: (e) => [e.degree, e.school, e.details] },
        ...(cv.sections || []).map((s, i) => ({
          id: `more-${i}`,
          title: String(s.title).toUpperCase(),
          list: s.items || [],
          fields: (e) => [e.role || e.title, e.org, e.bullets],
        })),
      ].filter((g) => g.list.length);
      if (!groups.length) return { title: "QUEST LOG", html: "<p>No quests yet.</p>" };
      const first = place && groups.some((g) => g.id === place.tab) ? place.tab : groups[0].id;

      const quest = (e, fields) => {
        const [title, org, items] = fields(e);
        const now = !e.end;
        return `
          <li class="quest" data-relevant="${e.relevant !== false}">
            <p class="quest-meta">
              <span class="quest-status${now ? " is-now" : ""}">${now ? "IN PROGRESS" : "CLEARED"}</span>
              ${e.relevant === false ? '<span class="quest-side">SIDE QUEST</span>' : ""}
              <span class="quest-date">${esc(dateRange(e))}</span>
            </p>
            <h3 class="quest-title">${esc(title)}</h3>
            ${org || e.location ? `<p class="quest-org">${esc([org, e.location].filter(Boolean).join(" · "))}</p>` : ""}
            ${items && items.length ? `<ul class="quest-steps">${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
          </li>`;
      };

      return {
        title: "QUEST LOG",
        html: `
          <div class="quest-bar">
            <div class="tabs" role="tablist" aria-label="Quest lines">
              ${groups.map((g) => `<button class="tab" type="button" role="tab" id="tab-${g.id}" aria-controls="ql-${g.id}" data-tab="${g.id}">${esc(g.title)}</button>`).join("")}
            </div>
            <div class="filter" role="group" aria-label="Which quests to show">
              <button class="filter-btn" type="button" data-view="main">MAIN</button>
              <button class="filter-btn" type="button" data-view="all">ALL</button>
            </div>
          </div>
          <p class="quest-count" aria-live="polite"></p>
          ${groups
            .map(
              (g) => `
            <ol class="quests" role="tabpanel" id="ql-${g.id}" aria-labelledby="tab-${g.id}">
              ${[...g.list].sort(byRecent).map((e) => quest(e, g.fields)).join("")}
            </ol>`
            )
            .join("")}
          ${links(["cv"])}`,
        setup(body) {
          let tab = first;
          let view = "main";
          const apply = () => {
            $$(".tab", body).forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === tab)));
            $$(".filter-btn", body).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
            $$(".quests", body).forEach((l) => (l.hidden = l.id !== `ql-${tab}`));
            const items = $$(`#ql-${tab} .quest`, body);
            items.forEach((q) => (q.hidden = view === "main" && q.dataset.relevant === "false"));
            const shown = items.filter((q) => !q.hidden).length;
            const side = items.length - shown;
            $(".quest-count", body).textContent =
              view === "all"
                ? `All ${items.length} quests.`
                : `${shown} main ${shown === 1 ? "quest" : "quests"}${side ? `. ${side} side ${side === 1 ? "quest is" : "quests are"} under ALL.` : "."}`;
          };
          body.addEventListener("click", (e) => {
            const t = e.target.closest("[data-tab]");
            const f = e.target.closest("[data-view]");
            if (t) tab = t.dataset.tab;
            if (f) view = f.dataset.view;
            if (t || f) {
              sfx("select");
              apply();
            }
          });
          apply();
        },
      };
    },

    skills() {
      const groups = (S.skills || []).filter((g) => g.items.length);
      return {
        title: "ITEM SHOP",
        html: `
          <p class="win-intro"><span class="who">SHOPKEEPER:</span> Everything ${esc(P.firstName)} carries. Pick an item to see where it's been used.</p>
          <div class="shop">
            <div class="shelves">
              ${groups
                .map(
                  (g, gi) => `
                <section class="shelf">
                  <h3>${esc(g.group)}</h3>
                  <ul class="slots">
                    ${g.items
                      .map(
                        (it) => `
                      <li><button class="slot" type="button" data-item="${esc(it)}" data-group="${esc(g.group)}" style="--slot:${SLOTS[gi % SLOTS.length]}" aria-pressed="false">
                        <span class="slot-icon" aria-hidden="true">${esc(itemCode(it))}</span>
                        <span class="slot-name">${esc(it)}</span>
                      </button></li>`
                      )
                      .join("")}
                  </ul>
                </section>`
                )
                .join("")}
            </div>
            <aside class="item-info" aria-live="polite"></aside>
          </div>`,
        setup(body) {
          const info = $(".item-info", body);
          const show = (btn) => {
            $$(".slot", body).forEach((s) => s.setAttribute("aria-pressed", String(s === btn)));
            const tool = btn.dataset.item;
            const u = usesOf(tool);
            const rows = [
              u.work.length && ["WORK", u.work.map(esc).join(", ")],
              u.projects.length && ["PROJECTS", u.projects.map((p) => esc(p.name)).join(", ")],
              u.study.length && ["STUDY", u.study.map(esc).join(", ")],
            ].filter(Boolean);
            info.innerHTML = `
              <p class="item-kind">${esc(btn.dataset.group)}</p>
              <h3 class="item-name">${esc(tool)}</h3>
              ${u.now ? '<p class="item-now">IN USE NOW</p>' : ""}
              ${
                rows.length
                  ? `<dl class="item-uses">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`
                  : '<p class="item-none">In the bag, ready for the next quest.</p>'
              }`;
          };
          $$(".slot", body).forEach((s) =>
            s.addEventListener("click", () => {
              show(s);
              sfx("select");
            })
          );
          const firstSlot = $(".slot", body);
          if (firstSlot) show(firstSlot);
        },
      };
    },

    contact() {
      const intro = ((S.pages || {}).contact || {}).intro;
      const L = P.links || {};
      const rows = [
        P.email && { label: "EMAIL", value: P.email, href: `mailto:${P.email}`, copy: P.email },
        P.phone && { label: "PHONE", value: P.phone, href: telHref(P.phone), copy: P.phone },
        L.linkedin && { label: "LINKEDIN", value: prettyUrl(L.linkedin), href: L.linkedin, ext: true },
        L.github && { label: "GITHUB", value: prettyUrl(L.github), href: L.github, ext: true },
        { label: "CV", value: "Read the full CV", href: "cv.html" },
        P.location && { label: "BASED IN", value: P.location },
      ].filter(Boolean);
      return {
        title: "POST OFFICE",
        html: `
          <div class="letter">
            <img class="stamp px" src="${url(player.frames.down[0])}" alt="">
            <p class="letter-to">Dear visitor,</p>
            ${intro ? `<p>${rich(intro)}</p>` : ""}
            ${P.availability ? `<p class="letter-status">${esc(P.availability)}</p>` : ""}
            <ul class="channels">
              ${rows
                .map(
                  (r) => `
                <li>
                  <span class="ch-label">${r.label}</span>
                  ${r.href ? `<a href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(r.value)}</a>` : `<span>${esc(r.value)}</span>`}
                  ${r.copy ? `<button class="px-btn is-small" type="button" data-copy="${esc(r.copy)}" aria-label="Copy ${r.label.toLowerCase()}">COPY</button>` : ""}
                </li>`
                )
                .join("")}
            </ul>
            <p class="letter-sign">Hej hej,<br>${esc(P.firstName)}</p>
          </div>`,
      };
    },

    map() {
      const spot = (x, y) => `left:${(x / MW) * 100}%;top:${(y / MH) * 100}%`;
      const done = (b) => save.visited.includes(b.id);
      return {
        title: "TOWN MAP",
        html: `
          <div class="map-layout">
            <div class="minimap">
              <canvas class="px" width="${MW * T}" height="${MH * T}" aria-hidden="true"></canvas>
              ${buildings
                .map(
                  (b) =>
                    `<button class="pin${done(b) ? " is-done" : ""}" type="button" data-go="${b.id}" style="${spot(b.x + b.w / 2, b.y + b.h / 2)}" tabindex="-1" aria-hidden="true"><span>${esc(b.label)}</span></button>`
                )
                .join("")}
              <span class="you" style="${spot(player.x + 0.5, player.y + 0.5)}" aria-hidden="true"></span>
            </div>
            <div class="map-side">
              <p class="win-intro">Pick a place and I'll walk you there. Or open it straight away.</p>
              <ol class="places">
                ${buildings
                  .map(
                    (b) => `
                  <li class="${done(b) ? "is-done" : ""}">
                    <button class="place" type="button" data-go="${b.id}">
                      <span class="star" aria-hidden="true"></span><b>${esc(b.label)}</b><small>${esc(b.title)}${done(b) ? " · visited" : ""}</small>
                    </button>
                    <button class="px-btn is-small" type="button" data-open="${b.id}" aria-label="Open ${esc(b.label.toLowerCase())} now">OPEN</button>
                  </li>`
                  )
                  .join("")}
              </ol>
            </div>
          </div>
          ${links(["cv", "classic", "github", "linkedin"])}`,
        setup(body) {
          $(".minimap canvas", body).getContext("2d").drawImage(baked().frames[0], 0, 0);
          body.addEventListener("click", (e) => {
            const go = e.target.closest("[data-go]");
            const now = e.target.closest("[data-open]");
            if (go && byId[go.dataset.go]) {
              closeWindow();
              walkTo(byId[go.dataset.go]);
            } else if (now && byId[now.dataset.open]) {
              const b = byId[now.dataset.open];
              visit(b.id);
              openWindow(b.panel, b);
            }
          });
        },
      };
    },
  };

  function openWindow(kind, place) {
    const w = WINDOWS[kind](place);
    winEl.dataset.kind = kind;
    winTitle.textContent = w.title;
    winBody.innerHTML = w.html;
    winBody.scrollTop = 0;
    layer.hidden = false;
    route = [];
    goal = null;
    marker = null;
    setMode("window");
    if (w.setup) w.setup(winBody);
    setupCopy(winBody);
    // Focus the window itself, not a button in it: someone still pressing
    // Enter to get through the dialogue mustn't close it straight away.
    winEl.focus({ preventScroll: true });
    sfx("open");
  }

  function closeWindow() {
    if (mode !== "window") return;
    layer.hidden = true;
    winBody.innerHTML = "";
    setMode("play");
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    sfx("close");
    if (save.visited.length >= buildings.length && !save.done) finishTour();
  }

  $(".win-close", layer).addEventListener("click", closeWindow);
  layer.addEventListener("click", (e) => e.target === layer && closeWindow());

  function trapFocus(e) {
    const items = $$("a[href], button:not([disabled])", winEl).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function setupCopy(scope) {
    $$("[data-copy]", scope).forEach((btn) => {
      const original = btn.textContent;
      const done = (ok) => {
        btn.textContent = ok ? "COPIED" : "CTRL+C";
        setTimeout(() => (btn.textContent = original), 2000);
      };
      btn.addEventListener("click", () => {
        const text = btn.dataset.copy;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
          return;
        }
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.append(ta);
        ta.select();
        let ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (_) {
          /* fall through to the manual hint */
        }
        ta.remove();
        done(ok);
      });
    });
  }

  /* ── Wild bugs ───────────────────────────────────────────────────────── */

  const battleEl = $("#battle");
  const bText = $("#b-text");
  const bMenu = $("#b-menu");
  let battleWait = null; // resolves when you press A after a line
  let battleTyping = false;
  let battleSkip = false;
  let battlePick = 0;
  let menuWait = null;

  async function bsay(text) {
    battleEl.classList.remove("is-done");
    battleTyping = true;
    if (still) bText.textContent = text;
    else {
      for (let i = 1; i <= text.length; i++) {
        if (battleSkip) break;
        bText.textContent = text.slice(0, i);
        if (i % 3 === 0) sfx("blip");
        await wait(22);
      }
    }
    bText.textContent = text;
    battleTyping = false;
    battleSkip = false;
    battleEl.classList.add("is-done");
    await new Promise((resolve) => (battleWait = resolve));
  }

  function battleA() {
    if (menuWait) return pickMenu(battlePick);
    if (battleTyping) battleSkip = true;
    else if (battleWait) {
      const r = battleWait;
      battleWait = null;
      r();
    }
  }

  function battleB() {
    if (menuWait) {
      battlePick = 1;
      paintMenu();
    } else battleA();
  }

  function battleMove() {
    if (!menuWait) return;
    battlePick ^= 1;
    paintMenu();
    sfx("blip");
  }

  function paintMenu() {
    $$("button", bMenu).forEach((b, i) => b.setAttribute("aria-selected", String(i === battlePick)));
  }

  function pickMenu(i) {
    const r = menuWait;
    menuWait = null;
    bMenu.hidden = true;
    battleEl.classList.remove("is-asking");
    sfx("select");
    r(i === 0 ? "fight" : "run");
  }

  bMenu.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && menuWait) pickMenu($$("button", bMenu).indexOf(b));
  });
  $(".b-box", battleEl).addEventListener("click", (e) => !e.target.closest("button") && battleA());

  function setHp(v) {
    const bar = $("#b-foe-hp");
    bar.style.width = `${Math.round(v * 100)}%`;
    bar.dataset.level = v > 0.5 ? "high" : v > 0.2 ? "mid" : "low";
  }

  async function encounter() {
    route = [];
    goal = null;
    marker = null;
    setMode("battle");
    let i = Math.floor(Math.random() * TOWN.bugs.length);
    if (i === lastBug) i = (i + 1) % TOWN.bugs.length;
    lastBug = i;
    const bug = TOWN.bugs[i];
    sfx("encounter");
    if (!still) {
      fade.className = "fade is-flash";
      await wait(760);
    }
    $("#b-foe-name").textContent = bug.name;
    $("#b-foe-img").src = url(ART.bug(bug.color[0], bug.color[1]));
    $("#b-me-img").src = url(player.frames.up[0]);
    $(".b-name.is-me", battleEl).textContent = NAME;
    setHp(1);
    battleEl.className = "battle";
    battleEl.hidden = false;
    fade.className = "fade";
    await bsay(`A wild ${bug.name} appeared!`);

    bText.textContent = `What will ${NAME} do?`;
    battleEl.classList.add("is-asking");
    battlePick = 0;
    paintMenu();
    bMenu.hidden = false;
    const choice = await new Promise((resolve) => (menuWait = resolve));

    if (choice === "run") {
      await bsay("Got away safely!");
    } else {
      let hp = 1;
      for (let m = 0; m < bug.moves.length; m++) {
        const move = bug.moves[m];
        const last = m === bug.moves.length - 1;
        await bsay(`${NAME} used ${move.use}!`);
        sfx("hit");
        battleEl.classList.remove("is-hit");
        void battleEl.offsetWidth;
        battleEl.classList.add("is-hit");
        hp = last && !move.miss ? 0 : Math.max(0.2, hp - 0.3);
        setHp(hp);
        await wait(still ? 0 : 650);
        await bsay(move.result);
      }
      battleEl.classList.add("is-down");
      sfx("win");
      save.squashed += 1;
      store();
      renderHud();
      await bsay(`The wild ${bug.name} was squashed!`);
      if (save.squashed === 3) toast("ACHIEVEMENT UNLOCKED", "Bug hunter: three bugs squashed");
    }

    await dip(() => {
      battleEl.hidden = true;
      bText.textContent = "";
    });
    grassSteps = 0;
    nextEncounter = 5 + Math.floor(Math.random() * 8);
    setMode("play");
  }

  /* ── Sound ───────────────────────────────────────────────────────────── */
  // Off until you turn it on. Square-wave blips, plus a little town theme.

  const audio = { ctx: null, out: null, on: !!save.sound, next: 0, beat: 0 };

  function ensureAudio() {
    if (!audio.on) return;
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio.ctx = new AC();
      audio.out = audio.ctx.createGain();
      audio.out.gain.value = 0.5;
      audio.out.connect(audio.ctx.destination);
    }
    if (audio.ctx.state === "suspended") audio.ctx.resume();
  }

  function tone(freq, start, dur, type = "square", vol = 0.04, slideTo = 0) {
    const ctx = audio.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(audio.out);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  const SFX = {
    blip: (t) => tone(880, t, 0.03, "square", 0.02),
    select: (t) => {
      tone(660, t, 0.05);
      tone(990, t + 0.05, 0.06);
    },
    open: (t) => tone(523, t, 0.06, "square", 0.03, 1046),
    close: (t) => tone(784, t, 0.06, "square", 0.03, 392),
    door: (t) => [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.08)),
    bump: (t) => tone(110, t, 0.08, "square", 0.05),
    grass: (t) => tone(300, t, 0.03, "triangle", 0.04, 120),
    encounter: (t) => {
      for (let i = 0; i < 8; i++) tone(988 - i * 70, t + i * 0.05, 0.06, "square", 0.035);
    },
    hit: (t) => tone(220, t, 0.18, "sawtooth", 0.05, 55),
    win: (t) => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, i === 3 ? 0.35 : 0.1)),
    star: (t) => [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.08, i === 3 ? 0.4 : 0.1)),
  };

  function sfx(name) {
    if (!audio.on || !audio.ctx || audio.ctx.state !== "running") return;
    SFX[name](audio.ctx.currentTime + 0.01);
  }

  // C, G, Am, F, with a bass line, an arpeggio and a tune on top.
  const SONG = {
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    tune: [76, 0, 79, 0, 81, 0, 79, 0, 74, 0, 79, 0, 83, 0, 81, 0, 81, 0, 79, 0, 76, 0, 72, 0, 77, 0, 76, 0, 74, 0, 0, 0],
  };
  const EIGHTH = 60 / 112 / 2;
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function playMusic() {
    const ctx = audio.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (audio.next < ctx.currentTime) audio.next = ctx.currentTime + 0.05;
    while (audio.next < ctx.currentTime + 0.25) {
      const s = audio.beat % 32;
      const chord = SONG.chords[(s / 8) | 0];
      const t = audio.next;
      if (s % 2 === 0) tone(hz(chord[0] - 24 + (s % 4 === 2 ? 12 : 0)), t, EIGHTH * 1.8, "triangle", 0.08);
      tone(hz(chord[[0, 1, 2, 1][s % 4]] + 12), t, EIGHTH * 0.9, "square", 0.01);
      if (SONG.tune[s]) tone(hz(SONG.tune[s]), t, EIGHTH * 1.8, "square", 0.022);
      audio.next += EIGHTH;
      audio.beat += 1;
    }
  }

  function toggleSound() {
    audio.on = !audio.on;
    save.sound = audio.on;
    store();
    if (audio.on) ensureAudio();
    else if (audio.ctx) audio.ctx.suspend();
    renderHud();
  }

  function toggleNight() {
    night = !night;
    save.night = night;
    store();
    renderHud();
    sfx("select");
  }

  /* ── HUD, prompt and toasts ──────────────────────────────────────────── */

  function renderHud() {
    $("#quest-count").textContent = `${save.visited.length}/${buildings.length}`;
    $("#quest-stars").innerHTML = buildings.map((b) => `<i class="${save.visited.includes(b.id) ? "on" : ""}"></i>`).join("");
    $("#bug-count").textContent = save.squashed;
    const nightBtn = $("[data-act='night']");
    nightBtn.textContent = night ? "DAY" : "NIGHT";
    nightBtn.setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
    const soundBtn = $("[data-act='sound']");
    soundBtn.textContent = audio.on ? "SOUND ON" : "SOUND OFF";
    soundBtn.setAttribute("aria-pressed", String(audio.on));
  }

  $("#hud").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "map" && mode === "play") openWindow("map");
    if (act === "night") toggleNight();
    if (act === "sound") toggleSound();
    if (b !== document.activeElement || mode === "play") b.blur();
  });

  const prompt = $("#prompt");
  let promptKey = "";
  function updatePrompt() {
    let text = "";
    if (mode === "play" && !player.moving && !route.length) {
      const [dx, dy] = DIRS[player.dir];
      const thing = thingAt(player.x + dx, player.y + dy);
      if (thing) text = labelOf(thing).join(" ");
    }
    if (text === promptKey) return;
    promptKey = text;
    prompt.hidden = !text;
    if (text) prompt.innerHTML = `<kbd>${touch ? "A" : "SPACE"}</kbd>${esc(text)}`;
  }
  prompt.addEventListener("click", () => {
    interactFront();
    prompt.blur();
  });

  let toastTimer = 0;
  function toast(title, text) {
    const el = $("#toast");
    el.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`;
    el.hidden = false;
    el.classList.remove("is-in");
    void el.offsetWidth;
    el.classList.add("is-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("is-in");
      setTimeout(() => (el.hidden = true), 400);
    }, 3800);
  }

  const fade = $("#fade");
  // A quick dip to black, doing `fn` while it's dark.
  async function dip(fn) {
    if (still) {
      if (fn) fn();
      return;
    }
    fade.className = "fade is-on";
    await wait(180);
    if (fn) fn();
    fade.className = "fade";
    await wait(200);
  }

  /* ── Touch controls ──────────────────────────────────────────────────── */

  $$(".pad [data-dir]").forEach((btn) => {
    const dir = btn.dataset.dir;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      if (mode === "play") press(dir);
      else if (mode === "talk" && (dir === "up" || dir === "down")) moveChoice(dir === "up" ? -1 : 1);
      else if (mode === "battle") battleMove();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => btn.addEventListener(type, () => release(dir)));
  });
  $("#btn-a").addEventListener("click", pressA);
  $("#btn-b").addEventListener("click", pressB);

  /* ── The world moving ────────────────────────────────────────────────── */

  function nextMove() {
    if (route.length) {
      if (step(player, route[0])) {
        route.shift();
        return true;
      }
      // Someone stepped into the way: find another way, or give up.
      const again = goal && findRoute(goal.goals, goal.grass);
      if (again && again.length) route = again;
      else {
        route = [];
        goal = null;
        marker = null;
      }
      return false;
    }
    const dir = held[held.length - 1];
    if (!dir) return false;
    // A quick tap turns you on the spot, like the old games.
    if (dir !== player.dir && idle > 0.15 && performance.now() - pressedAt[dir] < 110) {
      player.dir = dir;
      return false;
    }
    if (step(player, dir)) return true;
    bump(dir);
    return false;
  }

  function bumpSound() {
    if (clock - lastBump < 0.35) return;
    lastBump = clock;
    sfx("bump");
  }

  // Walking into a door opens it.
  function bump(dir) {
    const [dx, dy] = DIRS[dir];
    const b = buildingOf(player.x + dx, player.y + dy);
    if (b && dir === "up" && b.door.x === player.x && b.door.y === player.y - 1) {
      held.length = 0;
      enter(b);
      return;
    }
    bumpSound();
  }

  function arrived() {
    const ch = at(player.x, player.y);
    if (ch === ">") {
      route = [];
      goal = null;
      marker = null;
      leaveTown();
      return;
    }
    if (ch === '"') {
      rustle(player.x, player.y);
      sfx("grass");
      grassSteps += 1;
      if (grassSteps >= nextEncounter) encounter();
    }
  }

  function wander(n, dt) {
    advance(n, dt);
    if (n.moving || n.talking || !n.def.wander) return;
    n.idle -= dt;
    if (n.idle > 0) return;
    n.idle = 1.2 + Math.random() * 3;
    const dir = Object.keys(DIRS)[(Math.random() * 4) | 0];
    const [x0, y0, x1, y1] = n.def.wander;
    const nx = n.x + DIRS[dir][0];
    const ny = n.y + DIRS[dir][1];
    if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || doorstep.has(ny * MW + nx) || Math.random() < 0.3) n.dir = dir;
    else step(n, dir);
  }

  /* ── Little things: smoke, leaves, butterflies, fireflies, clouds ────── */

  const parts = [];
  let smokeIn = 0;

  function rustle(x, y) {
    if (still) return;
    for (let i = 0; i < 5; i++) {
      parts.push({
        x: x * T + 3 + Math.random() * 10,
        y: y * T + 9,
        vx: (Math.random() - 0.5) * 36,
        vy: -28 - Math.random() * 22,
        age: 0,
        life: 0.45,
        color: i % 2 ? C.lime : C.green,
        leaf: true,
      });
    }
  }

  function updateParts(dt) {
    smokeIn -= dt;
    if (smokeIn <= 0 && !still) {
      smokeIn = 0.5;
      baked().emitters.forEach((e) =>
        parts.push({ x: e.x + Math.random() * 3, y: e.y, vx: 3 + Math.random() * 3, vy: -7 - Math.random() * 3, age: 0, life: 2.8, smoke: true })
      );
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age > p.life) {
        parts.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.leaf) p.vy += 120 * dt;
    }
  }

  function drawParts(cx, cy) {
    for (const p of parts) {
      const k = 1 - p.age / p.life;
      vg.globalAlpha = p.smoke ? k * 0.75 : k;
      vg.fillStyle = p.smoke ? (night ? C.slate : C.white) : p.color;
      const size = p.smoke ? (p.age > p.life * 0.4 ? 3 : 2) : 1;
      vg.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), size, size);
    }
    vg.globalAlpha = 1;
  }

  const pick = (list, i) => list[(i * 7919) % list.length];
  const butterflies = flowerTiles.length
    ? Array.from({ length: 7 }, (_, i) => {
        const t = pick(flowerTiles, i + 1);
        return { x: t.x * T + 8, y: t.y * T + 4, a: i * 1.7, sp: 0.5 + (i % 3) * 0.25, color: [C.white, C.yellow, C.orange][i % 3] };
      })
    : [];
  const fireflies = Array.from({ length: 18 }, (_, i) => {
    const t = i % 2 && waterTiles.length ? pick(waterTiles, i) : { x: 2 + ((i * 13) % (MW - 4)), y: i % 4 < 2 ? 2 : MH - 4 };
    return { x: t.x * T + 8, y: t.y * T + 8, a: i * 2.3 };
  });

  const clouds = [
    { x: 40, y: 70, s: 1 },
    { x: 320, y: 280, s: 1.4 },
    { x: 560, y: 150, s: 0.85 },
  ].map((c) => {
    const r = Math.round(26 * c.s);
    const canvas = document.createElement("canvas");
    canvas.width = r * 4;
    canvas.height = r * 2;
    const g = canvas.getContext("2d");
    g.fillStyle = C.ink;
    [[r, r, r * 0.8], [r * 2, r * 0.8, r], [r * 3, r * 1.1, r * 0.7]].forEach(([x, y, rr]) => {
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.fill();
    });
    return Object.assign(c, { canvas });
  });

  function drawCritters(cx, cy) {
    if (still) return;
    if (!night) {
      for (const b of butterflies) {
        const x = Math.round(b.x + Math.sin(clock * b.sp + b.a) * 16 - cx);
        const y = Math.round(b.y + Math.sin(clock * b.sp * 1.7 + b.a) * 8 - cy);
        const up = Math.floor(clock * 9 + b.a) % 2;
        vg.fillStyle = b.color;
        vg.fillRect(x - 1, y - up, 1, 1);
        vg.fillRect(x + 1, y - up, 1, 1);
        vg.fillStyle = C.ink;
        vg.fillRect(x, y, 1, 1);
      }
      vg.globalAlpha = 0.08;
      for (const c of clouds) vg.drawImage(c.canvas, Math.round(c.x - cx), Math.round(c.y - cy));
      vg.globalAlpha = 1;
    } else {
      for (const f of fireflies) {
        const x = Math.round(f.x + Math.sin(clock * 0.5 + f.a) * 22 - cx);
        const y = Math.round(f.y + Math.cos(clock * 0.37 + f.a) * 12 - cy);
        const on = 0.5 + 0.5 * Math.sin(clock * 2.6 + f.a * 3);
        vg.globalAlpha = on * 0.35;
        vg.fillStyle = C.lime;
        vg.fillRect(x - 1, y - 1, 3, 3);
        vg.globalAlpha = on;
        vg.fillStyle = C.yellow;
        vg.fillRect(x, y, 1, 1);
      }
      vg.globalAlpha = 1;
    }
  }

  function updateClouds(dt) {
    if (still) return;
    for (const c of clouds) {
      c.x += dt * 5;
      c.y += dt * 1.5;
      if (c.x > MW * T + 40) c.x = -c.canvas.width - 40;
      if (c.y > MH * T + 40) c.y = -c.canvas.height;
    }
  }

  function drawNight(cx, cy) {
    const w = shade.width;
    const h = shade.height;
    hg.globalCompositeOperation = "source-over";
    hg.clearRect(0, 0, w, h);
    hg.fillStyle = "rgba(14, 16, 46, 0.62)";
    hg.fillRect(0, 0, w, h);
    hg.globalCompositeOperation = "destination-out";
    const p = pos(player);
    const lights = baked().lights.concat([{ x: p.x + 8, y: p.y + 6, r: 36 }]);
    for (const l of lights) {
      const x = l.x - cx;
      const y = l.y - cy;
      const r = l.r * (l.warm && !still ? 1 + Math.sin(clock * 7 + l.x) * 0.04 : 1);
      if (x + r < 0 || y + r < 0 || x - r > w || y - r > h) continue;
      const grad = hg.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,0.95)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      hg.fillStyle = grad;
      hg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    vg.drawImage(shade, 0, 0);
    vg.globalCompositeOperation = "lighter";
    for (const l of lights) {
      if (!l.warm) continue;
      const x = l.x - cx;
      const y = l.y - cy;
      const r = l.r * 0.6;
      const grad = vg.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(255, 205, 117, 0.28)");
      grad.addColorStop(1, "rgba(255, 205, 117, 0)");
      vg.fillStyle = grad;
      vg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    vg.globalCompositeOperation = "source-over";
  }

  /* ── Camera and drawing ──────────────────────────────────────────────── */

  const cam = { x: 0, y: 0, rx: 0, ry: 0, glide: 0 };

  function camTarget() {
    if (mode === "title") {
      const t = still ? 0 : clock;
      return {
        x: (MW * T) / 2 + Math.sin(t * 0.06) * MW * T * 0.26 - view.width / 2,
        y: (MH * T) / 2 + Math.sin(t * 0.045 + 1) * MH * T * 0.2 - view.height / 2,
      };
    }
    const p = pos(player);
    return { x: p.x + 8 - view.width / 2, y: p.y + 8 - view.height / 2 };
  }

  const fit = (v, size, total) => (size >= total ? (total - size) / 2 : clamp(v, 0, total - size));

  function updateCamera(dt, snap) {
    const t = camTarget();
    const tx = fit(t.x, view.width, MW * T);
    const ty = fit(t.y, view.height, MH * T);
    cam.glide = Math.max(0, cam.glide - dt);
    const k = snap || mode === "title" ? 1 : Math.min(1, dt * (cam.glide > 0 ? 2.5 : 12));
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
  }

  function frameOf(w) {
    const set = w.frames[w.dir];
    if (w.moving && w.t < 0.5) return set[w.step ? 1 : 3];
    if (w === player && w.dir === "down" && blink < 0) return w.frames.blink;
    return set[0];
  }

  function drawWalker(w, cx, cy, frame) {
    const p = pos(w);
    const x = Math.round(p.x) - cx;
    const y = Math.round(p.y) - cy;
    vg.globalAlpha = 0.25;
    vg.fillStyle = C.ink;
    vg.fillRect(x + 3, y + 12, 10, 2);
    vg.fillRect(x + 4, y + 14, 8, 1);
    vg.globalAlpha = 1;
    vg.drawImage(frameOf(w), x, y - 3);
    // In tall grass, the blades in front hide your legs.
    const tile = w.moving && w.t < 0.5 ? w.from : w;
    if (at(tile.x, tile.y) === '"') vg.drawImage(ART.tallFront[frame % 2], tile.x * T - cx, tile.y * T - cy);
  }

  function render() {
    const frame = still ? 0 : Math.floor(clock * 3.6) % 4;
    const map = baked();
    const cx = Math.round(cam.x);
    const cy = Math.round(cam.y);
    cam.rx = cx;
    cam.ry = cy;
    const w = view.width;
    const h = view.height;

    // Forest beyond the edge of the map (on screens bigger than the town).
    if (cx < 0 || cy < 0 || cx + w > MW * T || cy + h > MH * T) {
      for (let ty = Math.floor(cy / T); ty * T < cy + h; ty++) {
        for (let tx = Math.floor(cx / T); tx * T < cx + w; tx++) {
          if (!inside(tx, ty)) vg.drawImage(ART.forest, tx * T - cx, ty * T - cy);
        }
      }
    }
    vg.drawImage(map.frames[frame], -cx, -cy);

    if (duck) {
      const bob = still ? 0 : Math.round(Math.sin(clock * 2.2));
      const dx = duck.x * T - cx;
      const dy = duck.y * T - cy;
      vg.fillStyle = C.sky;
      vg.fillRect(dx + 3 - bob, dy + 13, 10, 1);
      vg.drawImage(ART.sprites.duck, dx, dy - 1 + bob);
    }

    // People, lowest on screen in front.
    walkers
      .slice()
      .sort((a, b) => pos(a).y - pos(b).y)
      .forEach((wk) => drawWalker(wk, cx, cy, frame));

    if (marker && (route.length || goal)) {
      const mx = marker.x * T + 6 - cx;
      const my = marker.y * T + 2 - cy + (still ? 0 : Math.floor(clock * 4) % 2);
      vg.fillStyle = C.ink;
      vg.fillRect(mx - 1, my - 1, 7, 4);
      vg.fillRect(mx + 1, my + 3, 3, 2);
      vg.fillStyle = C.yellow;
      vg.fillRect(mx, my, 5, 2);
      vg.fillRect(mx + 1, my + 2, 3, 1);
      vg.fillRect(mx + 2, my + 3, 1, 1);
    }

    drawParts(cx, cy);
    if (night) drawNight(cx, cy);
    drawCritters(cx, cy);
    sg.drawImage(view, 0, 0, screen.width, screen.height);
  }

  function update(dt) {
    player.speed = route.length || goal ? 7 : running ? 8.5 : 4.6;
    const left = advance(player, dt);
    if (left >= 0) arrived();
    if (mode === "play" && !player.moving) {
      if (!route.length && goal) finishGoal();
      else if (nextMove() && left > 0) player.t = Math.min(0.9, left * player.speed);
    }
    idle = player.moving ? 0 : idle + dt;
    blink -= dt;
    if (blink < -0.15) blink = 2.5 + Math.random() * 3;

    npcs.forEach((n) => wander(n, dt));
    typeTalk(dt);
    updateParts(dt);
    updateClouds(dt);
    updateCamera(dt);
    updatePrompt();
    if (audio.on && mode !== "title") playMusic();
  }

  let last = performance.now();
  function loop(now) {
    // (The first frame's timestamp can be a little earlier than `last`.)
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    clock += dt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* ── Title screen ────────────────────────────────────────────────────── */

  const title = $("#title");

  function setupTitle() {
    const [first, ...rest] = String(P.name).split(/\s+/);
    $(".logo-main", title).innerHTML = [...first.toUpperCase()]
      .map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`)
      .join("");
    $(".logo-sub", title).textContent = rest.join(" ").toUpperCase();
    $(".title-role", title).textContent = String(P.role || "").toUpperCase();
    $(".quest-label").textContent = `MEET ${NAME}`;
    $(".quest-chip").setAttribute("aria-label", `Quest: meet ${P.firstName}. Open the map.`);
    $(".bug-icon").style.backgroundImage = `url(${url(ART.bug(C.red, C.plum))})`;
    const avatar = $("#title-avatar");
    const open = url(player.frames.down[0]);
    const shut = url(player.frames.blink);
    avatar.src = open;
    if (!still) {
      setInterval(() => {
        avatar.src = shut;
        setTimeout(() => (avatar.src = open), 140);
      }, 3200);
    }
    $("#start").addEventListener("click", startGame);
    $("#quick").addEventListener("click", () => {
      skipTitle();
      openWindow("map");
    });
  }

  function hideTitle() {
    title.classList.add("is-gone");
    $("#hud").hidden = false;
    setTimeout(() => (title.hidden = true), still ? 0 : 600);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  async function startGame() {
    if (mode !== "title") return;
    ensureAudio();
    setMode("busy");
    sfx("select");
    hideTitle();
    cam.glide = 1.4;
    await wait(still ? 0 : 900);
    await say(NAME, lines(TOWN.intro));
  }

  // Straight to the town, no intro: for links to a section.
  function skipTitle() {
    if (mode !== "title") return;
    hideTitle();
    setMode("play");
    updateCamera(0, true);
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id === "map") {
      skipTitle();
      openWindow("map");
      return true;
    }
    const b = byId[id];
    if (!b) return false;
    skipTitle();
    teleport(b.front.x, b.front.y, "up");
    updateCamera(0, true);
    visit(b.id);
    openWindow(b.panel, b);
    return true;
  }

  window.addEventListener("hashchange", () => {
    if (mode === "window") closeWindow();
    if (mode === "play" || mode === "title") openFromHash();
  });

  /* ── Boot ────────────────────────────────────────────────────────────── */

  resize();
  window.addEventListener("resize", resize);
  setMode("title");
  setupTitle();
  renderHud();
  if (!openFromHash()) updateCamera(0, true);
  requestAnimationFrame(loop);
})();
