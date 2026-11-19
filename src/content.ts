/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT: the only file you need to edit.
 * ─────────────────────────────────────────────────────────────────────────
 *  Every page (home, projects, experience, toolbox, contact and CV) and
 *  Pixel Town are rendered from this object.
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
 *  The build type-checks this file against content-types.ts, and
 *  `npm run check` also checks the date formats.
 */
import type { Site } from "./content-types.ts";

export const SITE: Site = {
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
    photo: "", // Optional, e.g. "/img/profile.jpg" for public/img/profile.jpg. Initials are shown when empty.
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
      intro: "Things I've built, from side projects to school work. Every one of them is open source.",
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
        "The site you're looking at. A portfolio and CV in React and TypeScript with an interactive starfield and a pixel-art town to walk around in, rendered from a single content file and deployed to GitHub Pages with GitHub Actions.",
      tags: ["React", "TypeScript", "React Router", "Vite", "Canvas", "GitHub Actions"],
      repo: "https://github.com/Kong5hoej/Kong5hoej.github.io",
      live: "https://kong5hoej.github.io",
    },
    {
      name: "Weather station (IoT)",
      year: "2026",
      description:
        "The IoT part of my 4th-semester project at VIA: firmware for two Arduino Mega boards. One reads rain, wind, temperature, humidity and light sensors and posts the data to the backend over WiFi; the other opens and closes a window with a servo depending on the weather.",
      tags: ["C", "Arduino", "PlatformIO"],
      repo: "https://github.com/Kong5hoej/Semesterproject-4",
    },
    {
      name: "Machine learning assignments",
      year: "2026",
      description:
        "Six Jupyter notebooks from Machine Learning 1 at VIA: predicting used EV prices, classifying mushrooms and NASA exoplanet candidates, sentiment analysis of IMDb reviews with a small neural network, and analysing the candidate tests from the 2022 Danish general election.",
      tags: ["Python", "Jupyter", "scikit-learn", "TensorFlow", "pandas"],
      repo: "https://github.com/Kong5hoej/MAL1-Assignments",
    },
    {
      name: "VIA Tabloid",
      year: "2026",
      description:
        "A small news app for posting, listing and deleting stories by department. A Spring Boot REST API with PostgreSQL, a React and TypeScript frontend, Docker Compose to run it and GitHub Actions to test every pull request.",
      tags: ["Java", "Spring Boot", "PostgreSQL", "React", "TypeScript", "Vite", "Docker", "GitHub Actions"],
      repo: "https://github.com/Kong5hoej/DOC1-Project",
    },
    {
      name: "Trading forum",
      year: "2025",
      description:
        "My 3rd-semester project at VIA: a three-tier marketplace where users post items for sale or trade, follow users and categories, chat with sellers and get notifications. A Blazor client and an ASP.NET Core Web API with JWT login talk over gRPC to a Java database server.",
      tags: ["C#", ".NET", "Blazor", "Java", "Spring Boot", "gRPC", "PostgreSQL"],
      repo: "https://github.com/Kong5hoej/Semesterproject-3",
    },
    {
      name: "Discussion forum",
      year: "2025",
      description:
        "A forum with users, posts and comments, built in parts for a C# course at VIA: a console app, an ASP.NET Core Web API and a Blazor frontend with login, storing data in files or in SQLite through Entity Framework Core.",
      tags: ["C#", ".NET", "Blazor", "Entity Framework Core", "SQLite"],
      repo: "https://github.com/Kong5hoej/DNP1-Assignment",
    },
    {
      name: "Slaughterhouse tracker",
      year: "2025",
      description:
        "A distributed system that follows animals through a slaughterhouse, from registration to cut parts, trays and packed products, so every product can be traced back to its animals and the other way round. Three stations talk to a database server over gRPC, which also serves a REST API.",
      tags: ["Java", "gRPC", "Spring Boot", "Maven"],
      repo: "https://github.com/Kong5hoej/PRO3-Assignment",
    },
    {
      name: "Algorithms & data structures",
      year: "2025",
      description:
        "Jupyter notebooks implementing a circular queue, selection, insertion and merge sort (with timing plots) and breadth-first search, each tested with the ZOMBIE approach.",
      tags: ["Python", "Jupyter", "matplotlib"],
      repo: "https://github.com/Kong5hoej/ADS1-Assignments",
    },
    {
      name: "VIAGames",
      year: "2025",
      description:
        "My 2nd-semester project at VIA: a client–server game platform where players add friends, invite each other or find an opponent, and play Tic-Tac-Toe or Connect Four over the network, with in-game chat and leaderboards.",
      tags: ["Java", "JavaFX", "PostgreSQL", "JUnit"],
      repo: "https://github.com/Kong5hoej/Semesterproject-2",
    },
    {
      name: "VIAPets",
      year: "2024",
      description:
        "My 1st-semester project at VIA: a management system for a small pet shop with a kennel. Staff keep track of animals, customers, sales and bookings in a desktop app, which also feeds the shop's public website with the animals for sale.",
      tags: ["Java", "JavaFX", "HTML", "CSS", "JavaScript", "Bootstrap"],
      repo: "https://github.com/Kong5hoej/Semesterproject-1",
    },
    {
      name: "Arduino boat",
      year: "2024",
      description:
        "My Mechatronics exam project at HTX: an Arduino boat driven with two joysticks, one running the motor forward and backward and one turning a servo to steer. Along the way we also tested radio control and high- and low-pass filters.",
      tags: ["Arduino", "C++"],
      repo: "https://github.com/Kong5hoej/Arduino-Boat-Program",
      live: "https://www.youtube.com/shorts/MhJPEbB5rvs",
    },
    {
      name: "Jeopardy",
      year: "2024",
      description: "My Programming exam project at HTX: a Jeopardy quiz game for Windows, with categories, point values and hints.",
      tags: ["C#", "Windows Forms"],
      repo: "https://github.com/Kong5hoej/Jeopardy",
    },
    {
      name: "Dating sim",
      year: "2024",
      description: "A text-based dating simulator for the console, written with a classmate in Programming at HTX.",
      tags: ["C#", ".NET"],
      repo: "https://github.com/Kong5hoej/DatingSim",
    },
    {
      name: "Dobot automation",
      year: "2024",
      description: "A program for a Dobot robot arm that moves red, green or blue boxes depending on which button is pressed. Made in Mechatronics at HTX with Blockly and Python.",
      tags: ["Python", "Blockly"],
      repo: "https://github.com/Kong5hoej/Dobot-automation",
      live: "https://www.youtube.com/watch?v=3qfusTe5NE8",
    },
    {
      name: "Dice roll",
      year: "2023",
      description: "A console program with a die and a dice cup that keeps track of the total, the highest roll and the number of rolls. From Programming at HTX.",
      tags: ["C#", ".NET"],
      repo: "https://github.com/Kong5hoej/DiceRoll",
    },
    {
      name: "Grill thermometer",
      year: "2023",
      description: "An Arduino thermometer for a grill that reads a thermocouple and lights a blue, green or red LED depending on the temperature. Made in Mechatronics at HTX.",
      tags: ["Arduino", "C++"],
      repo: "https://github.com/Kong5hoej/Grill",
    },
    {
      name: "Prime factors",
      year: "2023",
      description: "A console program that splits any whole number into its prime factors, from Programming at HTX.",
      tags: ["C#", ".NET"],
      repo: "https://github.com/Kong5hoej/PrimeNumbers",
    },
    {
      name: "CPR analyzer",
      year: "2023",
      description: "A console program that works out the check digit of a Danish CPR number, or checks whether a full one is valid. From Programming at HTX.",
      tags: ["C#", ".NET"],
      repo: "https://github.com/Kong5hoej/CPR-analyzer",
    },
    {
      name: "Quiz",
      year: "2023",
      description: "A console maths quiz with ten random questions and a score at the end. From Programming at HTX.",
      tags: ["C#", ".NET"],
      repo: "https://github.com/Kong5hoej/Quiz",
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
