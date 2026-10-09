/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT: the only file you need to edit.
 * ─────────────────────────────────────────────────────────────────────────
 *  Every page (home, projects, experience, contact and CV) is rendered
 *  from this object.
 *
 *  Conventions
 *  • Dates are "YYYY-MM" or "YYYY". Use `end: null` for "Present".
 *  • CV entries with `relevant: true` show in the default "Relevant" view
 *    (on both the Experience page and the CV). Entries with
 *    `relevant: false` only show under "All experience".
 *  • Empty strings ("") and empty lists ([]) are simply not rendered.
 *  • In the tagline, about text and page titles, wrap words in
 *    *asterisks* to set them in the italic gradient font.
 *  • Lines marked TODO still hold placeholder text. Replace them before
 *    you share the site.
 *
 *  `npm`-free sanity check:  node scripts/validate-content.js
 */
window.SITE = {
  person: {
    name: "Benjamin Kongshøj Hansen",
    firstName: "Benjamin",
    initials: "BKH",
    role: "Software Developer Intern",
    // One sentence under your name on the front page.
    tagline: "Student and developer intern who turns *fuzzy ideas* into clean, working software.", // TODO
    location: "Horsens, Denmark",
    email: "bkh2604@gmail.com",
    phone: "+45 22 48 49 34", // Shown on the Contact page and the CV; "" hides it
    photo: "", // Optional, e.g. "assets/img/profile.jpg". Initials are shown when empty.
    availability: "", // A short status badge on the Home and Contact pages; "" hides it
    links: {
      github: "https://github.com/Kong5hoej",
      linkedin: "https://www.linkedin.com/in/benjamin-kongshoej-hansen/",
      website: "https://kong5hoej.github.io", // Printed on the CV so paper copies link back here
    },
  },

  // Shown on the front page as a TypeScript object in a VS Code-style
  // editor window. Keys and values are free-form: values can be text,
  // numbers or lists. Screen readers get the keys with underscores as spaces.
  // The tech stack has its own tab there (package.json), which opens the
  // Toolbox page.
  facts: {
    role: "Software Developer Intern",
    studying: "Software Technology",
    school: "VIA University College",
    based_in: "Horsens, Denmark",
  },

  // Introduces the Experience page. The first paragraph is shown large; the
  // rest as normal body text.
  about: [
    "I'm a software developer intern finishing my education. I enjoy the whole journey from *understanding a problem* to shipping something people actually use.", // TODO
    "Right now I'm focused on building solid foundations: readable code, good tests and understanding how systems fit together. I'm happiest when I get to learn a new tool along the way, and outside of work and studies you'll find me tinkering with side projects.", // TODO
  ],

  // Titles and intro text for the sub-pages.
  pages: {
    projects: {
      title: "Selected *work*",
      intro: "Things I've built and shipped. Each one is live and open source.",
    },
    experience: {
      title: "The journey *so far*", // The intro here is the `about` text above.
    },
    toolbox: {
      title: "My *dependencies*",
      intro: "The languages, frameworks and tools I build with, and where I've put each of them to use.",
    },
    contact: {
      title: "Say *hej*.",
      intro: "Have a question, an opportunity, or just want to talk code? Reach out any way you like.",
    },
  },

  projects: [
    {
      name: "Pokédex",
      year: "2026",
      description:
        "A Pokédex built on PokeAPI: search every Pokémon and open its types, abilities, evolution chain and cry, in a light or dark theme. Comes with two games: Poké Wordle, and a silhouette game that reveals more of the Pokémon with every guess.",
      tags: ["React", "React Router", "Vite", "JavaScript", "CSS", "PokeAPI", "GitHub Actions"],
      repo: "https://github.com/Kong5hoej/Pokedex",
      live: "https://kong5hoej.github.io/Pokedex/",
    },
    {
      name: "Personal website",
      year: "2026",
      description:
        "The site you're looking at. A dependency-free portfolio and CV with an interactive starfield, rendered from a single content file and deployed to GitHub Pages with GitHub Actions.",
      tags: ["HTML", "CSS", "JavaScript", "Canvas", "GitHub Actions"],
      repo: "https://github.com/Kong5hoej/Kong5hoej.github.io",
      live: "https://kong5hoej.github.io",
    },
  ],

  // Used on the Toolbox page, the Experience page and the CV. The Toolbox
  // page finds where each one was used by itself: projects tagged with it,
  // and experience or education entries that mention it by name.
  skills: [
    { group: "Languages", items: ["Java", "C#", "C", "HTML", "CSS", "JavaScript", "Python", "Assembly"] },
    { group: "Frameworks & databases", items: [".NET", "React", "Next.js", "Node.js", "PostgreSQL"] },
    { group: "Tools", items: ["Git", "GitHub Actions", "Vite", "VS Code"] },
    { group: "Methods", items: ["Scrum", "Unified Process"] },
  ],

  cv: {
    summary:
      "Motivated software development student with hands-on experience from an internship, where I build and maintain production software as part of a team. Quick to learn, comfortable asking questions, and keen on writing code others enjoy working with.", // TODO

    experience: [
      {
        role: "Software Developer Intern",
        org: "OneCode",
        location: "Kolding",
        start: "2026-08", // TODO: check the start month
        end: null,
        relevant: true,
        bullets: [
          "Work on client projects at a software consultancy.",
          "Develop with React, Next.js, Node.js and PostgreSQL.",
        ],
      },
      {
        role: "Student Assistant",
        org: "VIA University College",
        location: "Horsens",
        start: "2026-02",
        end: "2026-04",
        relevant: true,
        bullets: [
          "Helped new students get a deeper understanding of Java and JavaFX.",
          "Shared my knowledge of programming in PostgreSQL.",
        ],
      },
      {
        role: "Student Assistant",
        org: "VIA University College",
        location: "Horsens",
        start: "2025-09",
        end: "2025-11",
        relevant: true,
        bullets: [
          "Helped new students get to grips with Java and JavaFX.",
          "Shared my knowledge of programming in HTML, CSS and JavaScript.",
          "Represented the programme at a study day for upper secondary school students.",
        ],
      },
      {
        role: "Sales Assistant",
        org: "Autohuset Vestergaard",
        start: "2023-03",
        end: null,
        relevant: false,
        bullets: [
          "Advise customers on cars, especially from Ford and Mazda.",
          "Represented Ford Denmark at Elbilmessen 2025.",
          "Keep the showroom and cars clean and ready for customers.",
        ],
      },
      {
        role: "Butcher Assistant",
        org: "Bilka, Butcher & Deli",
        start: "2022-08",
        end: "2023-05",
        relevant: false,
        bullets: ["Stocked shelves and refrigerated counters.", "Cut and prepared various types of meat."],
      },
      {
        role: "Store Assistant",
        org: "Netto",
        start: "2021-06",
        end: "2022-08",
        relevant: false,
        bullets: ["Served customers, including at the checkout.", "Restocked shelves and handled day-to-day tasks."],
      },
      {
        role: "Badminton Coach (U13)",
        org: "Hovedgård IF",
        location: "Hovedgård",
        start: "2019-01",
        end: "2020-07",
        relevant: false,
        bullets: [
          "Taught warm-up, technique and recovery exercises.",
          "Gave players feedback on how they carried out each exercise.",
          "Took part in a TV segment about local sports clubs.",
        ],
      },
      {
        role: "Newspaper Carrier",
        org: "Jysk Fynske Medier",
        start: "2018-08",
        end: "2020-07",
        relevant: false,
        bullets: ["Delivered newspapers and handled incorrect or missed deliveries."],
      },
    ],

    education: [
      {
        degree: "Software Technology, Professional Bachelor",
        school: "VIA University College",
        location: "Horsens",
        start: "2024-08",
        end: null,
        relevant: true,
        details: [
          "Expected to graduate in January 2028.",
          "Semester projects in Java, C#, JavaScript, HTML/CSS, PostgreSQL, Python, Assembly and C.",
        ],
      },
      {
        degree: "HTX, Upper Secondary School",
        school: "Learnmark Horsens",
        location: "Horsens",
        start: "2021-08",
        end: "2024-07",
        relevant: true,
        details: [
          "Study line: Technology A and Mathematics A, with a focus on electronics, mechanics and programming.",
          "Grade point average 7.5 (Danish scale). Grant recipient.",
        ],
      },
      {
        degree: "Data & Communication, GF2 (vocational)",
        school: "Aarhus Tech",
        location: "Aarhus",
        start: "2021-01",
        end: "2021-07",
        relevant: false,
        details: ["Binary numbers, IP addressing, and server and network technologies."],
      },
      {
        degree: "Data & Communication, GF1 (vocational)",
        school: "SDE",
        location: "Vejle",
        start: "2020-08",
        end: "2021-01",
        relevant: false,
        details: ["Binary numbers, IP addressing, and server and network technologies."],
      },
      {
        degree: "Primary and Lower Secondary School",
        school: "Hovedgård Skole",
        location: "Hovedgård",
        start: "2010-08",
        end: "2020-07",
        relevant: false,
        details: ["Grade point average 8.9 (Danish scale)."],
      },
    ],

    // Extra CV sections, shown after Education. Each one looks like
    // { title: "Volunteering", items: [...] }, where every item has the same
    // shape as an experience entry (role / org / start / end / relevant / bullets).
    sections: [],

    languages: [
      { name: "Danish", level: "Native" },
      { name: "English", level: "Advanced" },
    ],

    certifications: [
      // { name: "Certificate name", issuer: "Issuer", year: "2026", url: "" },
    ],
  },
};
