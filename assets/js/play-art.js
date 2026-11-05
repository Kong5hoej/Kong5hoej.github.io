/* Pixel art for the town on play.html, all of it drawn in code: the palette,
   sprites written as text grids, a 3×5 bitmap font, and painters for every
   tile and building. Everything is drawn at art resolution (16px tiles);
   the game scales it up in whole pixels so it stays crisp. */
(function () {
  "use strict";

  const T = 16; // tile size in art pixels

  // Sweetie 16 by GrafxKid, plus a few earth, skin and lamplight tones.
  const C = {
    ink: "#1a1c2c",
    plum: "#5d275d",
    red: "#b13e53",
    orange: "#ef7d57",
    yellow: "#ffcd75",
    lime: "#a7f070",
    green: "#38b764",
    teal: "#257179",
    navy: "#29366f",
    blue: "#3b5dc9",
    sky: "#41a6f6",
    cyan: "#73eff7",
    white: "#f4f4f4",
    silver: "#94b0c2",
    slate: "#566c86",
    charcoal: "#333c57",
    moss: "#2c9a5a",
    dirt: "#e2b47a",
    dirtDark: "#c08552",
    dirtLight: "#f0cf9c",
    wood: "#a35f3c",
    woodDark: "#6b3a2e",
    woodLight: "#cf8a55",
    cream: "#f7e6c4",
    creamDark: "#dfc092",
    glow: "#fff1b8",
  };

  /* ── Drawing helpers ─────────────────────────────────────────────────── */

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function rect(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }

  const dot = (g, x, y, color) => rect(g, x, y, 1, 1, color);

  // A filled rectangle with a 1px ink edge.
  function box(g, x, y, w, h, fill, edge = C.ink) {
    rect(g, x, y, w, h, edge);
    rect(g, x + 1, y + 1, w - 2, h - 2, fill);
  }

  // A stable pseudo-random number for (a, b, c), so a tile always gets the
  // same tufts and pebbles.
  function hash(a, b = 0, c = 0) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483587);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // A sprite from rows of characters: each one a key in `colors`, "." clear.
  function sprite(rows, colors) {
    const c = canvas(rows[0].length, rows.length);
    const g = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (colors[row[x]]) dot(g, x, y, colors[row[x]]);
    });
    return c;
  }

  function flip(src) {
    const c = canvas(src.width, src.height);
    const g = c.getContext("2d");
    g.translate(src.width, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  // Gives every shape on `src` a 1px ink edge, drawn in the clear pixels
  // around it.
  function outline(src) {
    const { width: w, height: h } = src;
    const g = src.getContext("2d");
    const a = g.getImageData(0, 0, w, h).data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) dot(g, x, y, C.ink);
      }
    }
    return src;
  }

  /* ── 3×5 bitmap font, for signs on the buildings ─────────────────────── */

  const GLYPHS = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
    E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
    I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
    M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
    Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
    U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
    Y: "101101010010010", Z: "111001010100111",
    0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
    4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010",
    8: "111101111101111", 9: "111101111001110",
    " ": "000000000000000", "-": "000000111000000", ".": "000000000000010", "!": "010010010000010",
    "'": "010010000000000", "&": "010101010101011",
  };

  function text(g, str, x, y, color) {
    [...String(str).toUpperCase()].forEach((ch, i) => {
      const bits = GLYPHS[ch] || GLYPHS[" "];
      for (let j = 0; j < 15; j++) if (bits[j] === "1") dot(g, x + i * 4 + (j % 3), y + ((j / 3) | 0), color);
    });
  }

  const textWidth = (str) => Math.max(0, String(str).length * 4 - 1);

  /* ── Characters ──────────────────────────────────────────────────────── */
  // k ink, h hair, H hair highlight, s skin, S skin shade, c shirt,
  // C shirt shade, p trousers. Each body is a standing frame; a walking
  // frame lifts the body a pixel and swaps in striding legs.

  const BODY = {
    down: [
      "................",
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhHHhhhhk...",
      "...khHhhhhhhk...",
      "...khhhhhhhhk...",
      "...khsshhsshk...",
      "...kskssssksk...",
      "...kskssssksk...",
      "....kSssssSk....",
      "...kcccccccck...",
      "..kcCccccccCck..",
      "..kcCccccccCck..",
      "..ksCccccccCsk..",
      "...kpppkkpppk...",
      "...kkkk..kkkk...",
    ],
    up: [
      "................",
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhhhhhhhk...",
      "...khhhhhHhhk...",
      "...khhhhhHhhk...",
      "...khhhhhhhhk...",
      "...khhhhhhhhk...",
      "...kshhhhhhsk...",
      "....khhhhhhk....",
      "...kcCCCCCCck...",
      "..kcCccccccCck..",
      "..kcCccccccCck..",
      "..ksCccccccCsk..",
      "...kpppkkpppk...",
      "...kkkk..kkkk...",
    ],
    left: [
      "................",
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhhhhHhhk...",
      "...khhhhhhhhk...",
      "...khhhhhhhhk...",
      "...kshhhhhhhk...",
      "..ksskshhhhhk...",
      "..ksskshhhhhk...",
      "...kSsssshhk....",
      "....kcccccck....",
      "....kcccCcck....",
      "....kcccCcck....",
      "....kcccsCck....",
      "....kppppppk....",
      "...kkkkkkkk.....",
    ],
  };

  const LEGS = {
    front: ["...kpppkkpppk...", "...kpppk.kkkk...", "...kkkk........."],
    side: ["....kppppppk....", "...kppk..kppk...", "..kkkk....kkk..."],
  };

  const stepRows = (rows, legs) => [...rows.slice(1, 14), ...legs];

  // Frames per direction: [stand, step A, stand, step B].
  function character(look) {
    const colors = {
      k: C.ink,
      h: look.hair,
      H: look.hairLight,
      s: look.skin,
      S: look.skinShade,
      c: look.shirt,
      C: look.shirtShade,
      p: look.pants,
    };
    const make = (rows) => sprite(rows, colors);
    const down = make(BODY.down);
    const downStep = make(stepRows(BODY.down, LEGS.front));
    const up = make(BODY.up);
    const upStep = make(stepRows(BODY.up, LEGS.front));
    const left = make(BODY.left);
    const leftStep = make(stepRows(BODY.left, LEGS.side));
    const blink = BODY.down.slice();
    blink[7] = "...kssssssssk...";
    return {
      down: [down, downStep, down, flip(downStep)],
      up: [up, upStep, up, flip(upStep)],
      left: [left, leftStep, left, leftStep],
      right: [flip(left), flip(leftStep), flip(left), flip(leftStep)],
      blink: make(blink),
    };
  }

  /* ── Other sprites ───────────────────────────────────────────────────── */

  const ROWS = {
    tree: [
      ".....kkkkkk.....",
      "...kkLLLlllkk...",
      "..kLLLllllllgk..",
      ".kLLlllllllllgk.",
      ".kLllllllllllgk.",
      "kLllllllllllggdk",
      "klllllllllllggdk",
      "kglllllllllgggdk",
      "kgglllllllgggddk",
      ".kggglllgggggdk.",
      ".kdgggggggggddk.",
      "..kddgggggdddk..",
      "...kkddddddkk...",
      "......ktTk......",
      "......ktTk......",
      ".....kktTkk.....",
    ],
    bush: [
      "................",
      "................",
      "................",
      "................",
      ".....kkkkkk.....",
      "...kkLLlllgkk...",
      "..kLLlllllllgk..",
      ".kLlllllllllggk.",
      ".klllllllllgggk.",
      ".kglllllllgggdk.",
      ".kggglllgggggdk.",
      "..kdgggggggddk..",
      "...kkddddddkk...",
      "................",
      "................",
      "................",
    ],
    rock: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "......kkkkk.....",
      "....kkWssssk....",
      "...kWssssssSk...",
      "..kWsssssssSSk..",
      "..ksssssssSSSk..",
      "..kSssssSSSSSk..",
      "...kSSSSSSSSk...",
      "....kkkkkkkk....",
      "................",
      "................",
      "................",
    ],
    lamp: [
      "................",
      "......kkkk......",
      ".....kyyyyk.....",
      ".....kyWyyk.....",
      ".....kyyyyk.....",
      "....kkkkkkkk....",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      ".......cs.......",
      "......kcsk......",
      ".....kkkkkk.....",
    ],
    sign: [
      "................",
      "................",
      "..kkkkkkkkkkkk..",
      "..kOOOOOOOOOOk..",
      "..kOkkkOkkOOOk..",
      "..kOOOOOOOOOOk..",
      "..kOkkOkkkkOOk..",
      "..kOOOOOOOOOOk..",
      "..kwwwwwwwwwwk..",
      "..kkkkkkkkkkkk..",
      "......kwWk......",
      "......kwWk......",
      "......kwWk......",
      "......kwWk......",
      "......kwWk......",
      ".....kkkkkk.....",
    ],
    mailbox: [
      "................",
      "................",
      "....kkkkkkkk....",
      "...krrrrrrrrk...",
      "...krkkkkkkrk...",
      "...krrrrrrrrk...",
      "...krrryyrrrk...",
      "...krryyyyrrk...",
      "...krrryyrrrk...",
      "...krrrrrrrrk...",
      "...kRRRRRRRRk...",
      "....kkkkkkkk....",
      ".......cs.......",
      ".......cs.......",
      "......kcsk......",
      ".....kkkkkk.....",
    ],
    duck: [
      "................",
      "................",
      "................",
      "....kkk.........",
      "...kyyyk........",
      "..kykyyyk.......",
      ".kooyyyyk.......",
      "..kkyyyyk...kk..",
      "....kyyyykkkyk..",
      "...kyyyyyyyyyk..",
      "..kyyyyyyyyyyk..",
      "..kyyyyyyyyyYk..",
      "...kYyyyyyyYk...",
      "....kkkkkkkk....",
      "................",
      "................",
    ],
    bug: [
      "................",
      "...k........k...",
      "....k......k....",
      ".....kkkkkk.....",
      "....kaaaaaak....",
      "...kawwaawwak...",
      "...kawkaawkak...",
      "...kaaaaaaaak...",
      "..kkAaakkaaAkk..",
      ".k.kAaaaaaaAk.k.",
      "...kAAaaaaAAk...",
      "..kkAAAaaAAAkk..",
      ".k.kAAAAAAAAk.k.",
      "....kAAAAAAk....",
      "....k.kkkk.k....",
      "...k........k...",
    ],
    clock: [
      "..kkkkk..",
      ".kwwkwwk.",
      "kwwwkwwwk",
      "kwwwkwwwk",
      "kwwwkkkwk",
      "kwwwwwwwk",
      "kwwwwwwwk",
      ".kwwwwwk.",
      "..kkkkk..",
    ],
  };

  const LEAF = { k: C.ink, L: C.lime, l: C.green, g: C.moss, d: C.teal, t: C.wood, T: C.woodDark };
  const STONE = { k: C.ink, W: C.white, s: C.silver, S: C.slate };

  const SPR = {
    tree: sprite(ROWS.tree, LEAF),
    bush: sprite(ROWS.bush, LEAF),
    rock: sprite(ROWS.rock, STONE),
    lamp: sprite(ROWS.lamp, { k: C.ink, y: "#d6e2ea", W: C.white, c: C.charcoal, s: C.slate }),
    lampOn: sprite(ROWS.lamp, { k: C.ink, y: C.yellow, W: C.glow, c: C.charcoal, s: C.slate }),
    sign: sprite(ROWS.sign, { k: C.ink, O: C.woodLight, w: C.wood, W: C.woodDark }),
    mailbox: sprite(ROWS.mailbox, { k: C.ink, r: C.red, R: C.plum, y: C.yellow, c: C.charcoal, s: C.slate }),
    duck: sprite(ROWS.duck, { k: C.ink, y: C.yellow, Y: C.orange, o: C.orange }),
    clock: sprite(ROWS.clock, { k: C.ink, w: C.white }),
  };

  const bug = (body, shade) => sprite(ROWS.bug, { k: C.ink, a: body, A: shade, w: C.white });

  /* ── Ground tiles ────────────────────────────────────────────────────── */

  const GROUND = { ".": "grass", ":": "flowers", '"': "tall", "=": "path", ">": "path", _: "plaza", "~": "water", q: "court", n: "court" };
  const SOFT = new Set(["grass", "flowers", "tall"]);
  const N4 = [[0, -1, "up"], [0, 1, "down"], [-1, 0, "left"], [1, 0, "right"]];

  function groundOf(m, x, y) {
    if (m.isBuilding(x, y)) return "building";
    const ch = m.at(x, y);
    if (GROUND[ch]) return GROUND[ch];
    if (ch === "F" || ch === "v") return "plaza";
    // Lamps, signs and the like stand on paving when there's paving next
    // to them, and on grass otherwise.
    for (const [dx, dy] of N4) if (m.at(x + dx, y + dy) === "_") return "plaza";
    return "grass";
  }

  function grass(g, x, y, seed) {
    rect(g, x, y, T, T, C.green);
    const n = 2 + (seed % 3);
    for (let i = 0; i < n; i++) {
      const r = hash(seed, i, 7);
      const tx = x + 1 + (r % 12);
      const ty = y + 2 + ((r >>> 8) % 12);
      dot(g, tx, ty, C.moss);
      dot(g, tx + 2, ty, C.moss);
      dot(g, tx + 1, ty + 1, C.moss);
      if (r & 0x10000) dot(g, tx + 1, ty - 1, C.lime);
    }
  }

  function flowers(g, x, y, seed, frame) {
    grass(g, x, y, seed);
    const petals = [C.white, C.red, C.orange, C.white];
    for (let i = 0; i < 2; i++) {
      const r = hash(seed, i, 13);
      const fx = x + 3 + (r % 10);
      const fy = y + 3 + ((r >>> 8) % 9);
      const p = petals[(r >>> 16) & 3];
      if ((frame + i) % 2 === 0) {
        dot(g, fx, fy - 1, p);
        dot(g, fx - 1, fy, p);
        dot(g, fx + 1, fy, p);
        dot(g, fx, fy + 1, p);
      } else {
        dot(g, fx - 1, fy - 1, p);
        dot(g, fx + 1, fy - 1, p);
        dot(g, fx - 1, fy + 1, p);
        dot(g, fx + 1, fy + 1, p);
      }
      dot(g, fx, fy, C.yellow);
    }
  }

  // Grass frays over the edges of paths where they meet grass.
  function fray(g, x, y, side, seed) {
    for (let i = 0; i < T; i++) {
      const deep = hash(seed, i, side.length) % 3 === 0;
      const [ax, ay, bx, by] = {
        up: [x + i, y, x + i, y + 1],
        down: [x + i, y + 15, x + i, y + 14],
        left: [x, y + i, x + 1, y + i],
        right: [x + 15, y + i, x + 14, y + i],
      }[side];
      dot(g, ax, ay, C.green);
      dot(g, bx, by, deep ? C.green : C.dirtDark);
    }
  }

  function path(g, x, y, seed, soft) {
    rect(g, x, y, T, T, C.dirt);
    for (let i = 0; i < 4; i++) {
      const r = hash(seed, i, 3);
      dot(g, x + 1 + (r % 14), y + 1 + ((r >>> 8) % 14), i % 2 ? C.dirtLight : C.dirtDark);
    }
    N4.forEach(([, , side]) => soft[side] && fray(g, x, y, side, seed));
  }

  function plaza(g, x, y, edge) {
    rect(g, x, y, T, T, C.silver);
    for (let row = 0; row < 2; row++) {
      const sy = y + row * 8;
      rect(g, x, sy + 7, T, 1, C.slate);
      rect(g, x, sy, T, 1, "#b4c7d4");
      const off = row ? 4 : 0;
      rect(g, x + ((off + 7) % 8), sy, 1, 7, C.slate);
      rect(g, x + ((off + 7) % 8) + 8, sy, 1, 7, C.slate);
    }
    if (edge.up) rect(g, x, y, T, 1, C.slate);
    if (edge.down) rect(g, x, y + 15, T, 1, C.charcoal);
    if (edge.left) rect(g, x, y, 1, T, C.slate);
    if (edge.right) rect(g, x + 15, y, 1, T, C.charcoal);
  }

  function water(g, x, y, seed, frame, shore) {
    rect(g, x, y, T, T, C.blue);
    const sway = [0, 1, 2, 1][frame];
    for (let i = 0; i < 2; i++) {
      const r = hash(seed, i, 5);
      rect(g, x + 2 + ((r % 9) + sway), y + 3 + ((r >>> 8) % 10), 3, 1, C.sky);
    }
    if ((seed + frame) % 7 === 0) dot(g, x + 3 + (seed % 10), y + 3 + ((seed >>> 4) % 10), C.cyan);
    const foam = (i) => ((i + frame) % 4 < 2 ? C.white : C.cyan);
    if (shore.up) {
      rect(g, x, y, T, 2, C.dirtLight);
      for (let i = 0; i < T; i++) dot(g, x + i, y + 2, foam(i));
    }
    if (shore.down) {
      rect(g, x, y + 14, T, 2, C.dirtLight);
      for (let i = 0; i < T; i++) dot(g, x + i, y + 13, foam(i));
    }
    if (shore.left) {
      rect(g, x, y, 2, T, C.dirtLight);
      for (let i = 0; i < T; i++) dot(g, x + 2, y + i, foam(i));
    }
    if (shore.right) {
      rect(g, x + 14, y, 2, T, C.dirtLight);
      for (let i = 0; i < T; i++) dot(g, x + 13, y + i, foam(i));
    }
  }

  function blade(g, x, y, sway) {
    dot(g, x + 1 + sway, y, C.lime);
    rect(g, x + sway, y + 1, 3, 1, C.green);
    dot(g, x, y + 2, C.green);
    dot(g, x + 2, y + 2, C.green);
    dot(g, x + 1, y + 3, C.teal);
  }

  // Tall grass. With `front`, only the blades in front of someone standing
  // in it, drawn over their legs.
  function tall(g, x, y, frame, front = false) {
    const sway = frame % 2;
    if (front) {
      rect(g, x, y + 12, T, 4, C.moss);
      for (let bx = 0; bx < T; bx += 4) blade(g, x + bx, y + 9, sway);
      return;
    }
    rect(g, x, y, T, T, C.moss);
    [[0, 0], [2, 5], [0, 10]].forEach(([ox, oy]) => {
      for (let bx = ox; bx < T; bx += 4) blade(g, x + bx, y + oy, sway);
    });
  }

  function court(g, x, y, edge) {
    rect(g, x, y, T, T, C.teal);
    if (edge.up) rect(g, x, y + 1, T, 1, C.white);
    if (edge.down) rect(g, x, y + 14, T, 1, C.white);
    if (edge.left) rect(g, x + 1, y, 1, T, C.white);
    if (edge.right) rect(g, x + 14, y, 1, T, C.white);
  }

  function paintGround(g, m, x, y, frame) {
    const kind = groundOf(m, x, y);
    const px = x * T;
    const py = y * T;
    const seed = hash(x, y);
    const sides = (test) => Object.fromEntries(N4.map(([dx, dy, side]) => [side, test(groundOf(m, x + dx, y + dy))]));
    switch (kind) {
      case "path":
        path(g, px, py, seed, sides((k) => SOFT.has(k)));
        break;
      case "plaza":
        plaza(g, px, py, sides((k) => k !== "plaza" && k !== "path" && k !== "building"));
        break;
      case "water":
        water(g, px, py, seed, frame, sides((k) => k !== "water"));
        break;
      case "tall":
        tall(g, px, py, frame);
        break;
      case "flowers":
        flowers(g, px, py, seed, frame);
        break;
      case "court":
        court(g, px, py, sides((k) => k !== "court"));
        break;
      default:
        grass(g, px, py, seed);
    }
  }

  /* ── Things on the ground ────────────────────────────────────────────── */

  function fence(g, m, x, y) {
    const px = x * T;
    const py = y * T;
    const link = (dx, dy) => m.at(x + dx, y + dy) === "f";
    if (link(-1, 0)) {
      rect(g, px, py + 5, 7, 2, C.wood);
      rect(g, px, py + 10, 7, 2, C.wood);
    }
    if (link(1, 0)) {
      rect(g, px + 9, py + 5, 7, 2, C.wood);
      rect(g, px + 9, py + 10, 7, 2, C.wood);
    }
    if (link(0, 1)) rect(g, px + 7, py + 12, 2, 4, C.woodDark);
    box(g, px + 6, py + 2, 4, 12, C.woodLight);
    rect(g, px + 8, py + 3, 1, 10, C.wood);
  }

  function net(g, m, x, y) {
    const px = x * T;
    const py = y * T;
    rect(g, px, py + 4, T, 1, C.white);
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < T; i++) if ((i + j) % 2 === 0) dot(g, px + i, py + 5 + j, C.ink);
    }
    rect(g, px, py + 10, T, 1, C.silver);
    if (m.at(x - 1, y) !== "n") box(g, px + 1, py + 1, 3, 13, C.silver);
    if (m.at(x + 1, y) !== "n") box(g, px + 12, py + 1, 3, 13, C.silver);
  }

  function paintThing(g, m, x, y, night, lights) {
    const ch = m.at(x, y);
    const px = x * T;
    const py = y * T;
    if (ch === "T") g.drawImage(SPR.tree, px, py);
    else if (ch === "b") g.drawImage(SPR.bush, px, py);
    else if (ch === "o") g.drawImage(SPR.rock, px, py);
    else if (ch === "M") g.drawImage(SPR.mailbox, px, py);
    else if (ch === "f") fence(g, m, x, y);
    else if (ch === "n") net(g, m, x, y);
    else if (/[1-9]/.test(ch)) g.drawImage(SPR.sign, px, py);
    else if (ch === "L") {
      g.drawImage(night ? SPR.lampOn : SPR.lamp, px, py);
      if (night) lights.push({ x: px + 8, y: py + 4, r: 44, warm: true });
    }
  }

  function car(body, dark, light) {
    const c = canvas(32, 16);
    const g = c.getContext("2d");
    for (let i = 0; i < 4; i++) rect(g, 10 - i, 3 + i, 12 + i * 2, 1, body);
    rect(g, 10, 4, 5, 1, C.cyan);
    rect(g, 9, 5, 6, 1, C.cyan);
    rect(g, 8, 6, 7, 1, C.sky);
    rect(g, 16, 4, 5, 1, C.cyan);
    rect(g, 16, 5, 6, 1, C.cyan);
    rect(g, 16, 6, 7, 1, C.sky);
    dot(g, 11, 4, C.white);
    rect(g, 2, 7, 28, 5, body);
    rect(g, 3, 7, 26, 1, light);
    rect(g, 2, 11, 28, 1, dark);
    rect(g, 15, 8, 1, 3, dark);
    dot(g, 13, 9, dark);
    dot(g, 2, 8, C.yellow);
    dot(g, 2, 9, C.yellow);
    dot(g, 29, 8, C.red);
    outline(c);
    for (const wx of [5, 21]) {
      rect(g, wx + 1, 10, 4, 6, C.ink);
      rect(g, wx, 11, 6, 4, C.ink);
      rect(g, wx + 1, 11, 4, 4, C.charcoal);
      rect(g, wx + 2, 12, 2, 2, C.silver);
    }
    return c;
  }

  function paintCar(g, c) {
    g.globalAlpha = 0.3;
    rect(g, c.x * T + 3, c.y * T + 15, 26, 1, C.ink);
    g.globalAlpha = 1;
    g.drawImage(car(c.body, c.dark, c.light), c.x * T, c.y * T);
  }

  function paintFountain(g, f, frame) {
    const x = f.x * T;
    const y = f.y * T;
    const cx = 24;
    const cy = 30;
    for (let yy = 0; yy < 48; yy++) {
      for (let xx = 0; xx < 48; xx++) {
        const dx = (xx + 0.5 - cx) / 22;
        const dy = (yy + 0.5 - cy) / 15;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        let col = C.blue;
        if (d > 0.86) col = C.ink;
        else if (d > 0.6) col = yy < cy ? C.white : C.silver;
        else if (d > 0.52) col = C.slate;
        else if ((((Math.sqrt(d) * 9 - frame * 0.5) % 2) + 2) % 2 < 0.35) col = C.sky;
        dot(g, x + xx, y + yy, col);
      }
    }
    box(g, x + 21, y + 13, 6, 18, C.silver);
    rect(g, x + 22, y + 14, 1, 16, C.white);
    rect(g, x + 25, y + 14, 1, 16, C.slate);
    box(g, x + 15, y + 10, 18, 5, C.silver);
    rect(g, x + 16, y + 11, 16, 1, C.white);
    rect(g, x + 17, y + 12, 14, 1, C.sky);
    rect(g, x + 23, y + 2, 2, 9, C.cyan);
    dot(g, x + 23, y + 2 + (frame % 2), C.white);
    for (let i = 0; i < 3; i++) {
      const t = (i / 3 + frame / 12) % 1;
      const dy = Math.round(12 + t * t * 14);
      const dx = Math.round(t * 6);
      dot(g, x + 15 - dx, y + dy, i % 2 ? C.white : C.cyan);
      dot(g, x + 32 + dx, y + dy, i % 2 ? C.cyan : C.white);
    }
  }

  /* ── Buildings ───────────────────────────────────────────────────────── */

  const STYLES = {
    house: { roof: C.orange, roofDark: C.red, roofLight: C.yellow, wall: C.cream, wallDark: C.creamDark, pattern: "planks", door: C.wood, sign: [C.woodDark, C.white], frame: C.white, chimney: true, flowerBoxes: true },
    lab: { roof: C.teal, roofDark: C.navy, roofLight: C.green, wall: C.white, wallDark: C.silver, pattern: "plaster", door: C.charcoal, sign: [C.ink, C.cyan], frame: C.charcoal, screens: true, dish: true, animated: true },
    office: { flat: true, roof: C.charcoal, roofDark: C.ink, roofLight: C.slate, wall: C.navy, wallDark: C.ink, pattern: "glass", door: "glass", sign: [C.teal, C.white] },
    school: { roof: C.navy, roofDark: C.ink, roofLight: C.blue, wall: C.red, wallDark: C.plum, pattern: "brick", door: C.woodDark, sign: [C.ink, C.yellow], frame: C.white, clock: true, flag: true, animated: true },
    shop: { roof: C.blue, roofDark: C.navy, roofLight: C.sky, wall: C.white, wallDark: C.silver, pattern: "plaster", door: "glass", sign: [C.navy, C.white], frame: C.blue, awning: true },
    post: { roof: C.red, roofDark: C.plum, roofLight: C.orange, wall: C.white, wallDark: C.silver, pattern: "planks", door: C.red, sign: [C.red, C.white], frame: C.red },
  };

  // Left edges for as many `size`-wide items as fit between x0 and x1,
  // evenly spaced.
  function spread(x0, x1, size, gap = 6) {
    const n = Math.floor((x1 - x0 - gap) / (size + gap));
    if (n <= 0) return [];
    const space = (x1 - x0 - n * size) / (n + 1);
    return Array.from({ length: n }, (_, i) => Math.round(x0 + space * (i + 1) + size * i));
  }

  function wall(g, s, x, y, w, h, b, frame, night, lights) {
    if (s.pattern === "planks") {
      for (let yy = y + 4; yy < y + h; yy += 5) rect(g, x, yy, w, 1, s.wallDark);
    } else if (s.pattern === "brick") {
      for (let yy = y + 3, row = 0; yy < y + h; yy += 4, row++) {
        rect(g, x, yy, w, 1, s.wallDark);
        for (let xx = x + (row % 2 ? 2 : 6); xx < x + w; xx += 8) rect(g, xx, yy - 3, 1, 3, s.wallDark);
      }
    } else if (s.pattern === "plaster") {
      for (let i = 0; i < (w * h) / 50; i++) {
        const r = hash(x, y, i);
        dot(g, x + (r % w), y + ((r >>> 8) % h), s.wallDark);
      }
    } else if (s.pattern === "glass") {
      const doorL = b.door.x * T;
      for (let yy = y + 1, r = 0; yy + 7 <= y + h; yy += 9, r++) {
        for (let xx = x + 2, c = 0; xx + 8 <= x + w; xx += 10, c++) {
          if (xx < doorL + 15 && xx + 8 > doorL + 1 && yy + 7 > y + h - 18) continue;
          const lit = night && hash(xx, yy, 5) % 3 !== 0;
          rect(g, xx, yy, 8, 7, lit ? C.yellow : night ? C.charcoal : C.sky);
          if (lit) {
            rect(g, xx + 1, yy + 1, 6, 5, C.glow);
            lights.push({ x: xx + 4, y: yy + 4, r: 14 });
          } else if (!night) {
            rect(g, xx, yy, 8, 1, C.cyan);
            const k = (r + c) % 4;
            dot(g, xx + 5 - k, yy + 2, C.white);
            dot(g, xx + 6 - k, yy + 1 + 1, C.cyan);
          }
        }
      }
    }
  }

  function paintWindow(g, s, x, y, frame, night, lights) {
    const w = 12;
    const h = 10;
    box(g, x, y, w, h, s.frame);
    if (s.screens) {
      // The lab's windows are screens full of code, with a blinking cursor.
      rect(g, x + 1, y + 1, w - 2, h - 2, C.navy);
      const cols = [C.lime, C.cyan, C.orange, C.white];
      for (let r = 0; r < 3; r++) {
        const len = 2 + (hash(x, r, 3) % 6);
        rect(g, x + 2 + (r === 1 ? 2 : 0), y + 2 + r * 2, len, 1, cols[hash(x, r) % 4]);
      }
      if (frame % 2 === 0) rect(g, x + 2, y + 8, 2, 1, C.white);
      if (night) lights.push({ x: x + w / 2, y: y + h / 2, r: 22 });
    } else {
      rect(g, x + 1, y + 1, w - 2, h - 2, night ? C.yellow : C.sky);
      rect(g, x + 1, y + 1, w - 2, 2, night ? C.glow : C.cyan);
      if (!night) {
        dot(g, x + 2, y + 5, C.white);
        dot(g, x + 3, y + 4, C.white);
      }
      rect(g, x + (w >> 1), y + 1, 1, h - 2, s.frame);
      rect(g, x + 1, y + (h >> 1), w - 2, 1, s.frame);
      if (night) lights.push({ x: x + w / 2, y: y + h / 2, r: 22 });
    }
    if (s.flowerBoxes) {
      box(g, x - 1, y + h - 1, w + 2, 4, C.woodDark);
      for (let i = 0; i < w; i += 2) dot(g, x + i, y + h - 2, [C.red, C.yellow, C.orange][(i / 2) % 3]);
    }
  }

  function paintDoor(g, s, doorX, bottom, night, lights) {
    const x = doorX + 3;
    const h = 15;
    const y = bottom - 5 - h;
    if (s.door === "glass") {
      box(g, x - 1, y, 12, h + 1, C.charcoal);
      rect(g, x, y + 1, 10, h - 1, night ? C.yellow : C.sky);
      rect(g, x, y + 1, 10, 2, night ? C.glow : C.cyan);
      rect(g, x + 5, y + 1, 1, h - 1, C.charcoal);
      if (night) lights.push({ x: doorX + 8, y: y + 8, r: 24 });
    } else {
      box(g, x, y, 10, h + 1, s.door);
      g.globalAlpha = 0.28;
      rect(g, x + 2, y + 2, 6, 4, C.ink);
      rect(g, x + 2, y + 8, 6, 5, C.ink);
      g.globalAlpha = 1;
      dot(g, x + 7, y + 8, C.yellow);
    }
    rect(g, doorX + 1, bottom - 5, 14, 4, C.silver);
    rect(g, doorX + 1, bottom - 2, 14, 1, C.slate);
  }

  function paintBuilding(g, b, frame, night, lights, emitters) {
    const s = STYLES[b.style] || STYLES.house;
    const X = b.x * T;
    const Y = b.y * T;
    const W = b.w * T;
    const H = b.h * T;
    const wallH = s.flat ? H - 14 : b.h >= 5 ? 38 : 30;
    const wy = Y + H - wallH; // top of the wall
    const top = wy + 2;
    const bottom = Y + H - 5;
    const doorX = b.door.x * T;

    // Walls, inset so the roof overhangs them.
    box(g, X + 2, wy - 2, W - 4, wallH + 2, s.wall);
    wall(g, s, X + 3, top, W - 6, bottom - top, b, frame, night, lights);
    rect(g, X + 3, bottom, W - 6, 4, C.slate);
    rect(g, X + 3, bottom, W - 6, 1, C.silver);

    // Roof
    if (s.flat) {
      box(g, X, Y + 1, W, 14, s.roof);
      rect(g, X + 1, Y + 2, W - 2, 2, s.roofLight);
      rect(g, X + 1, Y + 12, W - 2, 2, s.roofDark);
      for (const ax of [X + 6, X + W - 20]) {
        box(g, ax, Y + 4, 14, 7, C.silver);
        rect(g, ax + 2, Y + 6, 10, 1, C.slate);
        rect(g, ax + 2, Y + 8, 10, 1, C.slate);
      }
    } else {
      box(g, X, Y + 1, W, wy - Y + 1, s.roof);
      for (let ry = Y + 7, row = 0; ry < wy - 3; ry += 4, row++) {
        rect(g, X + 1, ry, W - 2, 1, s.roofDark);
        for (let tx = X + 3 + (row % 2) * 4; tx < X + W - 2; tx += 8) rect(g, tx, ry - 2, 1, 2, s.roofDark);
      }
      rect(g, X + 1, Y + 2, W - 2, 2, s.roofLight);
      rect(g, X + 1, wy - 2, W - 2, 2, s.roofDark);
    }
    rect(g, X + 3, wy + 2, W - 6, 2, s.wallDark); // shade under the eave

    // Awning, windows and door
    if (s.awning) {
      for (let xx = X + 3; xx < X + W - 3; xx++) {
        const stripe = Math.floor((xx - X) / 4) % 2;
        rect(g, xx, top, 1, stripe ? 5 : 6, stripe ? C.white : C.sky);
      }
      rect(g, X + 3, top, W - 6, 1, C.navy);
    }
    if (s.pattern !== "glass") {
      const wyy = top + (s.awning ? 9 : b.h >= 5 ? 7 : 5);
      [...spread(X + 4, doorX + 1, 12), ...spread(doorX + 15, X + W - 4, 12)].forEach((wx) =>
        paintWindow(g, s, wx, wyy, frame, night, lights)
      );
    }
    paintDoor(g, s, doorX, Y + H, night, lights);

    // Sign on the roof
    const bw = textWidth(b.label) + 6;
    const bx = Math.round(X + W / 2 - bw / 2);
    const by = s.flat ? Y + 4 : wy - 13;
    box(g, bx, by, bw, 9, s.sign[0]);
    text(g, b.label, bx + 3, by + 2, s.sign[1]);

    // Extras
    if (s.chimney) {
      box(g, X + W - 22, Y + 4, 9, 12, C.slate);
      rect(g, X + W - 22, Y + 4, 9, 3, C.charcoal);
      emitters.push({ x: X + W - 18, y: Y + 3 });
    }
    if (s.dish) {
      box(g, X + 8, Y + 6, 14, 6, C.white);
      rect(g, X + 9, Y + 7, 12, 1, C.silver);
      rect(g, X + 14, Y + 12, 3, 6, C.slate);
      rect(g, X + W - 12, Y + 4, 1, 12, C.slate);
      box(g, X + W - 13, Y + 2, 3, 3, frame < 2 ? C.red : C.plum);
    }
    if (s.clock) g.drawImage(SPR.clock, Math.round(X + W / 2 - 4), Y + 8);
    if (s.flag) {
      // Made in Denmark.
      rect(g, X + 10, Y + 3, 1, 18, C.silver);
      for (let i = 0; i < 10; i++) {
        const off = frame % 2 && i >= 5 ? 1 : 0;
        for (let j = 0; j < 7; j++) dot(g, X + 11 + i, Y + 3 + j + off, i === 3 || j === 3 ? C.white : C.red);
      }
    }
  }

  /* ── The whole map ───────────────────────────────────────────────────── */
  // Bakes four animation frames of the map. The first is painted in full;
  // the others copy it and repaint only what moves. Also collects where the
  // lights are (for night) and where chimney smoke rises.

  function bakeMap(m, night) {
    const W = m.w * T;
    const H = m.h * T;
    const lights = [];
    const emitters = [];
    const base = canvas(W, H);
    const g = base.getContext("2d");
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) paintGround(g, m, x, y, 0);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) paintThing(g, m, x, y, night, lights);
    m.cars.forEach((c) => paintCar(g, c));
    m.fountains.forEach((f) => paintFountain(g, f, 0));
    m.buildings.forEach((b) => paintBuilding(g, b, 0, night, lights, emitters));

    const moving = [];
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const k = groundOf(m, x, y);
        if ((k === "water" || k === "flowers" || k === "tall") && GROUND[m.at(x, y)]) moving.push([x, y]);
      }
    }
    const frames = [base];
    for (let f = 1; f < 4; f++) {
      const c = canvas(W, H);
      const cg = c.getContext("2d");
      cg.drawImage(base, 0, 0);
      moving.forEach(([x, y]) => paintGround(cg, m, x, y, f));
      m.fountains.forEach((fo) => {
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) paintGround(cg, m, fo.x + x, fo.y + y, f);
        paintFountain(cg, fo, f);
      });
      m.buildings
        .filter((b) => (STYLES[b.style] || {}).animated)
        .forEach((b) => paintBuilding(cg, b, f, night, [], []));
      frames.push(c);
    }
    return { frames, lights, emitters };
  }

  // Tall grass in front of someone's legs, for both sway frames.
  const tallFront = [0, 1].map((f) => {
    const c = canvas(T, T);
    tall(c.getContext("2d"), 0, 0, f, true);
    return c;
  });

  // Grass with a tree on it, for whatever lies beyond the edge of the map.
  const forest = (() => {
    const c = canvas(T, T);
    const g = c.getContext("2d");
    grass(g, 0, 0, 1);
    g.drawImage(SPR.tree, 0, 0);
    return c;
  })();

  window.PixelArt = { C, TILE: T, character, bug, sprites: SPR, tallFront, forest, bakeMap, hash };
})();
