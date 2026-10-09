/* Renders every page from window.SITE (assets/js/content.js): the shared
   header, menu and footer, plus the content of the current page (set by
   <body data-page="…">). Visual effects (starfield, cursor) live in fx.js. */
(function () {
  "use strict";

  const S = window.SITE;
  if (!S) {
    console.error("window.SITE is missing. Check assets/js/content.js for syntax errors.");
    return;
  }
  const P = S.person;
  const PAGES = S.pages || {};
  const page = document.body.dataset.page;

  // The pages in the main navigation, in order. The phone menu numbers
  // them (01, 02, …).
  const NAV = [
    { id: "projects", href: "projects.html", label: "Projects" },
    { id: "experience", href: "experience.html", label: "Experience" },
    { id: "toolbox", href: "toolbox.html", label: "Toolbox" },
    { id: "cv", href: "cv.html", label: "CV" },
    { id: "contact", href: "contact.html", label: "Contact" },
  ];

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  // Escaped text where *words* become <em>words</em>.
  const rich = (v) => esc(v).replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Joins HTML fragments, skipping empty ones.
  const join = (parts, sep = "") => parts.filter(Boolean).join(sep);

  const pad = (n) => String(n).padStart(2, "0");

  const ICONS = {
    github:
      '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    linkedin:
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    arrow: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    // The code editor on the front page.
    files:
      '<path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    blocks:
      '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    warning:
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    remote: '<path d="m5 7 5 5-5 5"/><path d="m19 7-5 5 5 5"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  function fmtDate(value) {
    if (!value) return "Present";
    const [y, m] = String(value).split("-").map(Number);
    return m ? MONTH.format(new Date(y, m - 1)) : String(y);
  }
  const dateRange = (e) => (e.start ? `${fmtDate(e.start)} – ${fmtDate(e.end)}` : fmtDate(e.end));

  // Newest first: ongoing entries on top, then by end date, then by start date.
  const sortKey = (v) => (v ? String(v).padEnd(7, "-13") : "9999-99");
  const byRecent = (a, b) =>
    sortKey(b.end).localeCompare(sortKey(a.end)) || sortKey(b.start).localeCompare(sortKey(a.start));

  const extLink = (href, label, cls = "", cursor = "") =>
    href
      ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer"${cursor ? ` data-cursor="${esc(cursor)}"` : ""}>${label}</a>`
      : "";

  const prettyUrl = (url) => String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

  // All CV entry lists as [title, entries, (entry) => [heading, org, bullets]].
  function entryGroups(workTitle) {
    const cv = S.cv || {};
    return [
      [workTitle, cv.experience, (e) => [e.role, e.org, e.bullets]],
      ["Education", cv.education, (e) => [e.degree, e.school, e.details]],
      ...(cv.sections || []).map((s) => [s.title, s.items, (e) => [e.role || e.title, e.org, e.bullets]]),
    ].filter(([, list]) => list && list.length);
  }

  const pageHead = (title, intro) => `
    <div class="page-head">
      <h1 class="page-title reveal">${rich(title)}</h1>
      ${intro ? `<p class="page-intro reveal" style="--d:80ms">${rich(intro)}</p>` : ""}
    </div>`;

  const viewSwitch = () => `
    <fieldset class="switch">
      <legend class="visually-hidden">Which experience to show</legend>
      <span class="switch-thumb" aria-hidden="true"></span>
      <input type="radio" name="view" id="view-relevant" value="relevant" checked />
      <label for="view-relevant" data-cursor="Filter">Relevant</label>
      <input type="radio" name="view" id="view-all" value="all" />
      <label for="view-all" data-cursor="All">All experience</label>
    </fieldset>
    <p id="view-count" class="view-count" aria-live="polite"></p>`;

  /* ── Shared chrome: header, menu, footer ─────────────────────────────── */

  // Lucide's rocket, with the exhaust split out so it can flicker, plus a porthole.
  const ROCKET = `
    <svg class="rocket" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path class="rocket-flame" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      <circle cx="16" cy="8" r="1.5"/>
    </svg>`;

  function renderChrome() {
    const current = (id) => (id === page ? ' aria-current="page"' : "");
    const header = $(".site-header");
    if (header) {
      // The nav is a "dock" in the middle of the header: just a rocket (a link
      // home) until it's hovered, then the links slide out to the right. On
      // touch screens and narrow windows, .menu-rocket opens the menu instead.
      header.innerHTML = `
        <div class="container header-inner">
          <div class="dock-slot">
            <nav class="dock${arrivedFromDock() ? " is-open" : ""}" aria-label="Main">
              <a class="dock-rocket" href="./" aria-label="Home" data-cursor="Home"${current("home")}>${ROCKET}</a>
              <div class="dock-side">
                <div class="dock-links">
                  ${NAV.map((n) => `<a href="${n.href}"${current(n.id)}>${n.label}</a>`).join("")}
                </div>
              </div>
            </nav>
            <button class="menu-rocket" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu">${ROCKET}</button>
          </div>
          <div class="header-tools">
            <button class="theme-toggle" type="button"></button>
          </div>
        </div>`;

      // The phone menu lives outside the header: the header's backdrop blur
      // would otherwise trap a fixed-position overlay inside it.
      const menu = document.createElement("div");
      menu.className = "menu";
      menu.id = "menu";
      menu.hidden = true;
      menu.innerHTML = `
        <nav aria-label="Main">
          <a href="./" style="--i:0"${current("home")}><span>00</span><span class="menu-label">Home</span></a>
          ${NAV.map((n, i) => `<a href="${n.href}" style="--i:${i + 1}"${current(n.id)}><span>${pad(i + 1)}</span><span class="menu-label">${n.label}</span></a>`).join("")}
        </nav>`;
      header.after(menu);
    }

    const footer = $(".site-footer");
    if (footer) {
      footer.innerHTML = `
        <div class="container footer-inner">
          <span>© ${new Date().getFullYear()} ${esc(P.name)}</span>
          <span>Made in Denmark · Plain HTML, CSS &amp; JS · <a href="https://github.com/Kong5hoej/Kong5hoej.github.io" data-cursor="Code">Source</a></span>
        </div>`;
    }
  }

  function setupTheme() {
    const root = document.documentElement;
    const btn = $(".theme-toggle");
    if (!btn) return;
    const isDark = () =>
      root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const paint = () => {
      const dark = isDark();
      btn.innerHTML = `<span class="tt-icon" aria-hidden="true"></span><span class="tt-label">${dark ? "Light" : "Dark"}</span>`;
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (_) {
        /* storage unavailable: theme just won't persist */
      }
      paint();
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paint);
    paint();
  }

  function setupHeaderScroll() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Clicking a link in the dock loads a new page, which would normally show
  // the dock already shut. Instead, the click leaves a note so the next page
  // starts with the dock open (.is-open) and then closes it softly.
  const DOCK_KEY = "dock-handoff";

  function arrivedFromDock() {
    try {
      const flag = sessionStorage.getItem(DOCK_KEY);
      sessionStorage.removeItem(DOCK_KEY);
      return flag === "1";
    } catch (_) {
      return false;
    }
  }

  function setupDockHandoff() {
    const dock = $(".dock");
    if (!dock) return;
    dock.addEventListener("click", (e) => {
      if (!e.target.closest("a") || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      try {
        sessionStorage.setItem(DOCK_KEY, "1");
      } catch (_) {
        /* storage unavailable: the dock just starts closed */
      }
    });
    if (dock.classList.contains("is-open")) {
      // Wait until the open dock has been painted, then let it close (or stay
      // open for as long as the pointer is over it).
      requestAnimationFrame(() => requestAnimationFrame(() => dock.classList.remove("is-open")));
    }
  }

  // The full-screen menu, opened by .menu-rocket on touch screens and narrow
  // windows. (On desktop the dock opens on hover; no script needed.)
  function setupNav() {
    const btn = $(".menu-rocket");
    const menu = $("#menu");
    if (!btn || !menu) return;

    const setMenu = (open) => {
      menu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) $("a", menu).focus();
    };

    btn.addEventListener("click", () => setMenu(menu.hidden));
    menu.addEventListener("click", (e) => e.target === menu && setMenu(false)); // tap on the backdrop
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        setMenu(false);
        btn.focus();
      }
    });
    // Close the menu if the window changes to the hover dock layout.
    window
      .matchMedia("(min-width: 1200px) and (hover: hover)")
      .addEventListener("change", (e) => e.matches && setMenu(false));
  }

  /* ── Home ────────────────────────────────────────────────────────────── */

  function renderHome() {
    const words = String(P.name).split(/\s+/);
    let letterIndex = 0;
    const letters = (word) =>
      [...word].map((ch) => `<span class="ch" style="--i:${letterIndex++}">${esc(ch)}</span>`).join("");
    // Every second word is set in the italic serif; the rest react to the cursor (fx.js).
    const nameHtml = words
      .map((w, i) => {
        const mark = i === words.length - 1 ? '<span class="name-mark"></span>' : "";
        return i % 2 === 1
          ? `<span class="name-word name-serif" style="--i:${letterIndex++}">${esc(w)}${mark}</span>`
          : `<span class="name-word">${letters(w)}${mark}</span>`;
      })
      .join("");

    $("#main").innerHTML = `
      <section class="hero" aria-label="Introduction">
        ${P.availability ? `<div class="hero-top"><p class="status"><span class="status-dot" aria-hidden="true"></span>${esc(P.availability)}</p></div>` : ""}
        <div class="hero-main">
          <h1 class="hero-name"><span class="visually-hidden">${esc(P.name)}</span><span aria-hidden="true">${nameHtml}</span></h1>
          <div class="hero-side">
            ${renderEditor()}
            <div class="hero-intro" style="--k:1">
              <p class="hero-role">${esc(P.role)}</p>
              <p class="hero-tagline">${rich(P.tagline)}</p>
            </div>
            <div class="hero-actions" style="--k:2">
              <a class="btn btn-primary" href="cv.html" data-cursor="Read">View my CV ${icon("right")}</a>
              <a class="btn" href="projects.html" data-cursor="Open">Projects</a>
              <a class="btn btn-ghost" href="contact.html">Say hej</a>
              ${P.links.github ? `<a class="btn btn-ghost btn-icon" href="${esc(P.links.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub" data-cursor="Visit">${icon("github")}</a>` : ""}
            </div>
          </div>
        </div>
      </section>`;
    setupEditor();
  }

  // The quick facts (S.facts) as a TypeScript file in a VS Code-style
  // window. The window is decoration and hidden from screen readers; a
  // visually hidden list next to it carries the same facts.
  function renderEditor() {
    const facts = S.facts || {};
    const keys = Object.keys(facts);
    if (!keys.length) return "";

    const name = String(P.firstName || "").toLowerCase().replace(/[^\w$]/g, "") || "me";
    const file = `${name}.ts`;
    const workspace = P.links.website ? prettyUrl(P.links.website) : "portfolio";

    // Each line of code is a list of [token type, text] pairs. Brackets are
    // coloured by how deeply they're nested, as in VS Code.
    const bracket = (ch, depth) => [`br${depth % 3}`, ch];
    const value = (v, depth) => {
      if (Array.isArray(v)) {
        const items = v.flatMap((x, i) => [...(i ? [["pun", ", "]] : []), ...value(x, depth + 1)]);
        return [bracket("[", depth), ...items, bracket("]", depth)];
      }
      if (typeof v === "number") return [["num", String(v)]];
      if (typeof v === "boolean") return [["kw", String(v)]];
      return [["str", JSON.stringify(String(v))]];
    };
    const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? ["prop", k] : ["str", JSON.stringify(k)]);
    const code = [
      [["com", "// Fig. 01: quick facts"]],
      [["ctl", "export"], ["pun", " "], ["kw", "const"], ["pun", " "], ["var", name], ["pun", " = "], bracket("{", 0)],
      ...keys.map((k) => [["ind", "  "], key(k), ["pun", ": "], ...value(facts[k], 1), ["pun", ","]]),
      [bracket("}", 0), ["pun", " "], ["kw", "as"], ["pun", " "], ["kw", "const"], ["pun", ";"]],
    ];

    // Every character gets its own span, so setupEditor() can type them in
    // one at a time and put the caret between any two of them.
    const chars = (text) => [...text].map((c) => `<span class="c">${esc(c)}</span>`).join("");
    const lines = code
      .map(
        (tokens, i) => `
          <div class="vsc-line${tokens[0][0] === "ind" ? " is-indented" : ""}">
            <span class="vsc-ln">${i + 1}</span><span class="vsc-text">${tokens.map(([type, text]) => `<span class="tk-${type}">${chars(text)}</span>`).join("")}</span>
          </div>`
      )
      .join("");

    const label = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    const plain = (v) => (Array.isArray(v) ? v.join(", ") : String(v));

    // The other tabs open pages: package.json (the file that lists a
    // project's dependencies) opens the Toolbox, with a pulsing dot in place
    // of VS Code's "unsaved changes" mark to catch the eye. They're mouse
    // and touch shortcuts (tabindex -1): the same pages are in the nav.
    return `
      <aside class="vsc" aria-label="Quick facts" style="--k:0">
        <dl class="visually-hidden">${keys.map((k) => `<dt>${esc(label(k))}</dt><dd>${esc(plain(facts[k]))}</dd>`).join("")}</dl>
        <div class="vsc-window" aria-hidden="true">
          <div class="vsc-titlebar">
            <span class="vsc-lights"><i></i><i></i><i></i></span>
            <span class="vsc-command">${icon("search")}${esc(workspace)}</span>
          </div>
          <div class="vsc-body">
            <div class="vsc-activity">
              <span class="is-active">${icon("files")}</span><span>${icon("search")}</span><span>${icon("branch")}</span><span>${icon("blocks")}</span>
            </div>
            <div class="vsc-editor">
              <div class="vsc-tabs">
                <span class="vsc-tab is-active"><i class="vsc-fi vsc-fi-ts">TS</i>${esc(file)}${icon("close")}</span>
                <a class="vsc-tab is-dirty" href="toolbox.html" tabindex="-1" data-cursor="Open"><i class="vsc-fi vsc-fi-json">{}</i>package.json<span class="status-dot"></span></a>
                <a class="vsc-tab" href="projects.html" tabindex="-1" data-cursor="Open"><i class="vsc-fi vsc-fi-json">{}</i>projects.json</a>
                <a class="vsc-tab" href="cv.html" tabindex="-1" data-cursor="Open"><i class="vsc-fi vsc-fi-md">M↓</i>cv.md</a>
              </div>
              <p class="vsc-crumbs">src<span>›</span><i class="vsc-fi vsc-fi-ts">TS</i>${esc(file)}<span>›</span>${esc(name)}</p>
              <div class="vsc-code">${lines}</div>
            </div>
          </div>
          <div class="vsc-status">
            <span class="vsc-remote">${icon("remote")}</span>
            <span>${icon("branch")}main</span>
            <span>${icon("error")}0 ${icon("warning")}0</span>
            <span class="vsc-pos">Ln 1, Col 1</span>
            <span class="vsc-opt">Spaces: 2</span>
            <span class="vsc-opt">UTF-8</span>
            <span>TypeScript</span>
          </div>
        </div>
      </aside>`;
  }

  // On a fresh visit the code is typed in once the window has risen into
  // place; moving between pages shows it straight away. Afterwards, a click
  // moves the caret, and the status bar follows it like the real thing.
  function setupEditor() {
    const code = $(".vsc-code");
    if (!code) return;
    const ed = code.closest(".vsc");
    const pos = $(".vsc-pos", ed);
    const lines = $$(".vsc-line", code);
    const chars = lines.map((l) => $$(".c", l));
    const last = lines.length - 1;
    const caret = document.createElement("span");
    caret.className = "vsc-caret";

    // Puts the caret after `col` characters of line `ln` (both from 0).
    // Moving it restarts its blink, so it stays solid while typing.
    const place = (ln, col) => {
      if (col) chars[ln][col - 1].after(caret);
      else $(".vsc-text", lines[ln]).prepend(caret);
      lines.forEach((l, i) => l.classList.toggle("is-active", i === ln));
      pos.textContent = `Ln ${ln + 1}, Col ${col + 1}`;
    };

    let typing = false;
    code.addEventListener("click", (e) => {
      const line = e.target.closest(".vsc-line");
      if (!line || typing) return;
      const ln = lines.indexOf(line);
      const ch = e.target.closest(".c");
      let col = chars[ln].length;
      if (ch) {
        const r = ch.getBoundingClientRect();
        col = chars[ln].indexOf(ch) + (e.clientX > r.left + r.width / 2 ? 1 : 0);
      }
      place(ln, col);
    });

    const fresh = document.documentElement.classList.contains("intro");
    if (!fresh || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(last, chars[last].length);
      return;
    }

    // .is-typing hides every line and character not yet marked .on.
    typing = true;
    ed.classList.add("is-typing");
    lines[0].classList.add("on");
    place(0, 0);
    let ln = 0;
    let col = 0;
    const isIndent = (c) => c && c.parentElement.classList.contains("tk-ind");
    const type = () => {
      const row = chars[ln];
      if (col < row.length) {
        // Indentation appears in one go, as the editor would insert it.
        const auto = isIndent(row[col]);
        do {
          row[col++].classList.add("on");
        } while (auto && isIndent(row[col]));
        place(ln, col);
        setTimeout(type, auto ? 0 : 8 + Math.random() * 18);
      } else if (ln < last) {
        ln += 1;
        col = 0;
        lines[ln].classList.add("on");
        place(ln, 0);
        setTimeout(type, 70);
      } else {
        typing = false;
        ed.classList.remove("is-typing");
      }
    };
    // Start once the window has risen in (at --intro + 0.5s, see
    // .hero-side in style.css) and is mostly on screen: on phones it can
    // start below the fold.
    const intro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro")) || 0;
    const readyAt = performance.now() + intro * 1000 + 1000;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setTimeout(type, Math.max(0, readyAt - performance.now()));
      },
      { threshold: 0.6 }
    );
    io.observe(ed);
  }

  /* ── Projects ────────────────────────────────────────────────────────── */

  function renderProjects() {
    const projects = S.projects || [];
    const pg = PAGES.projects || {};
    $("#main").innerHTML =
      pageHead(pg.title || "Selected *work*", pg.intro) +
      `<ol class="index">${projects
        .map((p, i) => {
          const primary = p.live || p.repo;
          const title = primary
            ? extLink(primary, esc(p.name), "index-link", p.live ? "Visit" : "Code")
            : esc(p.name);
          const source = p.live && p.repo ? extLink(p.repo, `Source ${icon("arrow")}`, "index-sub", "Code") : "";
          return `
            <li class="index-row reveal${primary ? " is-link" : ""}" style="--d:${120 + i * 70}ms">
              <span class="index-no">${pad(i + 1)}</span>
              <div class="index-main">
                <h2 class="index-title">${title}</h2>
                ${p.description ? `<p class="index-desc">${esc(p.description)}</p>` : ""}
                ${source}
              </div>
              <span class="index-stack">${esc((p.tags || []).join(" · "))}</span>
              <span class="index-year">${esc(p.year || "")}</span>
              <span class="index-arrow" aria-hidden="true">${primary ? icon("arrow") : ""}</span>
            </li>`;
        })
        .join("")}</ol>`;
  }

  /* ── Experience ──────────────────────────────────────────────────────── */

  function renderExperience() {
    const pg = PAGES.experience || {};
    const groups = entryGroups("Work");
    const about = S.about || [];
    const cv = S.cv || {};

    const timeline = groups
      .map(
        ([title, list, fields], gi) => `
        <section class="tl-group reveal" style="--d:${120 + gi * 80}ms" data-filterable>
          <h2 class="tl-heading">${esc(title)}</h2>
          <ol class="tl">
            ${[...list]
              .sort(byRecent)
              .map((e) => {
                const [heading, org, items] = fields(e);
                return `
                <li class="tl-item" data-relevant="${e.relevant !== false}">
                  <p class="tl-date">${esc(dateRange(e))}</p>
                  <h3 class="tl-title">${esc(heading)}</h3>
                  ${org || e.location ? `<p class="tl-org">${esc(join([org, e.location], " · "))}</p>` : ""}
                  ${items && items.length ? `<ul class="tl-bullets">${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </li>`;
              })
              .join("")}
          </ol>
        </section>`
      )
      .join("");

    // The tools themselves are listed on the Toolbox page, so this section
    // points there and keeps the spoken languages.
    const toolCount = (S.skills || []).reduce((n, g) => n + g.items.length, 0);
    const skillGroups = [];
    if (toolCount) {
      skillGroups.push(`
        <div class="skill-group exp-toolbox reveal">
          <h3><span>Toolbox</span><span>(${pad(toolCount)})</span></h3>
          <p>The ${toolCount} languages, frameworks and tools I work with have a page of their own, showing where I've used each one.</p>
          <a class="btn btn-primary" href="toolbox.html" data-cursor="Open">Open the toolbox ${icon("right")}</a>
        </div>`);
    }
    if ((cv.languages || []).length) {
      skillGroups.push(`
        <div class="skill-group reveal">
          <h3><span>Spoken</span><span>(${pad(cv.languages.length)})</span></h3>
          <ul>${cv.languages.map((l) => `<li>${esc(l.name)} <span class="skill-level">${esc(l.level)}</span></li>`).join("")}</ul>
        </div>`);
    }

    $("#main").innerHTML = `
      ${pageHead(pg.title || "The journey *so far*")}
      <div class="exp-layout">
        <aside class="exp-intro reveal" style="--d:80ms">
          ${about.map((p, i) => `<p class="${i === 0 ? "about-lead" : ""}">${rich(p)}</p>`).join("")}
          <div class="view-filter">${viewSwitch()}</div>
        </aside>
        <div class="exp-timeline">${timeline}</div>
      </div>
      ${
        skillGroups.length
          ? `<section class="exp-skills">
               <div class="section-label reveal"><span>Skills</span><span>Tools &amp; languages</span></div>
               <h2 class="section-title reveal">Tools of the <em>trade</em></h2>
               <div class="skill-groups">${skillGroups.join("")}</div>
             </section>`
          : ""
      }`;

    setupViewToggle();
  }

  /* ── Toolbox ─────────────────────────────────────────────────────────── */

  // Where a tool has been used: projects tagged with it (or describing it),
  // and work or study entries that mention it. Names match whole words, so
  // "Java" doesn't match "JavaScript" and "C" doesn't match "C#". "now" is
  // set when an ongoing job mentions it.
  function usesOf(tool) {
    const cv = S.cv || {};
    const name = tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^\\w#+.])${name}(?![\\w#+])`);
    const mentions = (lines) => re.test((lines || []).join(" "));
    const work = (cv.experience || []).filter((e) => mentions(e.bullets));
    return {
      projects: (S.projects || []).filter((p) => (p.tags || []).includes(tool) || mentions([p.description])),
      work: [...new Set(work.map((e) => e.org))],
      study: [...new Set((cv.education || []).filter((e) => mentions(e.details)).map((e) => e.school))],
      now: work.some((e) => !e.end),
    };
  }

  function renderToolbox() {
    const pg = PAGES.toolbox || {};
    const groups = (S.skills || []).filter((g) => g.items.length);

    const card = (tool, i) => {
      const u = usesOf(tool);
      const rows = [
        u.work.length && ["Work", u.work.map(esc).join(", ")],
        u.projects.length && ["Projects", u.projects.map((p) => extLink(p.live || p.repo, esc(p.name), "", "Visit") || esc(p.name)).join(", ")],
        u.study.length && ["Study", u.study.map(esc).join(", ")],
      ].filter(Boolean);
      // The card sits inside the list item so its hover lift doesn't fight
      // the scroll reveal, which also animates transform.
      return `
        <li class="reveal" style="--d:${(i % 4) * 60}ms">
          <div class="tb-card">
            <div class="tb-top">
              <h3 class="tb-name">${esc(tool)}</h3>
              ${u.now ? `<span class="tb-now"><span class="status-dot" aria-hidden="true"></span>In use now</span>` : ""}
            </div>
            ${rows.length ? `<dl class="tb-where">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
          </div>
        </li>`;
    };

    $("#main").innerHTML =
      pageHead(pg.title || "The *toolbox*", pg.intro) +
      groups
        .map(
          (g) => `
        <section class="tb-group">
          <h2 class="tl-heading reveal">${esc(g.group)}<span class="tb-count">(${pad(g.items.length)})</span></h2>
          <ul class="tb-grid">${g.items.map(card).join("")}</ul>
        </section>`
        )
        .join("");
  }

  /* ── Contact ─────────────────────────────────────────────────────────── */

  function renderContact() {
    const pg = PAGES.contact || {};
    const channels = [
      P.email && { label: "Email", value: P.email, href: `mailto:${P.email}`, cursor: "Write", copy: P.email },
      P.phone && { label: "Phone", value: P.phone, href: telHref(P.phone), cursor: "Call", copy: P.phone },
      P.links.github && { label: "GitHub", value: prettyUrl(P.links.github), href: P.links.github, cursor: "Visit", external: true },
      P.links.linkedin && { label: "LinkedIn", value: prettyUrl(P.links.linkedin), href: P.links.linkedin, cursor: "Visit", external: true },
      { label: "CV", value: "Read the full CV", href: "cv.html", cursor: "Read" },
      P.location && { label: "Based in", value: P.location },
    ].filter(Boolean);

    $("#main").innerHTML = `
      <div class="contact-layout">
        <div class="contact-intro">
          <h1 class="contact-title reveal">${rich(pg.title || "Get in touch.")}</h1>
          ${pg.intro ? `<p class="contact-text reveal" style="--d:80ms">${rich(pg.intro)}</p>` : ""}
          ${P.availability ? `<p class="status reveal" style="--d:120ms"><span class="status-dot" aria-hidden="true"></span>${esc(P.availability)}</p>` : ""}
        </div>
        <ul class="channels">
          ${channels
            .map((c, i) => {
              const value = c.href
                ? `<a class="channel-value" href="${esc(c.href)}"${c.external ? ' target="_blank" rel="noopener noreferrer"' : ""} data-cursor="${c.cursor}">${esc(c.value)}</a>`
                : `<span class="channel-value">${esc(c.value)}</span>`;
              const action = c.copy
                ? `<button class="btn btn-small copy-btn" type="button" data-copy="${esc(c.copy)}" data-cursor="Copy" aria-label="Copy ${esc(c.label.toLowerCase())}">Copy</button>`
                : `<span class="channel-arrow" aria-hidden="true">${c.href ? icon(c.external ? "arrow" : "right") : ""}</span>`;
              return `
                <li class="channel reveal${c.href ? " is-link" : ""}" style="--d:${100 + i * 60}ms">
                  <span class="channel-label">${esc(c.label)}</span>
                  ${value}
                  ${action}
                </li>`;
            })
            .join("")}
        </ul>
      </div>`;
  }

  function setupCopyButtons() {
    $$("[data-copy]").forEach((btn) => {
      const original = btn.textContent;
      const done = (ok) => {
        btn.textContent = ok ? "Copied ✓" : "Press Ctrl+C";
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

  /* ── CV ──────────────────────────────────────────────────────────────── */

  function renderCV() {
    const cv = S.cv || {};

    const contact = [
      P.email && `<li>${icon("mail")}<a href="mailto:${esc(P.email)}" data-cursor="Write">${esc(P.email)}</a></li>`,
      P.phone && `<li>${icon("phone")}<a href="${esc(telHref(P.phone))}" data-cursor="Call">${esc(P.phone)}</a></li>`,
      P.location && `<li>${icon("pin")}${esc(P.location)}</li>`,
      P.links.github && `<li>${icon("github")}${extLink(P.links.github, esc(prettyUrl(P.links.github)), "", "Visit")}</li>`,
      P.links.linkedin && `<li>${icon("linkedin")}${extLink(P.links.linkedin, esc(prettyUrl(P.links.linkedin)), "", "Visit")}</li>`,
      P.links.website && `<li>${icon("link")}${extLink(P.links.website, esc(prettyUrl(P.links.website)), "", "Visit")}</li>`,
    ];

    const avatar = P.photo
      ? `<img class="cv-avatar" src="${esc(P.photo)}" alt="Portrait of ${esc(P.name)}">`
      : `<div class="cv-avatar cv-monogram" aria-hidden="true">${esc(P.initials || "")}</div>`;

    const sections = entryGroups("Experience")
      .map(
        ([title, list, fields]) => `
        <section class="cv-section" data-filterable>
          <h3 class="cv-heading">${esc(title)}</h3>
          <ol class="cv-list">${[...list]
            .sort(byRecent)
            .map((e) => {
              const [heading, org, items] = fields(e);
              return `
              <li class="cv-entry" data-relevant="${e.relevant !== false}">
                <p class="cv-date">${e.start ? `<span>${esc(fmtDate(e.start))}</span><span>– ${esc(fmtDate(e.end))}</span>` : `<span>${esc(fmtDate(e.end))}</span>`}</p>
                <div>
                  <h4>${esc(heading)}</h4>
                  <p class="cv-org">${esc(join([org, e.location], " · "))}</p>
                  ${items && items.length ? `<ul class="cv-bullets">${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
                </div>
              </li>`;
            })
            .join("")}</ol>
        </section>`
      )
      .join("");

    const skills = (S.skills || []).length
      ? `<section class="cv-section">
           <h3 class="cv-heading">Skills</h3>
           ${S.skills
             .map((g) => `<div class="cv-skill"><h4>${esc(g.group)}</h4><p>${g.items.map(esc).join(", ")}</p></div>`)
             .join("")}
         </section>`
      : "";

    const languages = (cv.languages || []).length
      ? `<section class="cv-section">
           <h3 class="cv-heading">Languages</h3>
           <dl class="cv-langs">${cv.languages.map((l) => `<dt>${esc(l.name)}</dt><dd>${esc(l.level)}</dd>`).join("")}</dl>
         </section>`
      : "";

    const certs = (cv.certifications || []).length
      ? `<section class="cv-section">
           <h3 class="cv-heading">Certifications</h3>
           <ul class="cv-certs">${cv.certifications
             .map(
               (c) =>
                 `<li>${c.url ? extLink(c.url, esc(c.name)) : esc(c.name)}<span class="muted">${esc(join([c.issuer, c.year], " · "))}</span></li>`
             )
             .join("")}</ul>
         </section>`
      : "";

    // The CV keeps a document width (wrapped in .cv-wrap) so its lines stay readable.
    $("#main").innerHTML = `
      <div class="cv-wrap">
        <div class="cv-toolbar">
          ${viewSwitch()}
          <button id="print-cv" class="btn btn-primary" type="button" data-cursor="Print">${icon("download")}Save as PDF</button>
        </div>
        <article class="cv" aria-label="Curriculum vitae">
          <header class="cv-head">
            <div class="cv-id">
              ${avatar}
              <div>
                <p class="cv-kicker">Curriculum vitae</p>
                <h1 class="cv-name">${esc(P.name)}</h1>
                <p class="cv-role">${esc(P.role)}</p>
              </div>
            </div>
            <ul class="cv-contact">${join(contact)}</ul>
          </header>
          <div class="cv-body">
            <div class="cv-main">
              ${cv.summary ? `<section class="cv-section"><h3 class="cv-heading">Profile</h3><p class="cv-summary">${esc(cv.summary)}</p></section>` : ""}
              ${sections}
            </div>
            <aside class="cv-side">
              ${skills}
              ${languages}
              ${certs}
            </aside>
          </div>
        </article>
      </div>`;

    setupViewToggle();
    $("#print-cv").addEventListener("click", () => window.print());
  }

  // "Relevant" / "All experience" switch, used on the Experience page and the
  // CV. The choice is mirrored in the URL (?view=all) so a specific view can
  // be shared as a link.
  function setupViewToggle() {
    const radios = $$('input[name="view"]');
    const count = $("#view-count");
    const entries = $$("[data-relevant]");

    function apply(view) {
      const showAll = view === "all";
      entries.forEach((el) => (el.hidden = !showAll && el.dataset.relevant === "false"));
      $$("[data-filterable]").forEach((sec) => {
        sec.hidden = !$$("[data-relevant]", sec).some((el) => !el.hidden);
      });
      const shown = entries.filter((el) => !el.hidden).length;
      if (count) {
        count.textContent = showAll
          ? `Showing all ${entries.length} entries`
          : `Showing ${shown} of ${entries.length} entries`;
      }
      document.body.dataset.view = showAll ? "all" : "relevant";
    }

    const initial = new URLSearchParams(location.search).get("view") === "all" ? "all" : "relevant";
    radios.forEach((r) => {
      r.checked = r.value === initial;
      r.addEventListener("change", () => {
        if (!r.checked) return;
        apply(r.value);
        const url = new URL(location.href);
        if (r.value === "all") url.searchParams.set("view", "all");
        else url.searchParams.delete("view");
        history.replaceState(null, "", url);
      });
    });
    apply(initial);
  }

  /* ── Scroll reveal ───────────────────────────────────────────────────── */

  function setupReveal() {
    const els = $$(".reveal");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ── Boot ────────────────────────────────────────────────────────────── */

  renderChrome();
  setupTheme();
  setupHeaderScroll();
  setupDockHandoff();
  setupNav();
  const render = {
    home: renderHome,
    projects: renderProjects,
    experience: renderExperience,
    toolbox: renderToolbox,
    contact: renderContact,
    cv: renderCV,
  }[page];
  if (render) render();
  setupCopyButtons();
  setupReveal();
})();
