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
];

/** The featured project: shown with its architecture, above the index */
export const featured = {
  slug: "parsr",
  title: "Parsr",
  kicker: "Featured project",
  summary:
    "A CSV ingestion platform that streams files row by row, queues the work on BullMQ and Redis, validates every row and writes to MongoDB in batches, so even huge files never block the API.",
  depth: 4 as const,
  code: "https://github.com/beprodeep4718/StreamIngest",
  stack: "Next.js, Tailwind CSS, Node.js, Express, BullMQ, Redis, MongoDB and Server Sent Events",
  metrics: [
    { value: "802,028", label: "rows in one job, all validated" },
    { value: "~9 s", label: "for 100,000 rows" },
    { value: "~150 MB", label: "peak memory at 100,000 rows" },
    { value: "500–1,000", label: "rows per bulkWrite" },
  ],
  steps: [
    { title: "Upload", body: "The client sends the CSV; the Express API checks it and replies at once." },
    { title: "Queue", body: "A BullMQ job on Redis takes the work off the request." },
    { title: "Stream", body: "A worker reads the file with csv-parser, a few rows at a time." },
    { title: "Validate", body: "Three layers: structure, data rules, then business rules." },
    { title: "Write", body: "bulkWrite batches of 500 to 1,000; invalid rows kept with reasons." },
    { title: "Watch", body: "Progress lives in Redis and streams to the dashboard over SSE." },
  ],
  shots: [
    {
      src: "/work/streamingest/img4.png",
      width: 1907,
      height: 808,
      alt: "Parsr upload screen with a drop zone for CSV files up to 100 MB",
      caption: "Upload, up to 100 MB",
    },
    {
      src: "/work/streamingest/img6.png",
      width: 1078,
      height: 689,
      alt: "Parsr job execution panel showing 802,028 of 802,028 rows processed, all of them valid",
      caption: "802,028 rows, none invalid",
    },
    {
      src: "/work/streamingest/img5.png",
      width: 1903,
      height: 820,
      alt: "Parsr analytics dashboard with 802,028 users, 25 upload sessions and an 84% completion rate",
      caption: "Pipeline health dashboard",
    },
    {
      src: "/work/streamingest/img3.png",
      width: 1919,
      height: 827,
      alt: "Parsr landing page reading CSV processing made simple, with upload and analytics cards",
      caption: "Landing page",
    },
  ],
};

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
