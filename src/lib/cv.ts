/* Helpers shared by the site and Pixel Town: dates, sorting, links and
   where each tool has been used. */
import { SITE } from "../content.ts";
import type { Entry } from "../content-types.ts";

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "Present";
  const [y, m] = String(value).split("-").map(Number);
  return m ? MONTH.format(new Date(y, m - 1)) : String(y);
}

export const dateRange = (e: Entry) => (e.start ? `${fmtDate(e.start)} – ${fmtDate(e.end)}` : fmtDate(e.end));

// Newest first: ongoing entries on top, then by end date, then by start date.
const sortKey = (v: string | null | undefined) => (v ? String(v).padEnd(7, "-13") : "9999-99");
export const byRecent = (a: Entry, b: Entry) =>
  sortKey(b.end).localeCompare(sortKey(a.end)) || sortKey(b.start).localeCompare(sortKey(a.start));

export const pad = (n: number, width = 2) => String(n).padStart(width, "0");
export const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** A CV list with the fields every view shows: heading, organisation, bullet points. */
export interface EntryGroup {
  id: string;
  title: string;
  items: { entry: Entry; heading: string; org: string; bullets: string[] }[];
}

// Every CV list (work, education and any extra sections), newest first.
export function entryGroups(workTitle: string): EntryGroup[] {
  const cv = SITE.cv;
  return [
    {
      id: "work",
      title: workTitle,
      items: cv.experience.map((e) => ({ entry: e, heading: e.role, org: e.org, bullets: e.bullets })),
    },
    {
      id: "education",
      title: "Education",
      items: cv.education.map((e) => ({ entry: e, heading: e.degree, org: e.school, bullets: e.details })),
    },
    ...cv.sections.map((s, i) => ({
      id: `more-${i}`,
      title: s.title,
      items: s.items.map((e) => ({ entry: e, heading: e.role, org: e.org, bullets: e.bullets })),
    })),
  ]
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => byRecent(a.entry, b.entry)) }))
    .filter((g) => g.items.length);
}

// Where a tool has been used: projects tagged with it (or describing it),
// and work or study entries that mention it. Names match whole words, so
// "Java" doesn't match "JavaScript" and "C" doesn't match "C#". `now` is
// set when an ongoing job mentions it.
export function usesOf(tool: string) {
  const cv = SITE.cv;
  const name = tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\w#+.])${name}(?![\\w#+])`);
  const mentions = (lines: string[] | undefined) => re.test((lines || []).join(" "));
  const work = cv.experience.filter((e) => mentions(e.bullets));
  return {
    projects: SITE.projects.filter((p) => (p.tags || []).includes(tool) || mentions([p.description || ""])),
    work: [...new Set(work.map((e) => e.org))],
    study: [...new Set(cv.education.filter((e) => mentions(e.details)).map((e) => e.school))],
    now: work.some((e) => !e.end),
  };
}
