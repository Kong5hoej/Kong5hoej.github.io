# Kong5hoej.github.io

My personal portfolio and CV, live at **https://kong5hoej.github.io**.

React and TypeScript, with React Router and Vite. All the content lives in one file, and GitHub Actions builds and deploys the site.

## Pages

| Page | Address | File | What's on it |
| --- | --- | --- | --- |
| Home | `/` | `src/site/pages/Home.tsx` | The intro screen: name, the quick facts in a code editor window, role, tagline, quick links and the *Play my portfolio* button (under the name on wide screens, under the links on narrow ones). Sized to fit one screen on computers and tablets; on phones it may scroll a little. |
| Projects | `/projects` | `src/site/pages/Projects.tsx` | The project list. |
| Experience | `/experience` | `src/site/pages/Experience.tsx` | About text, a timeline of work, education and activities, spoken languages and a link to the Toolbox. |
| Toolbox | `/toolbox` | `src/site/pages/Toolbox.tsx` | The tech stack: a card per skill showing where it was used (work, projects, study), worked out from the rest of `content.ts`. Tools from an ongoing job are marked "In use now". |
| Contact | `/contact` | `src/site/pages/Contact.tsx` | Email, phone and links, with copy buttons. |
| CV | `/cv` | `src/site/pages/Cv.tsx` | The printable CV. |
| Pixel Town | `/play` | `src/game/` | The portfolio as a little top-down pixel-art game, opened from the home page. See below. |

Old addresses (`/projects.html`, `/cv.html?view=all`, `/play.html#map`, …) still work: they move to the new ones, query and hash included.

## Editing content

All text on the site lives in **[`src/content.ts`](src/content.ts)**: name, contact details, links, projects, skills, the CV and the page titles. Lines marked `TODO` still hold placeholder text. Its shape is described in [`src/content-types.ts`](src/content-types.ts), so a missing field or a typo fails the build instead of breaking the live site.

- **Relevant vs. all experience:** every CV entry has `relevant: true | false`. The Experience page and the CV open in the *Relevant* view. Visitors can switch to *All experience*, or you can link straight to it with `?view=all` (e.g. `/cv?view=all`).
- **Dates:** use `"YYYY-MM"` or `"YYYY"`, and `end: null` for "Present". Entries are sorted newest first automatically.
- **Emphasis:** in the tagline, about text and page titles, wrap words in `*asterisks*` to set them in the italic gradient font.
- **Photo:** drop an image in `public/img/` and set `person.photo` to `/img/your-file.jpg`. Your initials are shown when it's empty.
- **PDF:** the *Save as PDF* button on the CV uses a print stylesheet tuned for A4. It always prints in the light theme and only includes the entries currently shown.

The header and phone menu are in [`src/site/Layout.tsx`](src/site/Layout.tsx), so a new nav link only needs adding to the `NAV` list there (and a route in [`src/main.tsx`](src/main.tsx)). Each page's `<title>` and description are in [`src/meta.ts`](src/meta.ts): the build writes them into a copy of `index.html` per page, so search engines and link previews see them without running JavaScript.

## Effects

[`src/site/fx.ts`](src/site/fx.ts) adds the decorative layer. It's independent of the content, so the site works without it.

- **Starfield background:** drifting, twinkling stars at different depths, drawn on a canvas. Stars part around the cursor and link up into constellation lines, a click sends out a pulse, and now and then a shooting star crosses the sky. Tune it with the constants at the top of `startSky()`. Its colours come from the `--star-*` tokens in `site.css`.
- **Custom cursor:** a dot plus a trailing ring that grows over links and buttons. Add `data-cursor="Label"` to any element to show a label in the ring.
- **Reactive name:** the hero name uses a variable font, and letters thin out as the cursor passes.
- **Intro:** on a fresh visit or a reload, the stars come out one by one before the page content appears. Moving between pages skips it. The timing is the `--intro` variable in `site.css`.
- **Code editor:** the front page shows `facts` from `content.ts` as a TypeScript file in a VS Code-style window, in VS Code's light or dark colours to match the theme. On a fresh visit the code is typed in, and clicking in the code moves the caret, with the line and column in the status bar. The other tabs are links: `package.json` (with the pulsing dot) opens the Toolbox, and the others open the Projects and CV pages. The window sits beside the name with the role and tagline under it. On phones and windows narrower than 1000px, everything stacks under the name, centred. The whole window grows with the screen. This lives in `Home.tsx` (`Editor` and `setupEditor`).

The navigation sits in the middle of the header as a small rocket. Hovering it slides the links out to the right (in the order of the `NAV` list), and clicking the rocket goes home. On touch screens and windows narrower than 1360px, the rocket opens a full-screen menu instead. (Below that the open dock would cover the theme toggle; adding a nav link makes it wider, so check that width again.)

The theme toggle in the top right is the sun in the light theme and the moon in the dark one. Clicking it sends the current one up out of the sky and brings the other in from the right along an arc. It lives in the sky like the stars: it rises in after them on a fresh visit, floats gently, rocks in the pulse of a click and brightens as the cursor nears (`fx.ts` drives that through CSS variables). Both are slowly turning globes, drawn on small canvases by [`src/site/globe.ts`](src/site/globe.ts) from surface maps it makes from noise (the moon's seas sit where the real ones are); the glow, corona and animation are CSS (`.theme-toggle` in `site.css`).

The site is a single-page app, so the header and the sky stay put while pages change, and in browsers that support it pages crossfade. On touch devices the cursor effects are skipped. With *reduce motion* turned on in the OS, everything is static.

## Pixel Town

`/play` turns the portfolio into a small retro town to walk around in. Every building opens a window with content from `content.ts`: the house is the About card, the lab holds the projects as cartridges, the office and school share a quest log (relevant entries are main quests, the rest side quests), the shop is the toolbox and the post office is the contact page. People and signs around town mention bits of the CV, and wild bugs live in the tall grass.

- **No game required:** the title screen has a quick menu, `M` opens a map that reaches everything, and `/play#projects` (or `#about`, `#work`, `#school`, `#skills`, `#contact`, `#map`) opens a section directly.
- **Controls:** arrow keys or WASD to walk, Shift to run, Space to talk and go in, or click/tap where you want to go. Touch screens get a pad and A/B buttons.
- **Day and night** follow the visitor's clock (switchable with `N`). Sound is off until switched on.
- All the art is drawn in code: no image files.

| File | What's in it |
| --- | --- |
| [`src/game/world.ts`](src/game/world.ts) | The map (as text, one character per tile), the places, your sprite's colours and everything people and signs say. Lines that quote the CV are marked `CV`. |
| [`src/game/art.ts`](src/game/art.ts) | The palette, sprites and painters for tiles and buildings. |
| [`src/game/engine.ts`](src/game/engine.ts) | Movement, dialogue, the windows, battles, sound and drawing. |
| [`src/game/Play.tsx`](src/game/Play.tsx) | The game's interface: title screen, HUD, text box, windows, battle screen and touch controls. |
| [`src/styles/play.css`](src/styles/play.css) | The look of that interface. |

## Running locally

You need [Node.js](https://nodejs.org) 22.18 or newer.

```sh
npm install
npm run dev        # http://localhost:5173, reloads as you edit
```

Check your content before pushing:

```sh
npm run check      # type-checks everything and checks the content
npm run build      # builds the site into dist/
npm run preview    # serves dist/ to try the real build
```

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`:

1. **Check:** `npm run check` (TypeScript, plus `scripts/validate-content.ts`, which catches things like a bad date format).
2. **Build:** `npm run build` builds the site into `dist/`, with a copy of the page for every address (`projects.html`, `cv.html`, …) and `404.html`, so GitHub Pages can serve any address straight away.
3. **Deploy:** publishes `dist/` to GitHub Pages.

Pull requests run the check and build only and don't deploy.

**One-time setup:** in the repository on GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

## Structure

```
index.html                The page the whole app runs in
src/
  content.ts              ← all your content
  content-types.ts        Its shape
  meta.ts                 Each page's title and description
  main.tsx                The routes
  lib/cv.ts               Dates, sorting and tool usage, shared by the site and the game
  site/Layout.tsx         Header, phone menu, scroll reveal
  site/pages/*.tsx        One component per page
  site/ui.tsx             Icons, copy button, the Relevant / All switch
  site/fx.ts              Starfield, cursor and reactive name
  game/                   Pixel Town (see above)
  styles/site.css         Styles (light/dark theme, print layout for the CV)
  styles/play.css         Pixel Town's retro interface
public/
  favicon.svg
scripts/
  validate-content.ts     Content checks, also run in CI
vite.config.ts            Build settings, and the page copies for GitHub Pages
.github/workflows/
  deploy.yml              GitHub Pages deployment
```
