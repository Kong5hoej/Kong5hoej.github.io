import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { NOT_FOUND, PAGES, SITE_URL, type PageMeta } from "./src/meta.ts";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]);

// The site is one React app, but GitHub Pages serves files. After the build,
// every page gets its own copy of index.html (projects.html, cv.html, …)
// with its title and description filled in. GitHub Pages serves /projects
// from projects.html, and any other URL gets 404.html, which is the app too.
function pageCopies(): Plugin {
  return {
    name: "page-copies",
    apply: "build",
    closeBundle() {
      const dist = resolve(import.meta.dirname, "dist");
      const html = readFileSync(resolve(dist, "index.html"), "utf8");
      const fill = (path: string, m: PageMeta, noindex = false) => {
        const url = SITE_URL + (path === "/" ? "/" : path);
        let out = html
          .replace(/<title>.*?<\/title>/, `<title>${esc(m.title)}</title>`)
          .replace(/(name="description" content=")[^"]*/, `$1${esc(m.description)}`)
          .replace(/(property="og:title" content=")[^"]*/, `$1${esc(m.title)}`)
          .replace(/(property="og:description" content=")[^"]*/, `$1${esc(m.og ?? m.description)}`)
          .replace(/(rel="canonical" href=")[^"]*/, `$1${url}`)
          .replace(/(property="og:url" content=")[^"]*/, `$1${url}`);
        if (m.themeColor) {
          out = out.replace(/(<meta name="theme-color"[^>]*>\s*)+/, `<meta name="theme-color" content="${m.themeColor}" />\n    `);
        }
        if (noindex) out = out.replace("</title>", '</title>\n    <meta name="robots" content="noindex" />');
        return out;
      };
      for (const [path, meta] of Object.entries(PAGES)) {
        writeFileSync(resolve(dist, path === "/" ? "index.html" : `${path.slice(1)}.html`), fill(path, meta));
      }
      writeFileSync(resolve(dist, "404.html"), fill("/404", NOT_FOUND, true));
    },
  };
}

export default defineConfig({
  plugins: [react(), pageCopies()],
});
