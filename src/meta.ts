/* Each page's <title> and description. The build (vite.config.ts) writes a
   copy of index.html per page with these filled in, so search engines and
   link previews see them without running JavaScript; the app sets the
   title again as you move between pages. */

export const SITE_URL = "https://kong5hoej.github.io";

export interface PageMeta {
  title: string;
  description: string;
  /** A shorter description for link previews; defaults to `description`. */
  og?: string;
  /** The page's browser bar colour, when it differs from the site's. */
  themeColor?: string;
}

export const PAGES: Record<string, PageMeta> = {
  "/": {
    title: "Benjamin Kongshøj Hansen · Software Developer",
    description: "Portfolio of Benjamin Kongshøj Hansen, software developer intern and student.",
  },
  "/projects": {
    title: "Projects · Benjamin Kongshøj Hansen",
    description: "Selected projects by Benjamin Kongshøj Hansen, software developer intern and student.",
    og: "Selected projects by Benjamin Kongshøj Hansen.",
  },
  "/experience": {
    title: "Experience · Benjamin Kongshøj Hansen",
    description: "Experience, education and skills of Benjamin Kongshøj Hansen, software developer intern and student.",
    og: "Experience, education and skills of Benjamin Kongshøj Hansen.",
  },
  "/toolbox": {
    title: "Toolbox · Benjamin Kongshøj Hansen",
    description: "The languages, frameworks and tools Benjamin Kongshøj Hansen builds with, and where he has used them.",
    og: "The languages, frameworks and tools Benjamin Kongshøj Hansen builds with.",
  },
  "/contact": {
    title: "Contact · Benjamin Kongshøj Hansen",
    description: "Get in touch with Benjamin Kongshøj Hansen, software developer intern and student.",
    og: "Get in touch with Benjamin Kongshøj Hansen.",
  },
  "/cv": {
    title: "CV · Benjamin Kongshøj Hansen",
    description: "CV of Benjamin Kongshøj Hansen: experience, education and skills.",
    og: "Experience, education and skills of Benjamin Kongshøj Hansen.",
  },
  "/play": {
    title: "Benjamin Kongshøj Hansen · Pixel Town",
    description:
      "Walk around Benjamin Kongshøj Hansen's pixel-art town: projects, experience, skills and contact details, as a little retro game.",
    og: "A portfolio you can walk around in.",
    themeColor: "#1a1c2c",
  },
};

export const NOT_FOUND: PageMeta = {
  title: "Lost in space · Benjamin Kongshøj Hansen",
  description: "This page doesn't exist.",
};
