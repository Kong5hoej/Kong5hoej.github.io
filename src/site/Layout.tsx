/* The frame around every page except Pixel Town: header, phone menu, the
   starfield and the scroll reveal. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import { NOT_FOUND, PAGES } from "../meta.ts";
import { pad } from "../lib/cv.ts";
import { useStylesheet } from "../lib/useStylesheet.ts";
import siteCss from "../styles/site.css?inline";
import { startEffects } from "./fx.ts";
import { startGlobe, type GlobeKind } from "./globe.ts";

// The pages in the main navigation, in order. The phone menu numbers them
// (01, 02, …).
export const NAV = [
  { to: "/projects", label: "Projects" },
  { to: "/experience", label: "Experience" },
  { to: "/toolbox", label: "Toolbox" },
  { to: "/cv", label: "CV" },
  { to: "/contact", label: "Contact" },
];

export default function Layout() {
  useStylesheet(siteCss);
  const { pathname, key } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const known = path in PAGES;
  const page = path === "/" ? "home" : known ? path.slice(1) : "404";

  useLayoutEffect(() => {
    document.body.dataset.page = page;
    document.title = (PAGES[path] || NOT_FOUND).title;
    return () => void delete document.body.dataset.page;
  }, [page, path]);

  useEffect(() => startEffects(), []);
  useReveal(key);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" className={page === "home" ? "container" : page === "404" ? "container not-found" : "container page"}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  );
}

/* ── Header and menu ─────────────────────────────────────────────────── */

// Lucide's rocket, with the exhaust split out so it can flicker, plus a porthole.
const Rocket = () => (
  <svg className="rocket" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path className="rocket-flame" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    <circle cx="16" cy="8" r="1.5" />
  </svg>
);

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The full-screen menu, opened by the rocket on touch screens and narrow
  // windows. (On desktop the dock opens on hover; no script needed.)
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    if (menuOpen) menu.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    // Close the menu if the window changes to the hover dock layout.
    const wide = window.matchMedia("(min-width: 1360px) and (hover: hover)");
    const onWide = (e: MediaQueryListEvent) => e.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  return (
    <>
      {/* The nav is a "dock" in the middle of the header: just a rocket (a
          link home) until it's hovered, then the links slide out to the
          right. On touch screens and narrow windows, .menu-rocket opens the
          menu instead. */}
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="container header-inner">
          <div className="dock-slot">
            <nav className="dock" aria-label="Main">
              <NavLink className="dock-rocket" to="/" end aria-label="Home" data-cursor="Home" viewTransition>
                <Rocket />
              </NavLink>
              <div className="dock-side">
                <div className="dock-links">
                  {NAV.map((n) => (
                    <NavLink key={n.to} to={n.to} viewTransition>
                      {n.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </nav>
            <button
              ref={menuBtn}
              className="menu-rocket"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Rocket />
            </button>
          </div>
          <div className="header-tools">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* The phone menu lives outside the header: the header's backdrop blur
          would otherwise trap a fixed-position overlay inside it. */}
      <div className="menu" id="menu" hidden={!menuOpen} ref={menu} onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
        <nav aria-label="Main">
          {[{ to: "/", label: "Home" }, ...NAV].map((n, i) => (
            <NavLink key={n.to} to={n.to} end style={{ "--i": i } as CSSProperties} viewTransition>
              <span>{pad(i)}</span>
              <span className="menu-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

function ThemeToggle() {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : media.matches);
  const [dark, setDark] = useState(isDark);
  const [moved, setMoved] = useState(false); // animate only after a click, not on page load

  useEffect(() => {
    const onChange = () => setDark(isDark());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable: the theme just won't persist */
    }
    setMoved(true);
    setDark(!dark);
  };

  // The sun by day, the moon by night (see .theme-toggle in site.css).
  return (
    <button
      className={`theme-toggle${moved ? " has-moved" : ""}`}
      type="button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      data-cursor={dark ? "Day" : "Night"}
      onClick={toggle}
    >
      <span className={`tt-sun${dark ? "" : " is-on"}`} aria-hidden="true">
        <Globe kind="sun" />
      </span>
      <span className={`tt-moon${dark ? " is-on" : ""}`} aria-hidden="true">
        <Globe kind="moon" />
      </span>
    </button>
  );
}

// A slowly turning sun or moon, drawn on a canvas by globe.ts.
function Globe({ kind }: { kind: GlobeKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => startGlobe(ref.current!, kind), [kind]);
  return <canvas ref={ref} />;
}

/* ── Scroll reveal ───────────────────────────────────────────────────── */
// Elements with .reveal fade up as they scroll into view. Runs again for
// every new page.

function useReveal(pageKey: string) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("#main .reveal"));
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
    return () => io.disconnect();
  }, [pageKey]);
}
