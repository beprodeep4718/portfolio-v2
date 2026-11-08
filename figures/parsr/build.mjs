import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { kitScript } from "../scripts/inline-kit.mjs";
import { M, plan, cardAt, stateAt, readoutOf } from "./model.mjs";

/*
 * Fig: Parsr, a ticket-rail card sorter.
 *
 * Job ticket on a rail      = a BullMQ job waiting on Redis
 * Reel of punched tape      = the CSV, streamed a row at a time (the reel shrinks)
 * Pinch rollers and reader  = createReadStream + csv-parser
 * Three gates over the belt = three validation layers (structure, data, business)
 * Pusher and reject tray    = invalid rows kept with their reason
 * Hatch that sinks at four  = a bulkWrite of 1,000 rows into MongoDB (the cabinet)
 * Counter, wire and gauge   = progress in Redis, pushed to the dashboard over SSE
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 760;
const HEIGHT = 380;

const PLATE = { x: -312, y: -80, w: 648, d: 192, r: 10 };
const PLATE_H = 12;
const FOOT_H = 5;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-290, -62, 78], [-262, 20, 58], [45, 50, 72], [214, 18, 46], [298, 88, 44]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 58 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const screws = (pts, z) => D(pts.map(([x, y]) => at([x, y, z])), { size: 0.45 });
const face = (x, y0, y1, z0, z1) => k.pathOf([at([x, y0, z0]), at([x, y1, z0]), at([x, y1, z1]), at([x, y0, z1])], true);

/* ------------------------------------------------------------ base */
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 24), [PLATE.x + PLATE.w / 2, PLATE.y + 24], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 24]];
  for (const [x, y] of byDepth(feet)) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(slab(PLATE, -PLATE_H, PLATE_H, 8, 1.6), { tone: "lo", inner: L(k.sideSeam(PLATE, -5, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const corner = k.corners(PLATE, 11);
  out.push(L(corner.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(screws(corner, 0));
  /* ruler strip along the front */
  const strip = { x: -230, y: PLATE.y + PLATE.d - 15, w: 320, d: 7, r: 1 };
  out.push(S(slab(strip, 0, 0.6, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  /* label plate, front left */
  const label = { x: -296, y: PLATE.y + PLATE.d - 36, w: 52, d: 22, r: 2 };
  out.push(S(slab(label, 0, 0.8, 4), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  [30, 22, 26].forEach((w, i) => out.push(L(k.lineOnTop([label.x + 6, label.y + 6 + i * 5], [label.x + 6 + w, label.y + 6 + i * 5], 0.8, P), { tone: "lo", free: true })));
  out.push(screws([[label.x + 3, label.y + 3], [label.x + label.w - 3, label.y + label.d - 3]], 0.8));
  return out.join("");
}

/* ------------------------------------------------------------ queue: ticket rail */
const RAIL_Y = -62;
const RAIL_Z = 74;
const TICKET_X = [-270, -250, -230, -210, -190];
const TICKET_END = -150;
function railBack() {
  const out = [];
  for (const x of [-292, -132]) {
    out.push(S(k.cylinder(x, RAIL_Y, 6, 0, 3, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, RAIL_Y, 2.6, 3, RAIL_Z - 3, P, 20), { tone: "mid", crease: "none" }));
    out.push(L([20, 46].map((z) => k.sideArc(x, RAIL_Y, 2.6, z, P, 12)).join(""), { tone: "faint" }));
    out.push(screws([[x - 4, RAIL_Y], [x + 4, RAIL_Y]], 3));
  }
  out.push(S(slab({ x: -296, y: RAIL_Y - 2.5, w: 168, d: 5, r: 1.5 }, RAIL_Z, 4, 3, 0.4), { tone: "mid" }));
  out.push(S(slab({ x: -299, y: RAIL_Y - 3.5, w: 5, d: 7, r: 1.5 }, RAIL_Z - 1, 6, 3), { tone: "mid" }));
  out.push(S(slab({ x: -130, y: RAIL_Y - 3.5, w: 5, d: 7, r: 1.5 }, RAIL_Z - 1, 6, 3), { tone: "mid" }));
  return out.join("");
}
function ticket(lit = false) {
  const out = [];
  out.push(S(slab({ x: -4, y: -2.2, w: 8, d: 4.4, r: 1 }, RAIL_Z - 6, 8, 2), { tone: "mid" }));
  const card = { x: -9, y: -0.6, w: 18, d: 1.2, r: 0.4 };
  out.push(S(slab(card, RAIL_Z - 38, 32, 2), { tone: "hi", crease: "lo", lit }));
  const fy = 0.6;
  [0, 1, 2, 3].forEach((i) => out.push(L(k.segment([-6, fy, RAIL_Z - 14 - i * 5], [6 - (i % 2) * 4, fy, RAIL_Z - 14 - i * 5], P), { tone: "lo", free: true })));
  out.push(L(k.segment([-9, fy, RAIL_Z - 10], [9, fy, RAIL_Z - 10], P), { tone: "faint" }));
  out.push(D([at([0, fy, RAIL_Z - 8])], { size: 0.5 }));
  return out.join("");
}

/* ------------------------------------------------------------ stream: reel, tape, reader */
const REEL = [-262, 20];
const REEL_Z = 40;
const R_EMPTY = 13;
const R_FULL = 32;
const ROLL = [-178, 50];
function reelBase() {
  const [x, y] = REEL;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 26, y: y - 26, w: 52, d: 52, r: 26 }, 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.cylinder(x, y, 26, 0, 4, P, 56, 0.8), { tone: "lo" }));
  out.push(L(k.ring(x, y, 21, 4, P, 48), { tone: "faint" }));
  out.push(screws([[x - 18, y], [x + 18, y], [x, y - 18], [x, y + 18]], 4));
  out.push(S(k.cylinder(x, y, 9, 4, REEL_Z - 4, P, 32), { tone: "mid", crease: "none" }));
  out.push(L([14, 28].map((z) => k.sideArc(x, y, 9, z, P, 20)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 34, REEL_Z, 1.4, P, 72, 0.6), { tone: "mid" }));
  return out.join("");
}
function reelTop() {
  const [x, y] = REEL;
  const out = [];
  out.push(S(k.cylinder(x, y, 34, REEL_Z + 11.4, 1.4, P, 72, 0.6), { tone: "mid" }));
  out.push(L(k.ring(x, y, 30, REEL_Z + 12.8, P, 64), { tone: "faint" }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    out.push(L(k.ring(x + Math.cos(a) * 21, y + Math.sin(a) * 21, 5, REEL_Z + 12.8, P, 20), { tone: "lo" }));
  }
  out.push(S(k.cylinder(x, y, 7, REEL_Z + 12.8, 4.2, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 7, REEL_Z + 12.8, REEL_Z + 17, 30, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, 2.2, REEL_Z + 17, P, 16), { tone: "mid" }));
  return out.join("");
}
const packOf = (r) => S(k.cylinder(REEL[0], REEL[1], r, REEL_Z + 1.4, 10, P, 64), { tone: "hi", crease: "lo" });
const tapeRing = (r) => {
  const a = [REEL[0], REEL[1] + r];
  return [[a[0], a[1] - 0.5], [ROLL[0], ROLL[1] - 0.5], [ROLL[0], ROLL[1] + 0.5], [a[0], a[1] + 0.5]];
};
const tapeOf = (r) => S(k.extrude(tapeRing(r), REEL_Z + 2, 9, P), { tone: "hi", crease: "lo" });
const holesOf = (r, phase) => {
  const a = [REEL[0], REEL[1] + r + 0.5];
  const b = [ROLL[0] - 6, ROLL[1] + 0.5];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pts = [];
  for (let s = 4 - (phase % 4); s < len - 2; s += 4) {
    const f = s / len;
    pts.push(at([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, REEL_Z + 6.5]));
  }
  return pts;
};
function reader() {
  const out = [];
  const ped = { x: -190, y: 32, w: 38, d: 36, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(ped, 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(slab(ped, 0, 4, 4, 0.6), { tone: "lo" }));
  out.push(S(slab(k.insetPlan(ped, 4), 4, 22, 4), { tone: "mid", inner: L(k.sideSeam(k.insetPlan(ped, 4), 14, P, 4), { tone: "faint" }) }));
  const head = { x: -190, y: 34, w: 36, d: 32, r: 3 };
  out.push(S(slab(head, 26, 14, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(head, 33, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(head, 3), 40, P, 4), { tone: "faint" }));
  out.push(screws(k.corners(head, 4), 40));
  /* exit slot on the +x face, where cards leave onto the belt */
  out.push(L(face(head.x + head.w, 41, 59, 33.6, 37), { tone: "lo" }));
  /* read head with its lamp */
  out.push(S(slab({ x: -168, y: 45, w: 10, d: 10, r: 2 }, 40, 6, 3, 0.4), { tone: "mid" }));
  out.push(L(k.ring(-163, 50, 2.4, 46, P, 16), { tone: "lo" }));
  out.push(D([at([-163, 50, 46])], { size: 0.6, tone: "hi", pulse: true }));
  /* adjusting screws */
  out.push(S(k.cylinder(-186, 62, 2.4, 40, 3, P, 16), { tone: "mid" }));
  out.push(L(k.knurl(-186, 62, 2.4, 40, 43, 14, P), { tone: "lo" }));
  return out.join("");
}
function rollers() {
  const out = [];
  for (const y of [43.6, 56.4]) {
    out.push(S(k.cylinder(ROLL[0], y, 6, 40, 1.4, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(ROLL[0], y, 5.4, 41.4, 12, P, 32), { tone: "mid" }));
    out.push(L(k.knurl(ROLL[0], y, 5.4, 43, 51, 26, P), { tone: "lo" }));
    out.push(S(k.cylinder(ROLL[0], y, 2.2, 53.4, 2.4, P, 16), { tone: "mid" }));
  }
  return out.join("");
}

/* ------------------------------------------------------------ belt and frame */
const BELT = { x: -150, y: 36, w: 324, d: 28, r: 2 };
const BELT_TOP = 34;
const LEGS = [-140, -60, 20, 100, 160];
function frameBack() {
  const out = [];
  for (const x of LEGS) out.push(S(slab({ x: x - 3, y: 31, w: 6, d: 4, r: 1 }, 0, 24, 2), { tone: "mid" }));
  out.push(S(slab({ x: -154, y: 31, w: 332, d: 4, r: 1 }, 24, 12, 3, 0.4), { tone: "mid" }));
  return out.join("");
}
function belt() {
  const out = [];
  out.push(S(slab({ x: -156, y: 31, w: 4, d: 38, r: 1 }, 24, 12, 2), { tone: "mid" }));
  out.push(S(slab(BELT, 28, BELT_TOP - 28, 3, 0.4), { tone: "lo", crease: "faint" }));
  return out.join("");
}
const cleatsOf = (phase) => {
  let d = "";
  for (let x = BELT.x + 2 + (phase % 16); x < BELT.x + BELT.w - 2; x += 16) d += k.lineOnTop([x, BELT.y], [x, BELT.y + BELT.d], BELT_TOP, P);
  return d;
};
function frameFront() {
  const out = [];
  for (const x of LEGS) {
    out.push(S(slab({ x: x - 3, y: 65, w: 6, d: 4, r: 1 }, 0, 24, 2), { tone: "mid" }));
    out.push(S(slab({ x: x - 5, y: 63, w: 10, d: 8, r: 1 }, 0, 1.6, 2), { tone: "lo" }));
  }
  const rail = { x: -154, y: 65, w: 332, d: 4, r: 1 };
  out.push(S(slab(rail, 24, 12, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(rail, 30, P, 3), { tone: "faint" }) }));
  out.push(screws(LEGS.map((x) => [x, 67]), 36));
  return out.join("");
}

/* ------------------------------------------------------------ gates */
const GATE_TOP = 62;
function gateBack(gx) {
  return S(slab({ x: gx - 3, y: 27, w: 6, d: 4, r: 1 }, 0, GATE_TOP, 2, 0.3), { tone: "mid" });
}
function gateTool(gx, g) {
  if (g === 0) {
    /* structure: a comb template the card slides under */
    const out = [S(slab({ x: gx - 1.2, y: 38, w: 2.4, d: 24, r: 0.4 }, 44, GATE_TOP - 44, 2), { tone: "mid" })];
    out.push(D(Array.from({ length: 6 }, (_, i) => at([gx + 1.2, 40 + i * 4, 45.5])), { size: 0.45, tone: "lo" }));
    return out.join("");
  }
  if (g === 1) {
    /* data rules: a probe whose plunger drops onto the card */
    return S(k.cylinder(gx, 50, 3.4, 52, GATE_TOP - 52, P, 24), { tone: "mid" }) + L(k.sideArc(gx, 50, 3.4, 56, P, 16), { tone: "faint" });
  }
  /* business rules: a ledger stamp on a guide rod */
  return S(k.cylinder(gx, 50, 1.6, 50, GATE_TOP - 50, P, 16), { tone: "mid", crease: "none" });
}
function gateMover(gx, g) {
  if (g === 0) return "";
  if (g === 1) return S(k.cylinder(gx, 50, 1.4, 38, 14, P, 16), { tone: "hi", crease: "none" });
  const stamp = { x: gx - 6, y: 44, w: 12, d: 12, r: 1.5 };
  return S(slab(stamp, 42, 8, 3, 0.4), { tone: "mid" }) + L(k.planOutline(k.insetPlan(stamp, 2), 50, P, 3), { tone: "faint" });
}
function gateFront(gx) {
  const out = [];
  const beam = { x: gx - 5, y: 26, w: 10, d: 48, r: 1.5 };
  out.push(S(slab(beam, GATE_TOP, 6, 3, 0.5), { tone: "mid" }));
  out.push(screws([[gx, 29], [gx, 71]], GATE_TOP + 6));
  out.push(S(k.cylinder(gx, 50, 3, GATE_TOP + 6, 2, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(gx, 50, 2.4, GATE_TOP + 8, 2, P, 20), { tone: "mid" }));
  out.push(S(slab({ x: gx - 3, y: 69, w: 6, d: 4, r: 1 }, 0, GATE_TOP, 2, 0.3), { tone: "mid" }));
  return out.join("");
}
const lampOf = (gx) => at([gx, 50, GATE_TOP + 10]);

/* ------------------------------------------------------------ cards */
const CARD = { x: -10, y: -10, w: 20, d: 20, r: 1.5 };
function cardArt() {
  const out = [S(slab(CARD, 0, M.CARD_H, 3, 0.4), { tone: "hi", crease: "lo" })];
  out.push(D(Array.from({ length: 5 }, (_, i) => at([-6 + i * 3, -5, M.CARD_H])), { size: 0.45, tone: "lo" }));
  out.push(L(k.lineOnTop([-6, 1], [6, 1], M.CARD_H, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([-6, 4.5], [2, 4.5], M.CARD_H, P), { tone: "lo", free: true }));
  return out.join("");
}

/* ------------------------------------------------------------ reject tray and pusher */
const TRAY = { x: 88, y: 74, w: 36, d: 28, r: 2 };
function tray() {
  const out = [`<path class="iso-halo" d="${k.haloOf(TRAY, 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(slab(TRAY, 0, 3, 3, 0.5), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 5), 3, P, 3), { tone: "faint" }));
  out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 3, r: 1 }, 3, 10, 2), { tone: "mid" }));
  out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 3, 10, 2), { tone: "mid" }));
  return out.join("");
}
function trayFront() {
  const out = [];
  out.push(S(slab({ x: TRAY.x + TRAY.w - 3, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 3, 10, 2), { tone: "mid" }));
  const lip = { x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 1 };
  out.push(S(slab(lip, 3, 5, 2, 0.3), { tone: "mid" }));
  out.push(screws([[TRAY.x + 4, TRAY.y + TRAY.d - 1.5], [TRAY.x + TRAY.w - 4, TRAY.y + TRAY.d - 1.5]], 8));
  return out.join("");
}
function pusherBase() {
  const out = [];
  out.push(S(slab({ x: 99, y: 6, w: 12, d: 10, r: 1.5 }, 0, 26, 3), { tone: "mid" }));
  const guide = { x: 96, y: 4, w: 18, d: 22, r: 2 };
  out.push(S(slab(guide, 26, 18, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(guide, 35, P, 3), { tone: "faint" }) }));
  out.push(screws(k.corners(guide, 3), 44));
  out.push(S(k.cylinder(114.4, 15, 3, 32, 4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(114.4, 15, 3, 32, 36, 16, P), { tone: "lo" }));
  return out.join("");
}
function ram() {
  const out = [];
  out.push(S(slab({ x: 102, y: 8, w: 6, d: 24, r: 1 }, 37, 5, 2), { tone: "mid", crease: "none" }));
  out.push(S(slab({ x: 99, y: 30, w: 12, d: 4, r: 1 }, 35.6, 8, 2, 0.3), { tone: "hi", crease: "lo" }));
  return out.join("");
}

/* ------------------------------------------------------------ cabinet (MongoDB) */
const CAB = { x: 176, y: 18, w: 80, d: 76, r: 3 };
const HATCH = { x: 179, y: 37, w: 24, d: 26, r: 1.5 };
const DRAWERS = [5, 14, 23];
function cabinetBody() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, 0.1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(slab(k.insetPlan(CAB, -2), 0, 3, 4), { tone: "lo" }));
  out.push(S(slab(CAB, 3, M.STACK_Z - 3, 4, 0.6), { tone: "mid" }));
  /* rim around the hatch: back and left first, the stack, then right and front */
  out.push(S(slab({ x: CAB.x, y: CAB.y, w: CAB.w, d: HATCH.y - CAB.y, r: 2 }, M.STACK_Z, 8, 3, 0.4), { tone: "mid" }));
  out.push(S(slab({ x: CAB.x, y: HATCH.y, w: HATCH.x - CAB.x, d: HATCH.d, r: 0.5 }, M.STACK_Z, 8, 2), { tone: "mid" }));
  out.push(L(k.planOutline(HATCH, M.STACK_Z, P, 2), { tone: "faint" }));
  return out.join("");
}
function cabinetFront() {
  const out = [];
  out.push(S(slab({ x: HATCH.x + HATCH.w, y: HATCH.y, w: CAB.x + CAB.w - HATCH.x - HATCH.w, d: HATCH.d, r: 0.5 }, M.STACK_Z, 8, 2), { tone: "mid" }));
  const front = { x: CAB.x, y: HATCH.y + HATCH.d, w: CAB.w, d: CAB.y + CAB.d - HATCH.y - HATCH.d, r: 2 };
  out.push(S(slab(front, M.STACK_Z, 8, 3, 0.5), { tone: "mid" }));
  out.push(screws([[CAB.x + 4, CAB.y + 4], [CAB.x + CAB.w - 4, CAB.y + 4], [CAB.x + 4, CAB.y + CAB.d - 4], [CAB.x + CAB.w - 4, CAB.y + CAB.d - 4]], 34));
  /* three drawers on the +y face */
  const fy = CAB.y + CAB.d;
  DRAWERS.forEach((z) => {
    const plan = { x: CAB.x + 4, y: fy, w: CAB.w - 8, d: 2.4, r: 0.8 };
    out.push(S(slab(plan, z, 7.5, 2, 0.3), { tone: "mid" }));
    out.push(S(slab({ x: CAB.x + 34, y: fy + 2.4, w: 12, d: 2, r: 0.6 }, z + 2.6, 2.2, 2), { tone: "lo" }));
    out.push(L(k.pathOf([at([CAB.x + 8, fy + 2.4, z + 2]), at([CAB.x + 28, fy + 2.4, z + 2]), at([CAB.x + 28, fy + 2.4, z + 5.6]), at([CAB.x + 8, fy + 2.4, z + 5.6])], true), { tone: "lo" }));
    out.push(D([at([CAB.x + 55, fy + 2.4, z + 3.8]), at([CAB.x + 68, fy + 2.4, z + 3.8])], { size: 0.4 }));
  });
  /* counter box on the rim: progress state */
  const box = { x: 222, y: 40, w: 24, d: 18, r: 2 };
  out.push(S(slab(box, 34, 10, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, 39, P, 3), { tone: "faint" }) }));
  out.push(D(k.dotGrid(box.x + 4, box.y + 4, 4, 3, 2.4, 44, P), { size: 0.4, tone: "lo" }));
  out.push(screws([[box.x + 2, box.y + 2], [box.x + box.w - 2, box.y + box.d - 2]], 44));
  return out.join("");
}
const fillOf = (filed) => {
  const fy = CAB.y + CAB.d + 2.4;
  const per = 4 * M.PER_BATCH * M.PER_CARD;
  return DRAWERS.map((z, i) => {
    const f = Math.min(1, Math.max(0, (filed - i * per) / per));
    if (f <= 0) return "";
    return k.pathOf([at([CAB.x + 8.6, fy, z + 3.8]), at([CAB.x + 8.6 + 18.8 * f, fy, z + 3.8])]);
  }).join("");
};
const LED = [242, 58, 41];

/* ------------------------------------------------------------ dashboard gauge */
const GAUGE = [298, 88];
const G_R = 17;
const G_Z = 34;
const G_TOP = G_Z + 8;
function gauge() {
  const [x, y] = GAUGE;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 11, y: y - 11, w: 22, d: 22, r: 11 }, 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.cylinder(x, y, 11, 0, 3, P, 32, 0.6), { tone: "lo" }));
  out.push(screws([[x - 7, y], [x + 7, y]], 3));
  out.push(S(k.cylinder(x, y, 2.4, 3, G_Z - 3, P, 16), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(x, y, 2.4, 16, P, 12), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, G_R, G_Z, 8, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, G_R, G_TOP - 3, G_TOP, 72, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, G_R - 2, G_TOP, P, 64), { tone: "lo" }));
  const t = k.radialTicks(x, y, G_R - 3, 40, 5, G_TOP, [1.2, 2.6], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(S(slab({ x: x - 2.4, y: y - G_R - 4, w: 4.8, d: 5, r: 1.2 }, G_Z + 2, 4, 3), { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.5, G_TOP, P, 16), { tone: "mid" }));
  return out.join("");
}
const needleOf = (p) => {
  const a = -Math.PI * 0.75 + p * Math.PI * 1.5;
  const [x, y] = GAUGE;
  return k.lineOnTop([x - Math.sin(a) * 3, y + Math.cos(a) * 3], [x + Math.sin(a) * (G_R - 4), y - Math.cos(a) * (G_R - 4)], G_TOP + 0.2, P);
};

/* ------------------------------------------------------------ assemble */
const Sx = plan();
const s0 = stateAt(0, Sx);
const cardIds = Array.from({ length: M.CARDS }, (_, i) => i);
const hatchClip = k.slabOf(HATCH, M.STACK_Z, 40, P, 2).fill;
const wire = k.wireSvg(at([LED[0], LED[1] - 4, 39]), at([GAUGE[0] - 10, GAUGE[1] - 4, 2]), {
  via: [at([LED[0] + 4, LED[1], 34.4]), at([CAB.x + CAB.w + 0.4, 70, 30]), at([CAB.x + CAB.w + 0.4, 70, 1]), at([GAUGE[0] - 16, 70, 0.4])],
  tone: "lo",
  flow: true,
});

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A card sorter on a bench, explaining Parsr. A job ticket waits on a rail, then slides to a reader. A reel of punched tape, the CSV file, unwinds through pinch rollers a row at a time. Rows leave the reader as cards on a belt and pass three gates: a structure template, a data probe and a business rules stamp. A pusher knocks failed cards into a reject tray. Valid cards stack in a hatch on a filing cabinet; at 1,000 rows the hatch sinks and the batch is filed, like a MongoDB bulkWrite. A counter on the cabinet sends progress down a wire to a dial gauge.",
  body: [
    base(),
    railBack(),
    `<g data-part="tickets">${TICKET_X.map((x, i) => `<g data-ticket="${i}" transform="${k.translateAlong(P, [x, RAIL_Y, 0])}">${ticket(i === TICKET_X.length - 1)}</g>`).join("")}</g>`,
    reelBase(),
    `<g data-part="pack">${packOf(R_FULL)}</g>`,
    reelTop(),
    `<g data-part="tape">${tapeOf(R_FULL)}</g>`,
    `<g data-part="holes">${D(holesOf(R_FULL, 0), { size: 0.5, tone: "lo" })}</g>`,
    reader(),
    rollers(),
    M.GATES.map((gx) => gateBack(gx)).join(""),
    pusherBase(),
    frameBack(),
    belt(),
    `<path data-part="cleats" class="iso-line" data-tone="faint" d="${cleatsOf(0)}"/>`,
    cabinetBody(),
    `<clipPath id="parsr-hatch"><path d="${hatchClip}"/></clipPath>`,
    `<g data-layer="hatch" clip-path="url(#parsr-hatch)">${cardIds.filter((i) => !M.BAD[i]).map((i) => `<g data-card="${i}" data-in="hatch" opacity="0">${cardArt()}</g>`).join("")}</g>`,
    `<g data-part="ram">${ram()}</g>`,
    `<g data-layer="belt">${cardIds.map((i) => `<g data-card="${i}" data-in="belt" opacity="0">${cardArt()}</g>`).join("")}</g>`,
    M.GATES.map((gx, g) => gateTool(gx, g) + `<g data-gate="${g}">${gateMover(gx, g)}</g>`).join(""),
    M.GATES.map((gx) => gateFront(gx)).join(""),
    frameFront(),
    tray(),
    `<g data-layer="tray">${cardIds.filter((i) => M.BAD[i]).map((i) => `<g data-card="${i}" data-in="tray" opacity="0">${cardArt()}</g>`).join("")}</g>`,
    trayFront(),
    cabinetFront(),
    `<path data-part="fill" class="iso-line" data-tone="hi" d="" style="stroke-width:1.4"/>`,
    wire,
    gauge(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleOf(0)}" style="stroke-width:1.1"/>`,
    `<g data-part="lamps">${M.GATES.map((gx, g) => {
      const [sx, sy] = lampOf(gx);
      return `<circle data-lamp="${g}" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="1.5" class="parsr-lamp"/>`;
    }).join("")}${(() => {
      const [sx, sy] = at(LED);
      return `<circle data-part="led" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="1.3" class="parsr-lamp"/>`;
    })()}</g>`,
  ],
});

const MODEL_SRC = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

/* The helpers the page rebuilds per frame. `kit` is "" when the kit is inlined, "k." when it is imported */
const liveHead = (kit) => {
  const fn = (f) => (kit ? f.toString() : f.toString().replace(/k\./g, ""));
  return `
const P = ${JSON.stringify(P)};
const REEL = ${JSON.stringify(REEL)}, REEL_Z = ${REEL_Z}, R_EMPTY = ${R_EMPTY}, R_FULL = ${R_FULL}, ROLL = ${JSON.stringify(ROLL)};
const BELT = ${JSON.stringify(BELT)}, BELT_TOP = ${BELT_TOP};
const GAUGE = ${JSON.stringify(GAUGE)}, G_R = ${G_R}, G_TOP = ${G_TOP};
const CAB = ${JSON.stringify(CAB)}, DRAWERS = ${JSON.stringify(DRAWERS)};
const TICKET_X = ${JSON.stringify(TICKET_X)}, TICKET_END = ${TICKET_END}, RAIL_Y = ${RAIL_Y};
const at = (p) => ${kit}iso(p, P);
const S = (paths, style) => ${kit}solidSvg(paths, style);
const D = (pts, style) => ${kit}dotsSvg(pts, style);
const slab = (plan, z, h, steps = 3, bevel = 0) => ${kit}slabOf(plan, z, h, P, steps, bevel);
${kit ? "const translateAlong = k.translateAlong;" : ""}
const packOf = ${fn(packOf)};
const tapeRing = ${fn(tapeRing)};
const tapeOf = ${fn(tapeOf)};
const holesOf = ${fn(holesOf)};
const cleatsOf = ${fn(cleatsOf)};
const fillOf = ${fn(fillOf)};
const needleOf = ${fn(needleOf)};
`;
};

const LIVE_BODY = `
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const readout = root.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const SX = plan();
const cards = {};
svg.querySelectorAll("[data-card]").forEach((el) => {
  const i = el.dataset.card;
  (cards[i] ||= {})[el.dataset.in] = el;
});
const parts = { pack: q('[data-part="pack"]'), tape: q('[data-part="tape"]'), holes: q('[data-part="holes"]'), cleats: q('[data-part="cleats"]'), ram: q('[data-part="ram"]'), needle: q('[data-part="needle"]'), fill: q('[data-part="fill"]'), led: q('[data-part="led"]') };
const gates = [...svg.querySelectorAll("[data-gate]")];
const lamps = [...svg.querySelectorAll("[data-lamp]")];
const tickets = [...svg.querySelectorAll("[data-ticket]")];
let lastR = -1, lastChecked = -1, ledUntil = 0;

function draw(t) {
  const s = stateAt(t, SX);
  for (let i = 0; i < M.CARDS; i++) {
    const c = cardAt(i, t, SX);
    for (const [layer, el] of Object.entries(cards[i])) {
      const on = c.layer === layer;
      el.setAttribute("opacity", on ? "1" : "0");
      if (on) el.setAttribute("transform", translateAlong(P, [c.x, c.y, c.z]));
    }
  }
  const r = Math.sqrt(R_EMPTY * R_EMPTY + (R_FULL * R_FULL - R_EMPTY * R_EMPTY) * (1 - s.read / M.ROWS));
  if (Math.abs(r - lastR) > 0.05) {
    parts.pack.innerHTML = packOf(r);
    parts.tape.innerHTML = tapeOf(r);
    lastR = r;
  }
  parts.holes.innerHTML = D(holesOf(r, (s.read / M.PER_CARD) * 9), { size: 0.5, tone: "lo" });
  parts.cleats.setAttribute("d", cleatsOf(s.belt));
  parts.ram.setAttribute("transform", translateAlong(P, [0, 32 * s.ram, 0]));
  s.gates.forEach((g, i) => {
    if (gates[i]) gates[i].setAttribute("transform", translateAlong(P, [0, 0, i === 0 ? 0 : -(i === 1 ? 2 : 6) * g.press]));
    lamps[i].dataset.on = g.press > 0.05 ? (g.fail ? "fail" : "on") : "off";
  });
  parts.needle.setAttribute("d", needleOf(s.progress));
  parts.fill.setAttribute("d", fillOf(s.filed));
  if (s.checked !== lastChecked) { if (lastChecked >= 0 && s.checked > lastChecked) ledUntil = t + 0.12; lastChecked = s.checked; }
  parts.led.dataset.on = t < ledUntil ? "on" : "off";
  tickets.forEach((el, i) => {
    const head = TICKET_X.length - 1;
    const x = i === head ? TICKET_X[head] + (TICKET_END - TICKET_X[head]) * (1 - Math.pow(1 - s.ticket, 3)) : TICKET_X[i];
    el.setAttribute("transform", translateAlong(P, [x, RAIL_Y, 0]));
  });
  const text = readoutOf(s);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(s.progress * 100)));
  stage.setAttribute("aria-valuetext", text);
}

let t = 0, frame = 0, last = 0, touring = true, visible = false, idle = 0, target = 0, held = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) t = (t + dt) % SX.cycle;
  else t += (target - t) * (1 - Math.exp(-dt / 0.12));
  draw(t);
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => {
  touring = false;
  target = Math.min(SX.end + 0.6, Math.max(0, to));
  clearTimeout(idle);
  idle = setTimeout(() => { if (!held) { touring = true; run(); } }, 3600);
  if (still.matches) { t = target; draw(t); } else run();
};
/* The page can hold the run at a point (0 to 1), for example from scroll; null lets it tour again */
const onScrub = (e) => {
  const p = e.detail;
  if (p == null) { if (held) { held = false; touring = true; run(); } return; }
  held = true;
  touring = false;
  clearTimeout(idle);
  target = Math.min(1, Math.max(0, p)) * (SX.end + 0.6);
  if (still.matches) { t = target; draw(t); } else run();
};
root.addEventListener("parsr:scrub", onScrub);
const io = new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" });
io.observe(stage);
const onMove = (e) => {
  const box = svg.getBoundingClientRect();
  steer(((e.clientX - box.left) / box.width) * (SX.end + 0.6));
};
const onKey = (e) => {
  const step = e.shiftKey ? 2 : 0.5;
  let to = null;
  if (e.key === "ArrowRight") to = (touring ? t : target) + step;
  if (e.key === "ArrowLeft") to = (touring ? t : target) - step;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = SX.end + 0.6;
  if (to === null) return;
  e.preventDefault();
  steer(to);
};
stage.addEventListener("pointermove", onMove);
stage.addEventListener("keydown", onKey);
if (still.matches) { touring = false; t = SX.release(22) + 1.4; }
draw(t);
const stop = () => { io.disconnect(); cancelAnimationFrame(frame); frame = 0; visible = false; clearTimeout(idle); stage.removeEventListener("pointermove", onMove); stage.removeEventListener("keydown", onKey); root.removeEventListener("parsr:scrub", onScrub); };
`;

const CSS = `
.parsr-lamp{fill:var(--anatomy-faint);transition:fill .3s var(--anatomy-ease)}
.parsr-lamp[data-on="on"]{fill:var(--anatomy-hi)}
.parsr-lamp[data-on="fail"]{fill:var(--anatomy-lit)}
`;

const STAGE = `<div class="iso-stage" tabindex="0" role="slider" aria-label="Parsr pipeline: arrow keys scrub through the run" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Parsr",
  hint: "Hover to scrub the run",
  readout: readoutOf(s0),
  keys: [
    { mark: "lit", label: "Gauge needle: progress pushed over SSE" },
    { mark: "raised", label: "Cards: 250 rows each, 4 make one bulkWrite" },
    { mark: "dim", label: "Reject tray: rows kept with their reason" },
  ],
  caption:
    "Parsr as a card sorter. A job ticket (BullMQ on Redis) slides to the reader, which streams the CSV tape a row at a time. Cards pass three gates for structure, data rules and business rules; failures are pushed into the reject tray. Every 1,000 rows the hatch sinks and the batch is filed in MongoDB. Shown about 10 times slower than the real 1.2 s for 10,000 rows.",
  body: `<style>${CSS}</style>${STAGE}`,
});

if (process.argv.includes("--emit")) {
  /* The site build: static art as a string for a server component, and the live code as a module */
  const SITE = join(HERE, "..", "..", "src", "components", "parsr");
  const head = "// Generated by figures/parsr/build.mjs --emit. Do not edit; change the build and run it again.\n";
  const plate = k.plateHtml({ fig: "Fig 1", title: "Parsr", hint: "Hover to scrub the run", readout: readoutOf(s0), body: STAGE });
  writeFileSync(join(SITE, "art.generated.ts"), `${head}export const PARSR_PLATE = ${JSON.stringify(plate)};
`);
  const model = readFileSync(join(HERE, "model.mjs"), "utf8");
  writeFileSync(
    join(SITE, "live.generated.js"),
    `${head}import * as k from "@/components/iso/iso-kit";
${model}
${liveHead("k.")}
/** Starts the figure inside root; returns a function that stops it */
export function mountParsr(root) {${LIVE_BODY}
return stop;
}
`,
  );
  console.log("emitted", SITE, (plate.length / 1024).toFixed(0), "KB of art");
}

const name = theme === "light" ? "parsr-light.html" : "parsr.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Parsr", theme, body, script: `${kitScript()}${MODEL_SRC}${liveHead("")}{const root = document;${LIVE_BODY}}`, width: 820 }));
console.log("wrote", name, "cycle", Sx.cycle.toFixed(2), "s");
