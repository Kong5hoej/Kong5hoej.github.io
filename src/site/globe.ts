/* The sun and moon in the theme toggle, drawn as slowly turning globes on
   small canvases. Each has a surface map (longitude × latitude) made once
   from noise; every frame, each pixel of the disc looks up the point of the
   sphere it shows, turned a little further. The moon's light and the sun's
   limb darkening stay put while the surface turns underneath, which is what
   makes them read as balls. */
import { seededRandom } from "./fx.ts";

export type GlobeKind = "sun" | "moon";

type Vec = [number, number, number];
type Noise = (x: number, y: number, z: number) => number;

const SIZE = 112; // canvas pixels; shown at about 38 CSS px, so sharp up to 3x screens
const TW = 256; // surface map: longitude …
const TH = 128; // … × latitude
const TILT = 0.25; // north pole tipped towards us, so features travel in gentle arcs
const ROLL = 0.15;
const TURN: Record<GlobeKind, number> = { sun: 40, moon: 55 }; // seconds per turn
const TAU = Math.PI * 2;

export function startGlobe(canvas: HTMLCanvasElement, kind: GlobeKind): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  canvas.width = canvas.height = SIZE;

  // For each pixel of the disc: where it lands in the surface map at angle
  // 0, how much light it gets (moon) or its limb darkening (sun), and how
  // much of the pixel the disc covers (for a smooth edge).
  const R = SIZE / 2 - 0.5; // fill the canvas, so no gap shows between the disc and its CSS glow
  const at: number[] = [];
  const U: number[] = [];
  const V: number[] = [];
  const light: number[] = [];
  const alpha: number[] = [];
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const sx = (i + 0.5 - SIZE / 2) / R;
      const sy = (SIZE / 2 - j - 0.5) / R; // y up
      const d = Math.hypot(sx, sy);
      const cover = Math.min(1, (1 - d) * R + 0.5);
      if (cover <= 0) continue;
      const z = Math.sqrt(Math.max(0, 1 - d * d));
      // Into the globe's own frame: undo the roll, then the tilt.
      const x1 = sx * Math.cos(ROLL) + sy * Math.sin(ROLL);
      const y1 = -sx * Math.sin(ROLL) + sy * Math.cos(ROLL);
      const y2 = y1 * Math.cos(TILT) + z * Math.sin(TILT);
      const z2 = -y1 * Math.sin(TILT) + z * Math.cos(TILT);
      const lat = Math.asin(Math.max(-1, Math.min(1, y2)));
      at.push((j * SIZE + i) * 4);
      U.push((Math.atan2(x1, z2) / TAU + 0.5) * TW - 0.5);
      V.push(Math.max(0, Math.min(TH - 1.001, (0.5 - lat / Math.PI) * TH - 0.5)));
      alpha.push(cover * 255);
      light.push(kind === "moon" ? moonLight(sx, sy, z) : limb(z));
    }
  }

  const img = ctx.createImageData(SIZE, SIZE);
  const data = img.data;
  let map: Float32Array[] = [];
  const draw = (angle: number) => {
    const shift = (angle / TAU) * TW;
    for (let k = 0; k < at.length; k++) {
      let u = U[k] - shift; // minus: the surface moves left to right
      u -= Math.floor(u / TW) * TW;
      const x0 = u | 0;
      const x1 = x0 + 1 === TW ? 0 : x0 + 1;
      const fx = u - x0;
      const y0 = V[k] | 0;
      const fy = V[k] - y0;
      const i00 = y0 * TW + x0;
      const i01 = y0 * TW + x1;
      const p = at[k];
      if (kind === "moon") {
        const lit = bilinear(map[0], i00, i01, fx, fy) * light[k] * 255;
        data[p] = lit;
        data[p + 1] = lit * 0.99;
        data[p + 2] = lit * 0.965;
      } else {
        const t = light[k] * (1 + 0.4 * (bilinear(map[0], i00, i01, fx, fy) - 0.5)); // granulation, fading towards the edge
        const c = Math.max(0, Math.min(255, Math.round(t * 255))) * 3;
        const spot = bilinear(map[1], i00, i01, fx, fy);
        data[p] = SUN_RAMP[c] + (92 - SUN_RAMP[c]) * spot;
        data[p + 1] = SUN_RAMP[c + 1] + (42 - SUN_RAMP[c + 1]) * spot;
        data[p + 2] = SUN_RAMP[c + 2] + (4 - SUN_RAMP[c + 2]) * spot;
      }
      data[p + 3] = alpha[k];
    }
    ctx.putImageData(img, 0, 0);
  };

  // Making the map takes a few milliseconds, so it waits for a quiet moment
  // instead of holding up the page as it appears.
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stopped = false;
  let raf = 0;
  let last = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 40) return; // 25 fps is plenty for a slow turn
    if (!canvas.closest(".is-on")) return; // the one not showing (see ThemeToggle) can rest
    last = now;
    draw(((now - t0) / 1000 / TURN[kind]) * TAU);
  };
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
  idle(() => {
    if (stopped) return;
    map = kind === "sun" ? sunMap() : moonMap();
    draw(0);
    if (!still) raf = requestAnimationFrame(frame);
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

/* ── Light ───────────────────────────────────────────────────────────── */

// The moon is lit from the upper left. Light wraps a little past the
// terminator, and the night side keeps a faint glow (earthshine).
function moonLight(x: number, y: number, z: number) {
  const dot = -0.449 * x + 0.399 * y + 0.799 * z;
  return 0.12 + Math.max(0, (dot + 0.25) / 1.25);
}

// The sun is darker towards its edge (z is 1 in the middle, 0 at the rim).
function limb(z: number) {
  const intensity = 1 - 0.47 * (1 - z) - 0.23 * (1 - z) ** 2;
  return (intensity - 0.3) / 0.7;
}

// The sun's colours from the dim rim (0) to the white-hot middle (255).
const SUN_RAMP = (() => {
  const stops: [number, number, number, number][] = [
    [0, 201, 93, 10],
    [0.15, 238, 138, 28],
    [0.3, 252, 169, 58],
    [0.5, 255, 200, 100],
    [0.68, 255, 224, 143],
    [0.85, 255, 241, 196],
    [1, 255, 253, 240],
  ];
  const out = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const b = stops.findIndex((s) => s[0] >= t);
    const [t0, ...c0] = stops[Math.max(0, b - 1)];
    const [t1, ...c1] = stops[b];
    const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    for (let ch = 0; ch < 3; ch++) out[i * 3 + ch] = Math.round(c0[ch] + (c1[ch] - c0[ch]) * f);
  }
  return out;
})();

/* ── Surface maps ────────────────────────────────────────────────────── */

// The moon's seas as they sit on the near side: centre and radii on the
// disc, in units of 0–100 across.
const SEAS = [
  [25, 50, 14, 23], // Oceanus Procellarum
  [40, 32, 13, 11], // Mare Imbrium
  [60, 33, 8, 8], // Serenitatis
  [66, 47, 10, 8], // Tranquillitatis
  [85, 37, 5, 6], // Crisium
  [76, 62, 6, 8], // Fecunditatis
  [38, 66, 9, 7], // Nubium
  [24, 71, 5, 5], // Humorum
];

function moonMap(): Float32Array[] {
  const rand = seededRandom(1969);
  const n1 = valueNoise(rand);
  const n2 = valueNoise(rand);
  const n3 = valueNoise(rand);
  const craters = Array.from({ length: 36 }, () => {
    const r = 0.025 + rand() * 0.05;
    return { p: randomPoint(rand), inner: Math.cos(r), rim: Math.cos(r * 1.4) };
  });
  const tycho = face(44, 84);
  const copernicus = face(38, 46);
  const e1 = normalize(cross([0, 1, 0], tycho)); // a frame around Tycho for its rays
  const e2 = cross(tycho, e1);
  const albedo = new Float32Array(TW * TH);
  eachTexel((q, i) => {
    let a = 0.9 + 0.14 * (fbm(n1, q, 3, 3) - 0.5);
    // The seas, where they are on the real near side, with ragged edges.
    let sea = 0;
    if (q[2] > -0.2) {
      const X = q[0] + 0.12 * (fbm(n2, q, 5, 2) - 0.5);
      const Y = -q[1] + 0.12 * (fbm(n2, q, 5, 2, 17) - 0.5);
      for (const [cx, cy, rx, ry] of SEAS) {
        sea = Math.max(sea, smooth(1.15, 0.8, Math.hypot((X - (cx - 50) / 50) / (rx / 50), (Y - (cy - 50) / 50) / (ry / 50))));
      }
      sea *= smooth(-0.2, 0.15, q[2]);
    }
    // A few small ones on the far side.
    sea = Math.max(sea, 0.7 * smooth(0.6, 0.7, fbm(n3, q, 2.5, 2)) * smooth(0.15, -0.25, q[2]));
    a *= 1 - 0.33 * sea;
    a *= 0.9 + 0.2 * n3(q[0] * 30, q[1] * 30, q[2] * 30); // fine grain
    for (const c of craters) {
      const d = dot(q, c.p);
      if (d > c.inner) a *= 0.9;
      else if (d > c.rim) a *= 1.1;
    }
    // Bright young craters: Tycho with its rays, and Copernicus.
    const dt = angle(q, tycho);
    const ray = Math.max(0, Math.cos(6 * Math.atan2(dot(q, e2), dot(q, e1)) + 0.7)) ** 24;
    a += 0.5 * Math.exp(-dt / 0.03) + 0.12 * Math.exp(-dt / 0.1) + 0.1 * ray * Math.exp(-dt / 0.7) * smooth(0.04, 0.1, dt);
    a += 0.35 * Math.exp(-angle(q, copernicus) / 0.025);
    albedo[i] = a;
  });
  return [albedo];
}

function sunMap(): Float32Array[] {
  const rand = seededRandom(2604);
  const n = valueNoise(rand);
  // Sunspots [centre, umbra radius]: the group from the old drawing on the
  // near side, and a few more round the back so some are always in view.
  const onBack = (lon: number, lat: number): Vec => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  const spots: [Vec, number][] = [
    [face(62, 40), 0.05],
    [face(67.5, 43.5), 0.03],
    [face(11, 60), 0.04],
    [onBack(2.3, 0.28), 0.05],
    [onBack(2.42, 0.22), 0.03],
    [onBack(3.6, -0.3), 0.04],
    [onBack(4.6, 0.12), 0.045],
  ];
  const gran = new Float32Array(TW * TH);
  const spot = new Float32Array(TW * TH);
  eachTexel((q, i) => {
    gran[i] = fbm(n, q, 18, 2);
    let s = 0;
    for (const [p, r] of spots) {
      const t = angle(q, p) / r;
      s = Math.max(s, t < 1 ? 0.9 : 0.45 * smooth(2.2, 1.2, t)); // dark umbra, softer penumbra
    }
    spot[i] = s;
  });
  return [gran, spot];
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

// A map value blended from the four texels around a point (i00 is the
// top-left one, i01 its right neighbour, fx/fy how far across).
function bilinear(m: Float32Array, i00: number, i01: number, fx: number, fy: number) {
  return (m[i00] * (1 - fx) + m[i01] * fx) * (1 - fy) + (m[i00 + TW] * (1 - fx) + m[i01 + TW] * fx) * fy;
}

// Calls fn with the point on the unit sphere at the middle of each texel.
function eachTexel(fn: (q: Vec, i: number) => void) {
  for (let y = 0; y < TH; y++) {
    const lat = Math.PI / 2 - ((y + 0.5) / TH) * Math.PI;
    for (let x = 0; x < TW; x++) {
      const lon = ((x + 0.5) / TW) * TAU - Math.PI;
      fn([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)], y * TW + x);
    }
  }
}

// The point of the near side seen at (cx, cy) on the disc (0–100 across).
function face(cx: number, cy: number): Vec {
  const x = (cx - 50) / 50;
  const y = (50 - cy) / 50;
  return [x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))];
}

function randomPoint(rand: () => number): Vec {
  const y = rand() * 2 - 1;
  const lon = rand() * TAU;
  const r = Math.sqrt(1 - y * y);
  return [r * Math.sin(lon), y, r * Math.cos(lon)];
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec): Vec => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const angle = (a: Vec, b: Vec) => Math.acos(Math.min(1, dot(a, b)));

// 0 at e0, 1 at e1, eased between (e0 may be larger than e1).
function smooth(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// Smooth random values in 3D (value noise), 0–1.
function valueNoise(rand: () => number): Noise {
  const perm = new Uint8Array(512);
  const vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    vals[i] = rand();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  perm.copyWithin(256, 0, 256);
  const h = (x: number, y: number, z: number) => vals[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]];
  const ease = (t: number) => t * t * (3 - 2 * t);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return (x, y, z) => {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const Z = Math.floor(z);
    const u = ease(x - X);
    const v = ease(y - Y);
    const w = ease(z - Z);
    return mix(
      mix(mix(h(X, Y, Z), h(X + 1, Y, Z), u), mix(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v),
      mix(mix(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), mix(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v),
      w
    );
  };
}

// Layered noise: detail on top of broad shapes, 0–1.
function fbm(n: Noise, q: Vec, freq: number, octaves: number, offset = 0) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * n(q[0] * freq + offset, q[1] * freq + offset, q[2] * freq + offset);
    norm += amp;
    freq *= 2;
    amp *= 0.5;
  }
  return sum / norm;
}
