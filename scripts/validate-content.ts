#!/usr/bin/env node
/*
 * Checks what TypeScript can't in src/content.ts, like the date formats, so
 * a typo can't break the live site. Runs in CI before every deploy; run it
 * locally with:  npm run check
 */
import { SITE } from "../src/content.ts";

const errors: string[] = [];
const warnings: string[] = [];
const need = (ok: unknown, msg: string) => ok || errors.push(msg);
const DATE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

const cv = SITE.cv;
const lists: [string, { start?: string | null; end: string | null }[]][] = [
  ["cv.experience", cv.experience],
  ["cv.education", cv.education],
  ...cv.sections.map((s, i): [string, typeof s.items] => [`cv.sections[${i}] (${s.title})`, s.items]),
];
for (const [label, items] of lists) {
  items.forEach((e, i) => {
    const where = `${label}[${i}]`;
    need(e.start == null || DATE.test(e.start), `${where}.start "${e.start}" should be YYYY or YYYY-MM`);
    need(e.end == null || DATE.test(e.end), `${where}.end "${e.end}" should be YYYY, YYYY-MM or null`);
  });
}
if (/example\.com$/i.test(SITE.person.email)) warnings.push("person.email is still the placeholder address");

// GitHub Actions turns these prefixes into annotations on the run summary.
const ci = !!process.env.GITHUB_ACTIONS;
warnings.forEach((w) => console.log(ci ? `::warning file=src/content.ts::${w}` : `⚠ ${w}`));
errors.forEach((e) => console.log(ci ? `::error file=src/content.ts::${e}` : `✖ ${e}`));

if (errors.length) process.exit(1);
console.log("✔ content looks good");
