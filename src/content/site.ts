/**
 * Every word on the site lives here.
 * Items marked TODO need a real value from you before launch.
 */

export const site = {
  name: "Beprodeep Das",
  shortName: "Beprodeep",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  title: "Beprodeep Das · Full stack engineer from Jalpaiguri",
  description:
    "Full stack engineer and SDE intern at MindWebs Ventures, building the interface you see and the systems underneath it, from React and Next.js down to Redis, RabbitMQ and Docker.",
  location: "Jalpaiguri, West Bengal",
  coordinates: "26.52° N, 88.72° E",
  timeZone: "Asia/Kolkata",

  /** TODO: the email you want people to use. Until it is set, contact buttons open LinkedIn. */
  email: "" as string,

  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/beprodeep-das-095043290", icon: "linkedin" },
    { label: "GitHub", href: "https://github.com/beprodeep4718", icon: "github" },
    { label: "Instagram", href: "https://www.instagram.com/beprodeep4718", icon: "instagram" },
  ],
} as const;

export const nav = [
  { label: "Work", href: "#work", id: "work" },
  { label: "Stack", href: "#stack", id: "stack" },
  { label: "Now", href: "#now", id: "now" },
] as const;

export const primaryCta = {
  label: "Get a project estimate",
  href: "#contact",
};

export const hero = {
  lead: "I build the interface you see and the systems underneath it, from React on the surface down to queues and containers.",
  nameNote: "My name means light in the darkness. Most of my work happens deep in the stack, where a little light goes a long way.",
  now: ["SDE intern at MindWebs Ventures", "Final year, B.Tech ECE at JGEC"],
  availability: "Open to freelance work",
  hintPointer: "Move your cursor to carry the light and see what runs underneath.",
  hintScroll: "Scroll and it goes down into the stack.",
};

export type Project = {
  slug: string;
  title: string;
  what: string;
  detail: string;
  stack: string;
  /** How many of the four stack layers the project reaches, from the interface down */
  depth: 1 | 2 | 3 | 4;
  live?: string;
  code?: string;
  image?: { src: string; alt: string };
};

export const projects: Project[] = [
  {
    slug: "techtronics",
    title: "Techtronics",
    what: "Event and registration platform for the ECE fest at JGEC",
    detail:
      "Students register for events online, and organisers add, edit and remove events from their own admin panel.",
    stack: "React, Node.js, Express, MongoDB and Cloudinary",
    depth: 3,
    live: "https://techtronics.jgec.tech/",
    code: "https://github.com/beprodeep4718/ece-fest-jgec",
    image: { src: "/work/techtronics.png", alt: "Techtronics home page with a 3D character and the event title" },
  },
  {
    slug: "chatrix",
    title: "Chatrix",
    what: "Real time chat with one to one and group conversations",
    detail: "Messages arrive instantly over Socket.io, with accounts on MongoDB and media stored on Cloudinary.",
    stack: "React, Node.js, Socket.io, MongoDB and Cloudinary",
    depth: 3,
    live: "https://chat-app-8f2r.onrender.com/",
    code: "https://github.com/beprodeep4718/chat-app",
    image: { src: "/work/chatrix.png", alt: "Chatrix sign up screen with name, email and password fields" },
  },
  {
    slug: "bharat-blog",
    title: "Bharat Blog",
    what: "Blogging platform with an admin area, rendered on the server",
    detail:
      "Writers create, edit and delete posts from an admin area. Pages render on the server with EJS, so they load fast.",
    stack: "Node.js, Express, MongoDB and EJS",
    depth: 3,
    live: "https://blog-website-4ueh.onrender.com/",
    code: "https://github.com/beprodeep4718/Blog-website",
    image: { src: "/work/blog.png", alt: "Bharat Blog home page with a welcome heading over a typewriter photo" },
  },
  {
    // TODO: add live link, code link and a screenshot
    slug: "anjusa",
    title: "Anjusa Academy",
    what: "Platform for an art and computer academy",
    detail:
      "Artists submit artwork, admins publish notices and manage users, and every route checks the role of whoever is asking.",
    stack: "React, Express, MongoDB, Cloudinary and JWT",
    depth: 3,
  },
  {
    // TODO: add live link, code link and a screenshot
    slug: "early2code",
    title: "Early2Code",
    what: "Site for a coding school for kids",
    detail: "A Next.js App Router site for a school that prepares kids for careers in AI and tech.",
    stack: "Next.js, React, TypeScript and Zustand",
    depth: 1,
  },
];

export const layers = [
  { depth: "01", title: "Interface", what: "What people see and touch.", tools: "Next.js, React, TypeScript, Tailwind CSS and GSAP" },
  { depth: "02", title: "Application", what: "Where the rules live.", tools: "Node.js, Express, REST APIs, Socket.io and JWT auth" },
  { depth: "03", title: "Data", what: "What has to be remembered.", tools: "MongoDB, Mongoose, Redis and Cloudinary" },
  { depth: "04", title: "Infrastructure", what: "What keeps it all running at 3 a.m.", tools: "Docker, RabbitMQ, job queues, Render and Vercel" },
];

export const now = {
  statement:
    "Final year of electronics and communication engineering at JGEC, shipping software at MindWebs Ventures, and taking on a few freelance builds on the side.",
  items: [
    {
      label: "Studying",
      value: "B.Tech in Electronics and Communication Engineering, final year, Jalpaiguri Government Engineering College",
    },
    { label: "Working", value: "SDE intern at MindWebs Ventures" },
    { label: "Building", value: "Freelance sites and apps for founders and small teams" },
    /** TODO: what you are learning right now. Left empty, the row is hidden. */
    { label: "Learning", value: "" },
    { label: "Based", value: "Jalpaiguri, West Bengal, at the foot of the Himalaya" },
  ],
};

export const services = {
  heading: "If you need something built",
  items: [
    { title: "A site that loads fast", body: "Next.js marketing sites and landing pages with smooth motion and search basics built in." },
    { title: "An app with a real backend", body: "Sign in, dashboards, admin panels and real time features on MERN and TypeScript." },
    { title: "A system that holds under load", body: "Job queues on Redis and RabbitMQ, and Docker deploys that behave the same everywhere." },
  ],
};

export const contact = {
  heading: "Say hello",
  body: "Tell me what you are building and when you need it. You get the scope, a timeline and an estimate before any work starts. Or just say hi.",
  emailSubject: "Hello from your portfolio",
  emailBody: "Hi Beprodeep,\n\nWhat I am building:\nWhen I need it:\n",
};
