import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router";
import { SITE } from "../../content.ts";
import type { Site } from "../../content-types.ts";
import { prettyUrl } from "../../lib/cv.ts";
import { startNameLetters } from "../fx.ts";
import { Icon, Rich } from "../ui.tsx";

const P = SITE.person;
const v = (name: string, value: string | number) => ({ [name]: value }) as CSSProperties;

export default function Home() {
  const name = useRef<HTMLHeadingElement>(null);
  useEffect(() => startNameLetters(name.current!), []);

  // Every second word is set in the italic serif; the rest are single
  // letters that react to the cursor (fx.ts).
  const words = P.name.split(/\s+/);
  let letterIndex = 0;
  const nameParts = words.map((w, i) => {
    const mark = i === words.length - 1 ? <span className="name-mark" /> : null;
    if (i % 2 === 1) {
      return (
        <span key={i} className="name-word name-serif" style={v("--i", letterIndex++)}>
          {w}
          {mark}
        </span>
      );
    }
    return (
      <span key={i} className="name-word">
        {[...w].map((ch, j) => (
          <span key={j} className="ch" style={v("--i", letterIndex++)}>
            {ch}
          </span>
        ))}
        {mark}
      </span>
    );
  });

  return (
    <section className="hero" aria-label="Introduction">
      {P.availability && (
        <div className="hero-top">
          <p className="status">
            <span className="status-dot" aria-hidden="true" />
            {P.availability}
          </p>
        </div>
      )}
      <div className="hero-main">
        <h1 className="hero-name" ref={name}>
          <span className="visually-hidden">{P.name}</span>
          <span aria-hidden="true">{nameParts}</span>
        </h1>
        <div className="hero-side">
          <Editor />
          <div className="hero-intro" style={v("--k", 1)}>
            <p className="hero-role">{P.role}</p>
            <p className="hero-tagline">
              <Rich text={P.tagline} />
            </p>
          </div>
          <div className="hero-actions" style={v("--k", 2)}>
            <Link className="btn btn-primary" to="/cv" data-cursor="Read" viewTransition>
              View my CV <Icon name="right" />
            </Link>
            <Link className="btn" to="/projects" data-cursor="Open" viewTransition>
              Projects
            </Link>
            <Link className="btn btn-ghost" to="/contact" viewTransition>
              Say hej
            </Link>
            {P.links.github && (
              <a className="btn btn-ghost btn-icon" href={P.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" data-cursor="Visit">
                <Icon name="github" />
              </a>
            )}
          </div>
        </div>
        <div className="hero-play">
          <Link className="btn btn-play" to="/play" data-cursor="Play" viewTransition>
            <Icon name="gamepad" />
            Play my portfolio
          </Link>
          {/* A controller drawn in the starfield (fx.ts paints its stars inside
              this box). On wide screens it takes the button's place. */}
          <Link className="star-pad" to="/play" data-cursor="Play" aria-label="Play my portfolio" viewTransition />
        </div>
      </div>
    </section>
  );
}

/* ── The code editor ─────────────────────────────────────────────────── */
// The quick facts (SITE.facts) as a TypeScript file in a VS Code-style
// window. The window is decoration and hidden from screen readers; a
// visually hidden list next to it carries the same facts.

type Token = [type: string, text: string];
type Fact = Site["facts"][string];

function Editor() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => setupEditor(ref.current!), []);

  const facts = SITE.facts;
  const keys = Object.keys(facts);
  if (!keys.length) return null;

  const name = P.firstName.toLowerCase().replace(/[^\w$]/g, "") || "me";
  const file = `${name}.ts`;
  const workspace = P.links.website ? prettyUrl(P.links.website) : "portfolio";

  // Each line of code is a list of [token type, text] pairs. Brackets are
  // coloured by how deeply they're nested, as in VS Code.
  const bracket = (ch: string, depth: number): Token => [`br${depth % 3}`, ch];
  const value = (val: Fact, depth: number): Token[] => {
    if (Array.isArray(val)) {
      const items = val.flatMap((x, i): Token[] => [...(i ? [["pun", ", "] as Token] : []), ...value(x, depth + 1)]);
      return [bracket("[", depth), ...items, bracket("]", depth)];
    }
    if (typeof val === "number") return [["num", String(val)]];
    if (typeof val === "boolean") return [["kw", String(val)]];
    return [["str", JSON.stringify(String(val))]];
  };
  const key = (k: string): Token => (/^[A-Za-z_$][\w$]*$/.test(k) ? ["prop", k] : ["str", JSON.stringify(k)]);
  const code: Token[][] = [
    [["com", "// Fig. 01: quick facts"]],
    [["ctl", "export"], ["pun", " "], ["kw", "const"], ["pun", " "], ["var", name], ["pun", " = "], bracket("{", 0)],
    ...keys.map((k): Token[] => [["ind", "  "], key(k), ["pun", ": "], ...value(facts[k], 1), ["pun", ","]]),
    [bracket("}", 0), ["pun", " "], ["kw", "as"], ["pun", " "], ["kw", "const"], ["pun", ";"]],
  ];

  const label = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  const plain = (val: Fact) => (Array.isArray(val) ? val.join(", ") : String(val));

  // The other tabs open pages: package.json (the file that lists a
  // project's dependencies) opens the Toolbox, with a pulsing dot in place
  // of VS Code's "unsaved changes" mark to catch the eye. They're mouse
  // and touch shortcuts (tabIndex -1): the same pages are in the nav.
  return (
    <aside className="vsc" aria-label="Quick facts" style={v("--k", 0)} ref={ref}>
      <dl className="visually-hidden">
        {keys.map((k) => (
          <div key={k}>
            <dt>{label(k)}</dt>
            <dd>{plain(facts[k])}</dd>
          </div>
        ))}
      </dl>
      <div className="vsc-window" aria-hidden="true">
        <div className="vsc-titlebar">
          <span className="vsc-lights">
            <i />
            <i />
            <i />
          </span>
          <span className="vsc-command">
            <Icon name="search" />
            {workspace}
          </span>
        </div>
        <div className="vsc-body">
          <div className="vsc-activity">
            <span className="is-active">
              <Icon name="files" />
            </span>
            <span>
              <Icon name="search" />
            </span>
            <span>
              <Icon name="branch" />
            </span>
            <span>
              <Icon name="blocks" />
            </span>
          </div>
          <div className="vsc-editor">
            <div className="vsc-tabs">
              <span className="vsc-tab is-active">
                <i className="vsc-fi vsc-fi-ts">TS</i>
                {file}
                <Icon name="close" />
              </span>
              <Link className="vsc-tab is-dirty" to="/toolbox" tabIndex={-1} data-cursor="Open" viewTransition>
                <i className="vsc-fi vsc-fi-json">{"{}"}</i>package.json<span className="status-dot" />
              </Link>
              <Link className="vsc-tab" to="/projects" tabIndex={-1} data-cursor="Open" viewTransition>
                <i className="vsc-fi vsc-fi-json">{"{}"}</i>projects.json
              </Link>
              <Link className="vsc-tab" to="/cv" tabIndex={-1} data-cursor="Open" viewTransition>
                <i className="vsc-fi vsc-fi-md">M↓</i>cv.md
              </Link>
            </div>
            <p className="vsc-crumbs">
              src<span>›</span>
              <i className="vsc-fi vsc-fi-ts">TS</i>
              {file}
              <span>›</span>
              {name}
            </p>
            {/* Every character gets its own span, so setupEditor() can type
                them in one at a time and put the caret between any two. */}
            <div className="vsc-code">
              {code.map((tokens, i) => (
                <div key={i} className={`vsc-line${tokens[0][0] === "ind" ? " is-indented" : ""}`}>
                  <span className="vsc-ln">{i + 1}</span>
                  <span className="vsc-text">
                    {tokens.map(([type, text], j) => (
                      <span key={j} className={`tk-${type}`}>
                        {[...text].map((c, k) => (
                          <span key={k} className="c">
                            {c}
                          </span>
                        ))}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="vsc-status">
          <span className="vsc-remote">
            <Icon name="remote" />
          </span>
          <span>
            <Icon name="branch" />
            main
          </span>
          <span>
            <Icon name="error" />0 <Icon name="warning" />0
          </span>
          <span className="vsc-pos">Ln 1, Col 1</span>
          <span className="vsc-opt">Spaces: 2</span>
          <span className="vsc-opt">UTF-8</span>
          <span>TypeScript</span>
        </div>
      </div>
    </aside>
  );
}

// On a fresh visit the code is typed in once the window has risen into
// place; coming from another page shows it straight away. Afterwards, a
// click moves the caret, and the status bar follows it like the real thing.
// This works on the rendered spans directly: React never re-renders them.
function setupEditor(ed: HTMLElement): () => void {
  const code = ed.querySelector<HTMLElement>(".vsc-code")!;
  const pos = ed.querySelector<HTMLElement>(".vsc-pos")!;
  const lines = Array.from(code.querySelectorAll<HTMLElement>(".vsc-line"));
  const chars = lines.map((l) => Array.from(l.querySelectorAll<HTMLElement>(".c")));
  const last = lines.length - 1;
  const caret = document.createElement("span");
  caret.className = "vsc-caret";
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

  // Puts the caret after `col` characters of line `ln` (both from 0).
  // Moving it restarts its blink, so it stays solid while typing.
  const place = (ln: number, col: number) => {
    if (col) chars[ln][col - 1].after(caret);
    else lines[ln].querySelector(".vsc-text")!.prepend(caret);
    lines.forEach((l, i) => l.classList.toggle("is-active", i === ln));
    pos.textContent = `Ln ${ln + 1}, Col ${col + 1}`;
  };

  let typing = false;
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element;
    const line = target.closest<HTMLElement>(".vsc-line");
    if (!line || typing) return;
    const ln = lines.indexOf(line);
    const ch = target.closest<HTMLElement>(".c");
    let col = chars[ln].length;
    if (ch) {
      const r = ch.getBoundingClientRect();
      col = chars[ln].indexOf(ch) + (e.clientX > r.left + r.width / 2 ? 1 : 0);
    }
    place(ln, col);
  };
  code.addEventListener("click", onClick);

  let io: IntersectionObserver | null = null;
  const cleanup = () => {
    code.removeEventListener("click", onClick);
    timers.forEach(clearTimeout);
    io?.disconnect();
    caret.remove();
    ed.classList.remove("is-typing");
    ed.querySelectorAll(".on").forEach((el) => el.classList.remove("on"));
  };

  const fresh = document.documentElement.classList.contains("intro");
  if (!fresh || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    place(last, chars[last].length);
    return cleanup;
  }

  // .is-typing hides every line and character not yet marked .on.
  typing = true;
  ed.classList.add("is-typing");
  lines[0].classList.add("on");
  place(0, 0);
  let ln = 0;
  let col = 0;
  const isIndent = (c: HTMLElement | undefined) => !!c && c.parentElement!.classList.contains("tk-ind");
  const type = () => {
    const row = chars[ln];
    if (col < row.length) {
      // Indentation appears in one go, as the editor would insert it.
      const auto = isIndent(row[col]);
      do {
        row[col++].classList.add("on");
      } while (auto && isIndent(row[col]));
      place(ln, col);
      later(type, auto ? 0 : 8 + Math.random() * 18);
    } else if (ln < last) {
      ln += 1;
      col = 0;
      lines[ln].classList.add("on");
      place(ln, 0);
      later(type, 70);
    } else {
      typing = false;
      ed.classList.remove("is-typing");
    }
  };
  // Start once the window has risen in (at --intro + 0.5s, see .hero-side
  // in site.css) and is mostly on screen: on phones it can start below the
  // fold.
  const intro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro")) || 0;
  const readyAt = performance.now() + intro * 1000 + 1000;
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io!.disconnect();
      later(type, Math.max(0, readyAt - performance.now()));
    },
    { threshold: 0.6 }
  );
  io.observe(ed);
  return cleanup;
}
