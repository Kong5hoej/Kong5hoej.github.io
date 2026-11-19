/* Small pieces shared by the pages. */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "react-router";

// Lucide icons (lucide.dev), as their inner SVG markup.
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
  gamepad:
    '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
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

export type IconName = keyof typeof ICONS;

export const Icon = ({ name }: { name: IconName }) => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: ICONS[name] }}
  />
);

/** Text where *words* are set in <em>. */
export const Rich = ({ text }: { text: string }) => (
  <>{text.split(/\*(.+?)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}</>
);

/** A link that opens in a new tab. */
export const ExtLink = ({ href, className, cursor, children }: { href: string; className?: string; cursor?: string; children: ReactNode }) => (
  <a className={className} href={href} target="_blank" rel="noopener noreferrer" data-cursor={cursor || undefined}>
    {children}
  </a>
);

/** Copies `text`, falling back to a hidden textarea where the Clipboard API is missing. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
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
  } catch {
    /* fall through to the manual hint */
  }
  ta.remove();
  return ok;
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <button
      className="btn btn-small copy-btn"
      type="button"
      data-cursor="Copy"
      aria-label={`Copy ${label.toLowerCase()}`}
      onClick={async () => setState((await copyText(text)) ? "ok" : "fail")}
    >
      {state === "ok" ? "Copied ✓" : state === "fail" ? "Press Ctrl+C" : "Copy"}
    </button>
  );
}

export const PageHead = ({ title, intro }: { title: string; intro?: string }) => (
  <div className="page-head">
    <h1 className="page-title reveal">
      <Rich text={title} />
    </h1>
    {intro && (
      <p className="page-intro reveal" style={{ "--d": "80ms" } as CSSProperties}>
        <Rich text={intro} />
      </p>
    )}
  </div>
);

/** A CSS custom property for the reveal delay: style={delay(120)}. */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// "Relevant" / "All experience", used on the Experience page and the CV.
// The choice is kept in the URL (?view=all) so a view can be shared as a link.
export function useView() {
  const [params, setParams] = useSearchParams();
  const all = params.get("view") === "all";
  useEffect(() => {
    document.body.dataset.view = all ? "all" : "relevant";
    return () => void delete document.body.dataset.view;
  }, [all]);
  const setAll = (next: boolean) =>
    setParams(
      (p) => {
        if (next) p.set("view", "all");
        else p.delete("view");
        return p;
      },
      { replace: true, preventScrollReset: true }
    );
  return [all, setAll] as const;
}

export function ViewSwitch({ all, setAll, shown, total }: { all: boolean; setAll: (v: boolean) => void; shown: number; total: number }) {
  return (
    <>
      <fieldset className="switch">
        <legend className="visually-hidden">Which experience to show</legend>
        <span className="switch-thumb" aria-hidden="true" />
        <input type="radio" name="view" id="view-relevant" value="relevant" checked={!all} onChange={() => setAll(false)} />
        <label htmlFor="view-relevant" data-cursor="Filter">
          Relevant
        </label>
        <input type="radio" name="view" id="view-all" value="all" checked={all} onChange={() => setAll(true)} />
        <label htmlFor="view-all" data-cursor="All">
          All experience
        </label>
      </fieldset>
      <p id="view-count" className="view-count" aria-live="polite">
        {all ? `Showing all ${total} entries` : `Showing ${shown} of ${total} entries`}
      </p>
    </>
  );
}
