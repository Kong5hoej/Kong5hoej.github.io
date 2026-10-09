#!/usr/bin/env node
/*
 * Sanity-checks assets/js/content.js so a typo can't break the live site.
 * Runs in CI before every deploy; run it locally with:  node scripts/validate-content.js
 */
"use strict";

const path = require("path");

global.window = {};
try {
  require(path.join(__dirname, "..", "assets", "js", "content.js"));
} catch (err) {
  console.error(`✖ content.js could not be loaded:\n  ${err.message}`);
  process.exit(1);
}

const S = global.window.SITE;
const errors = [];
const warnings = [];
const DATE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

const need = (cond, msg) => cond || errors.push(msg);

need(S && typeof S === "object", "window.SITE is not defined");
if (S) {
  need(S.person && S.person.name, "person.name is required");
  need(S.person && S.person.role, "person.role is required");
  need(S.person && S.person.links, "person.links is required (can be an empty object)");

  (S.projects || []).forEach((p, i) => need(p.name, `projects[${i}] is missing a name`));
  (S.skills || []).forEach((g, i) =>
    need(g.group && Array.isArray(g.items), `skills[${i}] needs a group name and an items array`)
  );

  const cv = S.cv || {};
  const lists = [
    ["cv.experience", cv.experience],
    ["cv.education", cv.education],
    ...(cv.sections || []).map((s, i) => [`cv.sections[${i}] (${s.title})`, s.items]),
  ];
  for (const [label, items] of lists) {
    (items || []).forEach((e, i) => {
      const where = `${label}[${i}]`;
      need(e.start == null || DATE.test(String(e.start)), `${where}.start "${e.start}" should be YYYY or YYYY-MM`);
      need(e.end == null || DATE.test(String(e.end)), `${where}.end "${e.end}" should be YYYY, YYYY-MM or null`);
      need(typeof e.relevant === "boolean", `${where}.relevant should be true or false`);
    });
  }

  if (/example\.com$/i.test((S.person && S.person.email) || "")) {
    warnings.push("person.email is still the placeholder address");
  }
}

// GitHub Actions turns these prefixes into annotations on the run summary.
const ci = !!process.env.GITHUB_ACTIONS;
warnings.forEach((w) => console.log(ci ? `::warning file=assets/js/content.js::${w}` : `⚠ ${w}`));
errors.forEach((e) => console.log(ci ? `::error file=assets/js/content.js::${e}` : `✖ ${e}`));

if (errors.length) process.exit(1);
console.log("✔ content.js looks good");
