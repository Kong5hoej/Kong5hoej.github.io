/* Decorative effects: the starfield background, the custom cursor and the
   cursor-reactive name. The site works fully without them, and every
   effect respects prefers-reduced-motion. Each start function returns a
   function that stops it again. */

const root = document.documentElement;
const TAU = Math.PI * 2;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Shared pointer state, in viewport coordinates.
const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, active: false, lastMove: 0 };
window.addEventListener(
  "pointermove",
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = e.pointerType === "mouse";
    pointer.lastMove = performance.now();
  },
  { passive: true }
);
root.addEventListener("mouseleave", () => (pointer.active = false));
window.addEventListener("blur", () => (pointer.active = false));

/** The starfield and the custom cursor, for every page but Pixel Town. */
export function startEffects(): () => void {
  const stops = [startSky()];
  if (finePointer() && !still()) stops.push(startCursor());
  return () => stops.forEach((stop) => stop());
}

/* ── Starfield ───────────────────────────────────────────────────────── */
// Stars sit at different depths: nearer ones are bigger, brighter and drift
// faster. Around the cursor they part like a lens and link up into
// constellation lines; a click sends out a pulse, and now and then a
// shooting star crosses the sky.

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  twinkle: number;
  vx: number;
  vy: number;
  ox: number; // displacement from the cursor / clicks, springs back to 0
  oy: number;
  vox: number;
  voy: number;
  tint: boolean;
  born: number;
}

/** What the cursor push needs; the controller's stars have this too. */
type Body = Pick<Star, "x" | "y" | "z" | "ox" | "oy" | "vox" | "voy">;

const SKY_KEY = "sky-clock";

function startSky(): () => void {
  const off = new AbortController();
  const signal = off.signal;
  const isStill = still();
  const canvas = document.createElement("canvas");
  canvas.className = "sky";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d")!;

  const DENSITY = 1 / 5000; // stars per square CSS pixel
  const MAX_STARS = 460;
  const DRIFT_X = 11; // px/s for the nearest stars; distant ones move slower
  const DRIFT_Y = -4;
  const LENS_R = 170; // radius in which stars are pushed away from the cursor
  const LENS_PUSH = 800;
  const LINK_R = 210; // stars within this radius of the cursor link up
  const LINK_DIST = 115; // longest constellation line
  const SPRING = 16; // how stars settle back after being pushed
  const DAMPING = 5.5;
  const PARALLAX = 0.35; // how much stars shift as the page scrolls

  // The controller constellation on the home page: stars at these points of
  // the .star-pad box (0–1 across and down), joined by these lines.
  const PAD: [number, number][] = [
    [0.22, 0.1], [0.78, 0.1], [0.93, 0.24], [1, 0.74], [0.89, 0.94], [0.74, 0.74],
    [0.62, 0.64], [0.38, 0.64], [0.26, 0.74], [0.11, 0.94], [0, 0.74], [0.07, 0.24], // outline
    [0.18, 0.38], [0.32, 0.38], [0.25, 0.27], [0.25, 0.49], // d-pad
    [0.7, 0.38], [0.77, 0.28], [0.84, 0.38], [0.77, 0.48], // buttons
  ];
  const PAD_LINES = [...Array.from({ length: 12 }, (_, i) => [i, (i + 1) % 12]), [12, 13], [14, 15]];
  const PAD_BUTTONS = 16; // stars from here on are the buttons
  const PAD_LIGHT = 100; // radius around the cursor in which the controller lights up
  // Its stars behave like the sky's: each wanders a little around its point,
  // the cursor and clicks push it (gently, z), and it springs back.
  const padStars = PAD.map((_, i) => ({ x: 0, y: 0, z: 0.25, ox: 0, oy: 0, vox: 0, voy: 0, phase: i * 2.4 }));

  // The sun or moon in the header (the theme toggle) floats, rocks in click
  // pulses and brightens as the cursor nears, like the stars. z = 0: the
  // cursor doesn't push it away, so it stays easy to click.
  const orb: Body = { x: 0, y: 0, z: 0, ox: 0, oy: 0, vox: 0, voy: 0 };

  // The sky always looks the same: stars come from a fixed seed, and the sky
  // clock and scroll parallax carry over when it stops (on the way into
  // Pixel Town) and starts again, and across reloads.
  const rand = seededRandom(2604);
  const saved = loadSky();
  let time = saved.t;
  let skyScroll = saved.scroll; // all scrolling so far
  const persist = () => {
    try {
      sessionStorage.setItem(SKY_KEY, JSON.stringify({ t: time, scroll: skyScroll, at: Date.now() }));
    } catch {
      /* storage unavailable: the sky just restarts */
    }
  };
  window.addEventListener("pagehide", persist, { signal });

  // On a fresh load (html.intro, set in index.html) the stars come out one
  // by one before the page content appears.
  const introStart = root.classList.contains("intro") && !isStill ? performance.now() : 0;
  const INTRO_SPREAD = 1.1; // seconds over which stars appear
  const INTRO_FADE = 0.6; // how long each star takes to fade in

  let w = 0;
  let h = 0;
  let dpr = 1;
  const stars: Star[] = [];
  let colors = readColors();
  let glow = makeGlow();
  let lens = 0; // 0..1, eases in while the cursor is over the page
  let lastScroll = window.scrollY;
  let nextShot = time + 2.5 + Math.random() * 4;
  const shots: { x: number; y: number; vx: number; vy: number; age: number; life: number }[] = [];
  const pulses: { x: number; y: number; age: number }[] = [];

  function loadSky() {
    if (isStill) return { t: 40, scroll: 0 };
    try {
      const s = JSON.parse(sessionStorage.getItem(SKY_KEY) || "null");
      if (s) return { t: s.t + Math.min(Math.max((Date.now() - s.at) / 1000, 0), 5), scroll: s.scroll || 0 };
    } catch {
      /* nothing saved */
    }
    return { t: 0, scroll: 0 };
  }

  // Colours come from CSS as "r, g, b" triplets so alpha can be applied here.
  function readColors() {
    const cs = getComputedStyle(root);
    const v = (name: string) => cs.getPropertyValue(name).trim();
    return { star: v("--star"), tint: v("--star-tint"), link: v("--star-link"), alpha: parseFloat(v("--star-alpha")) || 1 };
  }

  function makeGlow() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${colors.tint}, 0.55)`);
    grad.addColorStop(0.35, `rgba(${colors.tint}, 0.12)`);
    grad.addColorStop(1, `rgba(${colors.tint}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  // A star placed where its drift (and the scrolling so far) would have
  // taken it by the current sky time.
  function makeStar(): Star {
    const z = 0.15 + 0.85 * Math.pow(rand(), 2.2); // most stars are far away
    const vx = (rand() - 0.5) * 4;
    const vy = (rand() - 0.5) * 4;
    return {
      x: wrap(rand() * w + (DRIFT_X * z + vx) * time, w),
      y: wrap(rand() * h + (DRIFT_Y * z + vy) * time - skyScroll * z * PARALLAX, h),
      z,
      r: 0.4 + z * 1.6,
      phase: rand() * TAU,
      twinkle: 0.5 + rand() * 2,
      vx,
      vy,
      ox: 0,
      oy: 0,
      vox: 0,
      voy: 0,
      tint: rand() < 0.22,
      born: Math.random() * INTRO_SPREAD, // intro only; not seeded, so the layout stays the same
    };
  }

  function resize() {
    const pw = w;
    const ph = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // The canvas's own on-screen size: the visible area minus the
    // scrollbar gutter, the same on every page.
    w = canvas.clientWidth || innerWidth;
    h = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (pw && ph) {
      for (const s of stars) {
        s.x *= w / pw;
        s.y *= h / ph;
      }
    }
    const want = Math.min(MAX_STARS, Math.round(w * h * DENSITY));
    while (stars.length < want) stars.push(makeStar());
    stars.length = Math.min(stars.length, want);
    if (isStill) draw();
  }

  function wrap(v: number, size: number) {
    return ((((v + 20) % (size + 40)) + (size + 40)) % (size + 40)) - 20;
  }

  function step(dt: number) {
    time += dt;
    const scrolled = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    skyScroll += scrolled;
    lens += ((pointer.active ? 1 : 0) - lens) * Math.min(1, dt * 3);

    for (const s of stars) {
      s.x = wrap(s.x + (DRIFT_X * s.z + s.vx) * dt, w);
      s.y = wrap(s.y + (DRIFT_Y * s.z + s.vy) * dt - scrolled * s.z * PARALLAX, h);
      settle(s, dt);
    }
    const box = padBox();
    if (box) {
      placePad(box);
      for (const p of padStars) settle(p, dt);
    }
    const orbEl = document.querySelector<HTMLElement>(".theme-toggle");
    if (orbEl) {
      settle(orb, dt);
      const r = orbEl.getBoundingClientRect();
      const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
      orbEl.style.setProperty("--sky-x", `${(orb.ox + Math.sin(time * 0.5) * 1.2).toFixed(2)}px`);
      orbEl.style.setProperty("--sky-y", `${(orb.oy + Math.sin(time * 0.7 + 1) * 1.5).toFixed(2)}px`);
      orbEl.style.setProperty("--near", (lens * Math.max(0, 1 - d / LINK_R)).toFixed(3));
    }

    if (time > nextShot) {
      spawnShot();
      nextShot = time + 4 + Math.random() * 7;
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      shots[i].age += dt;
      if (shots[i].age > shots[i].life) shots.splice(i, 1);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].age += dt;
      if (pulses[i].age > 1.2) pulses.splice(i, 1);
    }
  }

  // Push a star away from the cursor and let it spring back into place.
  function settle(s: Body, dt: number) {
    let fx = -SPRING * s.ox - DAMPING * s.vox;
    let fy = -SPRING * s.oy - DAMPING * s.voy;
    if (lens > 0.01) {
      const dx = s.x - pointer.x;
      const dy = s.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < LENS_R * LENS_R && d2 > 1) {
        const d = Math.sqrt(d2);
        const k = 1 - d / LENS_R;
        const f = LENS_PUSH * k * k * lens * s.z; // nearer stars react more
        fx += (dx / d) * f;
        fy += (dy / d) * f;
      }
    }
    s.vox += fx * dt;
    s.voy += fy * dt;
    s.ox += s.vox * dt;
    s.oy += s.voy * dt;
  }

  function padBox() {
    const box = document.querySelector(".star-pad")?.getBoundingClientRect();
    return box?.width ? box : null;
  }

  // Where each controller star rests right now: its point on the .star-pad
  // box, bobbing with the whole controller and wandering on its own.
  function placePad(box: DOMRect) {
    const bob = isStill ? 0 : Math.sin(time * 0.7) * 2;
    padStars.forEach((p, i) => {
      p.x = box.left + PAD[i][0] * box.width + Math.sin(time * 0.9 + p.phase) * 1.5;
      p.y = box.top + PAD[i][1] * box.height + bob + Math.cos(time * 1.1 + p.phase * 1.3) * 1.5;
    });
  }

  function spawnShot() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const angle = 0.2 + Math.random() * 0.35; // radians below horizontal
    const speed = 750 + Math.random() * 450;
    shots.push({
      x: w * (0.15 + Math.random() * 0.7),
      y: h * Math.random() * 0.55,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 0.7 + Math.random() * 0.5,
    });
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const A = colors.alpha;
    const px = pointer.x;
    const py = pointer.y;
    const LINK_R2 = LINK_R * LINK_R;

    // Constellation lines between the brighter stars near the cursor.
    if (lens > 0.02) {
      const near: { x: number; y: number; k: number }[] = [];
      for (const s of stars) {
        if (s.z < 0.3) continue;
        const x = s.x + s.ox;
        const y = s.y + s.oy;
        const d2 = (x - px) ** 2 + (y - py) ** 2;
        if (d2 < LINK_R2) near.push({ x, y, k: 1 - Math.sqrt(d2) / LINK_R });
      }
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgb(${colors.link})`;
      for (let i = 0; i < near.length; i++) {
        for (let j = i + 1; j < near.length; j++) {
          const a = near[i];
          const b = near[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK_DIST) continue;
          ctx.globalAlpha = (1 - d / LINK_DIST) * Math.min(a.k, b.k) * lens * 0.95;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Stars.
    const starFill = `rgb(${colors.star})`;
    const tintFill = `rgb(${colors.tint})`;
    const sinceIntro = introStart ? (performance.now() - introStart) / 1000 : Infinity;
    for (const s of stars) {
      const x = s.x + s.ox;
      const y = s.y + s.oy;
      const appear = Math.min(1, Math.max(0, (sinceIntro - s.born) / INTRO_FADE));
      if (appear === 0) continue;
      let a = (0.25 + 0.75 * s.z) * (0.7 + 0.3 * Math.sin(time * s.twinkle + s.phase)) * A * appear;
      let r = s.r;
      if (lens > 0.02) {
        const d2 = (x - px) ** 2 + (y - py) ** 2;
        if (d2 < LINK_R2) {
          const k = 1 - Math.sqrt(d2) / LINK_R;
          a = Math.min(1, a + k * 0.5 * lens);
          r *= 1 + k * 0.6 * lens;
        }
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = s.tint ? tintFill : starFill;
      if (r < 1) {
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      if (s.z > 0.8) {
        const g = r * 9;
        ctx.globalAlpha = a * 0.6;
        ctx.drawImage(glow, x - g / 2, y - g / 2, g, g);
      }
    }

    // The controller, after the other stars on a fresh visit. The part of it
    // near the cursor lights up: stars by their distance, lines fading
    // between their two ends.
    const box = padBox();
    if (box) {
      placePad(box);
      const appear = Math.min(1, Math.max(0, (sinceIntro - INTRO_SPREAD) / INTRO_FADE));
      const reach = isStill ? +pointer.active : lens; // a still sky has no lens but still lights up
      const pts = padStars.map((p): [number, number] => [p.x + p.ox, p.y + p.oy]);
      const lit = pts.map(([x, y]) => reach * Math.max(0, 1 - Math.hypot(x - px, y - py) / PAD_LIGHT));
      ctx.globalAlpha = A * appear;
      ctx.lineWidth = 1;
      for (const [a, b] of PAD_LINES) {
        const line = ctx.createLinearGradient(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
        line.addColorStop(0, `rgba(${colors.link}, ${0.22 + 0.7 * lit[a]})`);
        line.addColorStop(1, `rgba(${colors.link}, ${0.22 + 0.7 * lit[b]})`);
        ctx.strokeStyle = line;
        ctx.beginPath();
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
        ctx.stroke();
      }
      pts.forEach(([x, y], i) => {
        const button = i >= PAD_BUTTONS;
        const k = lit[i];
        const a = Math.min(1, 0.5 * (0.75 + 0.25 * Math.sin(time * 1.6 + i * 1.3)) + 0.6 * k) * A * appear;
        const r = (button ? 1.7 : 1.25) * (1 + 0.6 * k);
        ctx.globalAlpha = a;
        ctx.fillStyle = button ? tintFill : starFill;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        const g = r * 9;
        ctx.globalAlpha = a * (button ? 0.6 : 0.6 * k);
        ctx.drawImage(glow, x - g / 2, y - g / 2, g, g);
      });
    }

    // Click pulses.
    ctx.strokeStyle = `rgb(${colors.link})`;
    ctx.lineWidth = 1;
    for (const p of pulses) {
      ctx.globalAlpha = (1 - p.age / 1.2) * 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.age * 520, 0, TAU);
      ctx.stroke();
    }

    // Shooting stars.
    for (const sh of shots) {
      const hx = sh.x + sh.vx * sh.age;
      const hy = sh.y + sh.vy * sh.age;
      const len = 170 / Math.hypot(sh.vx, sh.vy);
      const tx = hx - sh.vx * len;
      const ty = hy - sh.vy * len;
      const fade = Math.sin((Math.PI * sh.age) / sh.life) * A;
      const grad = ctx.createLinearGradient(tx, ty, hx, hy);
      grad.addColorStop(0, `rgba(${colors.star}, 0)`);
      grad.addColorStop(1, `rgba(${colors.star}, ${fade})`);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  let lastDraw = 0;
  let raf = 0;
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    // Full frame rate while something is happening, ~30 fps otherwise.
    const busy =
      shots.length > 0 ||
      pulses.length > 0 ||
      now - pointer.lastMove < 1500 ||
      (introStart && now - introStart < (INTRO_SPREAD + INTRO_FADE) * 1000);
    if (busy || now - lastDraw > 32) {
      draw();
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  }

  const refreshColors = () => {
    colors = readColors();
    glow = makeGlow();
    if (isStill) draw();
  };
  const themeWatch = new MutationObserver(refreshColors);
  themeWatch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", refreshColors, { signal });
  window.addEventListener("resize", resize, { signal });

  if (!isStill) {
    window.addEventListener(
      "pointerdown",
      (e) => {
        pulses.push({ x: e.clientX, y: e.clientY, age: 0 });
        const kick = (s: Body, dx: number, dy: number, power: number) => {
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < 320) {
            const k = 1 - d / 320;
            s.vox += (dx / d) * power * k;
            s.voy += (dy / d) * power * k;
          }
        };
        for (const s of [...stars, ...padStars]) kick(s, s.x + s.ox - e.clientX, s.y + s.oy - e.clientY, 520);
        // The sun or moon rocks gently, unless it's the thing being clicked.
        const orbEl = document.querySelector(".theme-toggle");
        if (orbEl && !orbEl.contains(e.target as Node)) {
          const r = orbEl.getBoundingClientRect();
          kick(orb, r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY, 70);
        }
      },
      { passive: true, signal }
    );
  }

  resize();
  if (!isStill) raf = requestAnimationFrame(frame);
  // A still sky is drawn once, but the controller comes and goes with the
  // home page and lights up near the cursor, so look again now and then.
  const stillRedraw = isStill ? window.setInterval(draw, 400) : 0;

  return () => {
    persist();
    off.abort();
    themeWatch.disconnect();
    cancelAnimationFrame(raf);
    clearInterval(stillRedraw);
    canvas.remove();
  };
}

export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Custom cursor ───────────────────────────────────────────────────── */
// A dot that tracks the pointer exactly and a ring that follows with a
// little lag. The ring grows over interactive elements and shows the
// element's data-cursor text as a label, e.g. data-cursor="Open".

function startCursor(): () => void {
  const off = new AbortController();
  const signal = off.signal;
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  const label = document.createElement("span");
  ring.append(label);
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.append(ring, dot);
  root.classList.add("has-cursor");

  let x = -100;
  let y = -100;
  let rx = -100;
  let ry = -100;
  let shown = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        rx = x;
        ry = y;
        shown = true;
        root.classList.add("cursor-on");
      }
    },
    { passive: true, signal }
  );
  root.addEventListener(
    "mouseleave",
    () => {
      shown = false;
      root.classList.remove("cursor-on");
    },
    { signal }
  );
  window.addEventListener("pointerdown", () => ring.classList.add("is-down"), { signal });
  window.addEventListener("pointerup", () => ring.classList.remove("is-down"), { signal });

  document.addEventListener(
    "pointerover",
    (e) => {
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>("a, button, label, [data-cursor]") : null;
      const text = target ? target.dataset.cursor || "" : "";
      ring.classList.toggle("is-hover", !!target && !text);
      ring.classList.toggle("is-label", !!text);
      if (text) label.textContent = text;
    },
    { signal }
  );

  let raf = 0;
  (function loop() {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    raf = requestAnimationFrame(loop);
  })();

  return () => {
    off.abort();
    cancelAnimationFrame(raf);
    ring.remove();
    dot.remove();
    root.classList.remove("has-cursor", "cursor-on");
  };
}

/* ── Cursor-reactive name ────────────────────────────────────────────── */
// Letters of the hero name get lighter and narrower as the cursor nears
// (Bricolage Grotesque is a variable font with weight and width axes).

export function startNameLetters(scope: HTMLElement): () => void {
  if (!finePointer() || still()) return () => {};
  const letters = Array.from(scope.querySelectorAll<HTMLElement>(".ch"));
  if (!letters.length) return () => {};
  const off = new AbortController();
  const signal = off.signal;
  let centers: { x: number; y: number }[] = [];

  const measure = () => {
    centers = letters.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
    });
  };
  measure();
  window.addEventListener("resize", measure, { signal });
  document.fonts?.ready.then(() => !signal.aborted && measure());
  // The intro animation moves letters, so measure again once it settles.
  const settle = setTimeout(measure, 3000);

  let queued = 0;
  window.addEventListener(
    "pointermove",
    () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        const px = pointer.x + window.scrollX;
        const py = pointer.y + window.scrollY;
        letters.forEach((el, i) => {
          const dx = px - centers[i].x;
          const dy = py - centers[i].y;
          const k = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 280);
          const ease = k * k * (3 - 2 * k);
          el.style.fontVariationSettings = `"wght" ${Math.round(760 - ease * 540)}, "wdth" ${Math.round(100 - ease * 25)}`;
        });
      });
    },
    { passive: true, signal }
  );

  return () => {
    off.abort();
    clearTimeout(settle);
    cancelAnimationFrame(queued);
  };
}
