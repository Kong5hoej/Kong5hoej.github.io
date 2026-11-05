/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PIXEL TOWN: the world of play.html
 * ─────────────────────────────────────────────────────────────────────────
 *  The map, the places in it and everything people and signs say. Projects,
 *  CV entries and skills still come from content.js; this file only holds
 *  the game's own words. Lines that mention your CV are marked CV so you
 *  can keep them in step with it.
 *
 *  Map legend (one character per 16px tile; every row the same length):
 *    T tree     b bush      o rock       L street lamp    f fence
 *    . grass    : flowers   " tall grass, home of wild bugs
 *    = path     _ paving    ~ water      q court          n badminton net
 *    v car (two tiles: vv)  F fountain (3×3)   M postbox
 *    1–9 signs (see `signs`)    > the road out of town
 *    Capital letters are buildings (see `places`). The lowercase letter in
 *    a building's bottom row is its door; you walk up to it to go in.
 */
(function () {
  "use strict";

  const C = window.PixelArt.C;

  window.PixelTown = {
    map: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT..:......b..::..........::......b...TT",
      "TT.EEEEEEEE.....PPPPPPPP.....WWWWWWWW.TT",
      "TT.EEEEEEEE.....PPPPPPPP.....WWWWWWWW.TT",
      "TT.EEEEEEEE.....PPPPPPPP.....WWWWWWWW.TT",
      "TT.EEEEEEEE.....PPPPPPPP.....WWWWWWWW.TT",
      "TT.EEEeEEEE.....PPPpPPPP.....WWWwWWWW.TT",
      "TT..:.=.:...L....:.=.:....L...:.=.:...TT",
      "TT====================================>>",
      "TT====================================>>",
      "TT..b...:.....L_________L.....:...b...TT",
      "TT.:..AAAAAA..._________....CCCCCC..:.TT",
      "TT.b..AAAAAA...___FFF___....CCCCCC....TT",
      "TT....AAAAAA...___FFF___....CCCCCC.:..TT",
      "TT....AAAAAA...___FFF___....CCCcCC....TT",
      "TT....AAAaAA..._________========.M....TT",
      "TT.:.....======__1______...:..........TT",
      "TT...b........L_________L.............TT",
      "TT..:.....b...:....=..:.......ffffffffTT",
      "TT.KKKKKK...~~~~~..=..qqqqqq..f_______TT",
      "TT.KKKKKK..~~~~~~~.=..qqqqqq..f_vv_vv_TT",
      "TT.KKKKKK..~~~~~~~.=..nnnnnn..f_______TT",
      "TT.KKKkKK...~~~~~..=..qqqqqq..f_vv____TT",
      "TT....=............=..qqqqqq..f2______TT",
      "TT====================================TT",
      'TT"""""""""""3............""""""""""""TT',
      'TT"""""""""""".....:......""""""""""""TT',
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    ],

    // Where you start, facing the visitor.
    start: { x: 19, y: 17, dir: "down" },

    // Your sprite's colours. Change them to look more like you.
    look: {
      hair: "#6b4430",
      hairLight: "#94603f",
      skin: "#f3c4a0",
      skinShade: "#d9926c",
      shirt: "#2fa392",
      shirtShade: "#257179",
      pants: "#29366f",
    },

    // The buildings, by their letter on the map, in the order the map and
    // quest list show them. `label` is painted on the roof; `hello` is said
    // on the first visit (a function gets content.js's SITE).
    places: {
      A: {
        id: "about",
        label: "ABOUT",
        title: "Home",
        style: "house",
        panel: "about",
        hello: ["My house! Come on in. Here's my trainer card."],
      },
      P: {
        id: "projects",
        label: "PROJECTS",
        title: "The lab",
        style: "lab",
        panel: "projects",
        hello: ["My lab. This is where I build things.", "Every cartridge is a project. Pick one and press play."],
      },
      W: {
        id: "work",
        label: "WORK",
        title: "The office",
        style: "office",
        panel: "quests",
        tab: "work",
        hello: ["The office. Let me open my quest log."],
      },
      E: {
        id: "school",
        label: "SCHOOL",
        title: "School",
        style: "school",
        panel: "quests",
        tab: "education",
        hello: (S) => [`${S.facts.school}. I'm studying ${S.facts.studying} here.`],
      },
      K: {
        id: "skills",
        label: "SKILLS",
        title: "Item shop",
        style: "shop",
        panel: "skills",
        hello: ["The item shop. It stocks everything in my toolbox."],
      },
      C: {
        id: "contact",
        label: "CONTACT",
        title: "Post office",
        style: "post",
        panel: "contact",
        hello: ["The post office. Want to send me a message?"],
      },
    },
    order: ["about", "projects", "work", "school", "skills", "contact"],

    // Said when the game starts. Functions get content.js's SITE.
    intro: (S, touch) => [
      `Hej! I'm ${S.person.firstName}, a ${S.person.role.toLowerCase()} from ${S.person.location}.`,
      "This is my town, and you're steering me around it. Every building tells you something about me.",
      touch
        ? "Tap where you want to go, or use the pad. A talks and opens doors."
        : "Walk with the arrow keys or WASD, or click where you want to go. SPACE talks and opens doors.",
      touch
        ? "In a hurry? Open the MAP and I'll walk you straight there."
        : "In a hurry? Press M for the map and I'll walk you straight there.",
    ],
    outro: [
      "That's the whole tour! Thanks for walking around my town.",
      "If you'd like to talk, my details are at the post office.",
    ],

    // Signs, by their digit on the map.
    signs: {
      1: ["WELCOME TO BENJAMIN'S TOWN", "Population: one developer. Known bugs: zero.*", "*Not counting the tall grass."],
      2: ["AUTOHUSET VESTERGAARD", "Benjamin's side quest since 2023: helping customers find the right car."], // CV
      3: ["CAUTION: WILD BUGS", "They live in the tall grass. Walk in if you dare."],
    },

    // People. `wander` is the box they stroll around in: [x0, y0, x1, y1].
    npcs: [
      {
        name: "STUDENT",
        x: 9,
        y: 8,
        dir: "down",
        wander: [7, 8, 11, 8],
        look: { hair: "#333c57", hairLight: "#566c86", skin: "#c68a5e", skinShade: "#a06a45", shirt: "#ef7d57", shirtShade: "#b13e53", pants: "#333c57" },
        lines: ["Hey, you were our student assistant at VIA!", "You helped me get my JavaFX project running. Thanks again!"], // CV
      },
      {
        name: "PASSER-BY",
        x: 35,
        y: 8,
        dir: "left",
        wander: [33, 8, 37, 8],
        look: { hair: "#5d275d", hairLight: "#b13e53", skin: "#8d5a3b", skinShade: "#6b402a", shirt: "#a7f070", shirtShade: "#38b764", pants: "#29366f" },
        lines: ["That's where Benjamin interns now.", "Client projects with React, Next.js, Node.js and PostgreSQL. Busy, busy."], // CV
      },
      {
        name: "KID",
        x: 24,
        y: 21,
        dir: "down",
        wander: [22, 20, 27, 21],
        look: { hair: "#ffcd75", hairLight: "#fff1b8", skin: "#f3c4a0", skinShade: "#d9926c", shirt: "#b13e53", shirtShade: "#5d275d", pants: "#94b0c2" },
        lines: ["Coach Benjamin! Want to see my warm-up?", "You coached our U13 team at Hovedgård IF. We still do the recovery exercises!"], // CV
      },
      {
        name: "CUSTOMER",
        x: 34,
        y: 23,
        dir: "left",
        look: { hair: "#94b0c2", hairLight: "#f4f4f4", skin: "#e0a77f", skinShade: "#b97f5a", shirt: "#3b5dc9", shirtShade: "#29366f", pants: "#566c86" },
        lines: ["So this one's electric, and that one's a hybrid?", "Could you walk me through it one more time?"],
      },
    ],

    // The rubber duck in the pond.
    duck: { x: 17, y: 21 },

    // Cars on the lot, in map order (left to right, top to bottom).
    cars: [
      { body: C.blue, dark: C.navy, light: C.sky, lines: ["A blue Ford.", "Benjamin represented Ford Denmark at Elbilmessen 2025."] }, // CV
      { body: C.red, dark: C.plum, light: C.orange, lines: ["A red Mazda.", "Benjamin has advised customers on cars like this one since 2023."] }, // CV
      { body: C.white, dark: C.silver, light: C.white, lines: ["A white Ford, freshly washed.", "Keeping the cars ready for customers is part of the job, too."] }, // CV
    ],

    // Everything else you can check.
    things: {
      fountain: ["You toss a coin into the fountain.", "You wish for green checks on every pull request."],
      duck: ["It's a rubber duck.", "Benjamin talks his bugs through with it, line by line. It never interrupts."],
      water: ["The pond is calm. A rubber duck bobs on the water."],
      net: ["A badminton net.", "Benjamin coached U13 badminton at Hovedgård IF from 2019 to 2020."], // CV
      lamp: ["A street lamp. It switches on when it gets dark.", "(Press N, or the NIGHT button, to see it.)"],
      mailbox: ["A red Danish postbox.", "Letters for Benjamin go in here."],
      exit: ["This road leads out of town, to the classic version of the website.", "Leave town?"],
    },

    // Wild bugs in the tall grass, and the moves that squash them. A move
    // with `miss` doesn't finish the bug off; the last move always does.
    bugs: [
      { name: "NULL POINTER", color: [C.plum, C.ink], moves: [{ use: "NULL CHECK", result: "It's super effective!" }] },
      { name: "OFF-BY-ONE", color: [C.orange, C.red], moves: [{ use: "FOR LOOP", result: "It missed by one...", miss: true }, { use: "UNIT TEST", result: "It's super effective!" }] },
      { name: "MERGE CONFLICT", color: [C.red, C.plum], moves: [{ use: "READ THE DIFF", result: "It's super effective!" }] },
      { name: "Z-INDEX BUG", color: [C.blue, C.navy], moves: [{ use: "Z-INDEX: 9999", result: "It's not very effective...", miss: true }, { use: "FLEXBOX", result: "It's super effective!" }] },
      { name: "RACE CONDITION", color: [C.yellow, C.orange], moves: [{ use: "AWAIT", result: "It's super effective!" }] },
      { name: "WORKS ON MY MACHINE", color: [C.silver, C.slate], moves: [{ use: "GITHUB ACTIONS", result: "It's super effective!" }] },
      { name: "INFINITE LOOP", color: [C.cyan, C.sky], moves: [{ use: "BREAK", result: "It's super effective!" }] },
      { name: "TYPO", color: [C.lime, C.green], moves: [{ use: "CODE REVIEW", result: "It's super effective!" }] },
    ],
  };
})();
