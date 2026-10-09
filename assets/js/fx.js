/* Decorative effects: the starfield background, the custom cursor and the
   cursor-reactive name. The site works fully without this file, and every
   effect respects prefers-reduced-motion. */
(function () {
  "use strict";

  const root = document.documentElement;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const TAU = Math.PI * 2;

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

  createSky();
  if (finePointer && !still) {
    setupCursor();
    setupNameLetters();
  }

  /* ── Starfield ───────────────────────────────────────────────────────── */
  // Stars sit at different depths: nearer ones are bigger, brighter and drift
  // faster. Around the cursor they part like a lens and link up into
  // constellation lines; a click sends out a pulse, and now and then a
  // shooting star crosses the sky.

  function createSky() {
    const canvas = document.createElement("canvas");
    canvas.className = "sky";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");

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

    // Every page draws the same sky: stars come from a fixed seed, and both
    // the sky clock and the scroll parallax carry over between page loads, so
    // navigating doesn't reshuffle or jolt it.
    const rand = seededRandom(2604);
    const SKY_KEY = "sky-clock";
    const saved = loadSky();
    let time = saved.t;
    let skyScroll = saved.scroll; // all scrolling so far, across pages
    window.addEventListener("pagehide", () => {
      try {
        sessionStorage.setItem(SKY_KEY, JSON.stringify({ t: time, scroll: skyScroll, at: Date.now() }));
      } catch (_) {
        /* storage unavailable: the sky just restarts */
      }
    });

    // On a fresh load (html.intro, set in <head>) the stars come out one by one
    // before the page content appears.
    const introStart = root.classList.contains("intro") && !still ? performance.now() : 0;
    const INTRO_SPREAD = 1.1; // seconds over which stars appear
    const INTRO_FADE = 0.6; // how long each star takes to fade in

    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let colors = readColors();
    let glow = makeGlow();
    let lens = 0; // 0..1, eases in while the cursor is over the page
    let lastScroll = window.scrollY;
    let nextShot = time + 2.5 + Math.random() * 4;
    const shots = [];
    const pulses = [];

    function seededRandom(seed) {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function loadSky() {
      if (still) return { t: 40, scroll: 0 };
      try {
        const s = JSON.parse(sessionStorage.getItem(SKY_KEY));
        if (s) return { t: s.t + Math.min(Math.max((Date.now() - s.at) / 1000, 0), 5), scroll: s.scroll || 0 };
      } catch (_) {
        /* nothing saved */
      }
      return { t: 0, scroll: 0 };
    }

    // Colours come from CSS as "r, g, b" triplets so alpha can be applied here.
    function readColors() {
      const cs = getComputedStyle(root);
      const v = (name) => cs.getPropertyValue(name).trim();
      return {
        star: v("--star"),
        tint: v("--star-tint"),
        link: v("--star-link"),
        alpha: parseFloat(v("--star-alpha")) || 1,
      };
    }

    function makeGlow() {
      const size = 64;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
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
    function makeStar() {
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
        ox: 0, // displacement from the cursor / clicks, springs back to 0
        oy: 0,
        vox: 0,
        voy: 0,
        tint: rand() < 0.22,
        born: Math.random() * INTRO_SPREAD, // intro only; not seeded, so the layout stays the same
      };
    }

    function resize() {
      const pw = w, ph = h;
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
      if (still) draw();
    }

    function wrap(v, size) {
      return ((((v + 20) % (size + 40)) + (size + 40)) % (size + 40)) - 20;
    }

    function step(dt) {
      time += dt;
      const scrolled = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      skyScroll += scrolled;
      lens += ((pointer.active ? 1 : 0) - lens) * Math.min(1, dt * 3);
      const px = pointer.x, py = pointer.y;

      for (const s of stars) {
        s.x = wrap(s.x + (DRIFT_X * s.z + s.vx) * dt, w);
        s.y = wrap(s.y + (DRIFT_Y * s.z + s.vy) * dt - scrolled * s.z * PARALLAX, h);

        let fx = -SPRING * s.ox - DAMPING * s.vox;
        let fy = -SPRING * s.oy - DAMPING * s.voy;
        if (lens > 0.01) {
          const dx = s.x - px, dy = s.y - py, d2 = dx * dx + dy * dy;
          if (d2 < LENS_R * LENS_R && d2 > 1) {
            const d = Math.sqrt(d2), k = 1 - d / LENS_R;
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
      const px = pointer.x, py = pointer.y;
      const LINK_R2 = LINK_R * LINK_R;

      // Constellation lines between the brighter stars near the cursor.
      if (lens > 0.02) {
        const near = [];
        for (const s of stars) {
          if (s.z < 0.3) continue;
          const x = s.x + s.ox, y = s.y + s.oy;
          const d2 = (x - px) ** 2 + (y - py) ** 2;
          if (d2 < LINK_R2) near.push({ x, y, k: 1 - Math.sqrt(d2) / LINK_R });
        }
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgb(${colors.link})`;
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const a = near[i], b = near[j];
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
        const x = s.x + s.ox, y = s.y + s.oy;
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
        const hx = sh.x + sh.vx * sh.age, hy = sh.y + sh.vy * sh.age;
        const len = 170 / Math.hypot(sh.vx, sh.vy);
        const tx = hx - sh.vx * len, ty = hy - sh.vy * len;
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
    function frame(now) {
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
      requestAnimationFrame(frame);
    }

    const refreshColors = () => {
      colors = readColors();
      glow = makeGlow();
      if (still) draw();
    };
    new MutationObserver(refreshColors).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", refreshColors);
    window.addEventListener("resize", resize);

    if (!still) {
      window.addEventListener(
        "pointerdown",
        (e) => {
          pulses.push({ x: e.clientX, y: e.clientY, age: 0 });
          for (const s of stars) {
            const dx = s.x + s.ox - e.clientX, dy = s.y + s.oy - e.clientY;
            const d = Math.hypot(dx, dy);
            if (d > 1 && d < 320) {
              const k = 1 - d / 320;
              s.vox += (dx / d) * 520 * k;
              s.voy += (dy / d) * 520 * k;
            }
          }
        },
        { passive: true }
      );
    }

    resize();
    if (!still) requestAnimationFrame(frame);
  }

  /* ── Custom cursor ───────────────────────────────────────────────────── */
  // A dot that tracks the pointer exactly and a ring that follows with a
  // little lag. The ring grows over interactive elements and shows the
  // element's data-cursor text as a label, e.g. data-cursor="Open".

  function setupCursor() {
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    const label = document.createElement("span");
    ring.append(label);
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.append(ring, dot);
    root.classList.add("has-cursor");

    let x = -100, y = -100, rx = -100, ry = -100, shown = false;

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
      { passive: true }
    );
    root.addEventListener("mouseleave", () => {
      shown = false;
      root.classList.remove("cursor-on");
    });
    window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
    window.addEventListener("pointerup", () => ring.classList.remove("is-down"));

    document.addEventListener("pointerover", (e) => {
      const target = e.target instanceof Element ? e.target.closest("a, button, label, [data-cursor]") : null;
      const text = target ? target.dataset.cursor || "" : "";
      ring.classList.toggle("is-hover", !!target && !text);
      ring.classList.toggle("is-label", !!text);
      if (text) label.textContent = text;
    });

    (function loop() {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ── Cursor-reactive name ────────────────────────────────────────────── */
  // Letters of the hero name get lighter and narrower as the cursor nears
  // (Bricolage Grotesque is a variable font with weight and width axes).

  function setupNameLetters() {
    const letters = Array.from(document.querySelectorAll(".hero-name .ch"));
    if (!letters.length) return;
    let centers = [];

    const measure = () => {
      centers = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
      });
    };
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts) document.fonts.ready.then(measure);
    // The intro animation moves letters, so measure again once it settles.
    setTimeout(measure, 3000);

    let queued = false;
    window.addEventListener(
      "pointermove",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
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
      { passive: true }
    );
  }
})();
