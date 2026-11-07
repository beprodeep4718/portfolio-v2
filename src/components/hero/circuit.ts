/**
 * A generated two layer circuit board for the hero reveal.
 *
 * Everything is placed procedurally from a seed so the board is identical on
 * every load: chips with fan out traces, buses with matched 45 degree bends,
 * passives, crystals, headers, vias, copper pours, a bottom layer, silkscreen,
 * and the signals and data packets that run along the top copper.
 */

export type Pt = [number, number];
type Box = [number, number, number, number];

export type Trace = { pts: Pt[]; w: number };
export type Pad = { x: number; y: number; w: number; h: number; r: number };
export type Ring = { x: number; y: number; r: number; hole: number };
export type Chip = { x: number; y: number; w: number; h: number; label: string; part: string };
export type Label = { x: number; y: number; text: string; size: number; align: CanvasTextAlign };
export type Pour = { x: number; y: number; w: number; h: number };
export type Signal = { pts: Pt[]; len: number; speed: number; phase: number; box: Box };
export type Packet = Signal & { text: string; width?: number };

export type Board = {
  width: number;
  height: number;
  top: Trace[];
  bottom: Trace[];
  pads: Pad[];
  squares: Pad[];
  rings: Ring[];
  balls: Ring[];
  chips: Chip[];
  silk: Pt[][];
  silkBoxes: Pad[];
  labels: Label[];
  pours: Pour[];
  signals: Signal[];
  packets: Packet[];
};

export type Palette = {
  grid: string;
  pour: string;
  bottom: string;
  top: string;
  pad: string;
  via: string;
  chip: string;
  chipLine: string;
  silk: string;
  pulse: string;
  pulseGlow: string;
  packetBg: string;
  packetInk: string;
};

export const darkPalette: Palette = {
  grid: "rgba(237,235,231,0.07)",
  pour: "rgba(200,117,51,0.16)",
  bottom: "rgba(98,132,196,0.42)",
  top: "rgba(206,124,58,0.86)",
  pad: "#d98b4a",
  via: "rgba(222,146,84,0.95)",
  chip: "#0e1219",
  chipLine: "rgba(237,235,231,0.3)",
  silk: "rgba(237,235,231,0.6)",
  pulse: "#ffb066",
  pulseGlow: "rgba(255,140,50,0.28)",
  packetBg: "#07090e",
  packetInk: "#ffb066",
};

export const lightPalette: Palette = {
  grid: "rgba(11,11,12,0.08)",
  pour: "rgba(154,85,35,0.14)",
  bottom: "rgba(52,86,150,0.38)",
  top: "rgba(150,82,32,0.8)",
  pad: "#b8662a",
  via: "rgba(170,92,36,0.95)",
  chip: "#f3f4f5",
  chipLine: "rgba(11,11,12,0.38)",
  silk: "rgba(11,11,12,0.62)",
  pulse: "#e8620a",
  pulseGlow: "rgba(255,122,26,0.22)",
  packetBg: "#ffffff",
  packetInk: "#b8460b",
};

const DIRS: Pt[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const PACKETS = [
  "GET /api",
  "I2C 0x3C",
  "job #41",
  "UART 115200",
  "ACK",
  "SPI CLK",
  "200 OK",
  "SET lock",
  "INT0",
  "emit msg",
  "PWM 50%",
  "POST /events",
  "cache hit",
  "ADC 3.3V",
  "SYN",
  "commit",
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lengthOf(pts: Pt[]) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

function boxOf(pts: Pt[]): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

function normal(a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}

/** Parallel copy of a polyline with mitred corners, for buses */
function offsetPolyline(pts: Pt[], off: number): Pt[] {
  return pts.map((p, i) => {
    const n1 = i > 0 ? normal(pts[i - 1], p) : null;
    const n2 = i < pts.length - 1 ? normal(p, pts[i + 1]) : null;
    if (n1 && n2) {
      const mx = n1[0] + n2[0];
      const my = n1[1] + n2[1];
      const ml = Math.hypot(mx, my) || 1;
      const ux = mx / ml;
      const uy = my / ml;
      const k = off / (ux * n1[0] + uy * n1[1] || 1);
      return [p[0] + ux * k, p[1] + uy * k];
    }
    const n = (n1 ?? n2)!;
    return [p[0] + n[0] * off, p[1] + n[1] * off];
  });
}

export function pointAt(pts: Pt[], dist: number): Pt {
  let rem = dist;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (rem <= seg) {
      const f = seg ? rem / seg : 0;
      return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
    }
    rem -= seg;
  }
  return pts[pts.length - 1];
}

function subPath(pts: Pt[], from: number, to: number): Pt[] {
  const out: Pt[] = [pointAt(pts, from)];
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    walked += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (walked > from && walked < to) out.push(pts[i]);
  }
  out.push(pointAt(pts, to));
  return out;
}

export function generateBoard(W: number, H: number, seed = 20261107): Board {
  const rand = mulberry32(seed);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const area = Math.max(0.35, (W * H) / (1440 * 860));
  const count = (base: number) => Math.max(1, Math.round(base * area));
  const snap = (v: number) => Math.round(v / 4) * 4;

  const board: Board = {
    width: W,
    height: H,
    top: [],
    bottom: [],
    pads: [],
    squares: [],
    rings: [],
    balls: [],
    chips: [],
    silk: [],
    silkBoxes: [],
    labels: [],
    pours: [],
    signals: [],
    packets: [],
  };
  const routes: Pt[][] = [];

  /* Occupancy grid so parts do not land on each other */
  const CELL = 12;
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;
  const occ = new Uint8Array(cols * rows);
  const cells = (x: number, y: number, w: number, h: number, fn: (i: number) => boolean | void) => {
    for (let cy = Math.max(0, Math.floor(y / CELL)); cy <= Math.min(rows - 1, Math.floor((y + h) / CELL)); cy++) {
      for (let cx = Math.max(0, Math.floor(x / CELL)); cx <= Math.min(cols - 1, Math.floor((x + w) / CELL)); cx++) {
        if (fn(cy * cols + cx) === false) return false;
      }
    }
    return true;
  };
  const isFree = (x: number, y: number, w: number, h: number) =>
    x > 8 && y > 8 && x + w < W - 8 && y + h < H - 8 && cells(x, y, w, h, (i) => (occ[i] ? false : undefined));
  const reserve = (x: number, y: number, w: number, h: number) => cells(x, y, w, h, (i) => void (occ[i] = 1));
  const place = (w: number, h: number, margin: number, tries = 40, near?: [number, number, number]): Pt | null => {
    for (let i = 0; i < tries; i++) {
      const x = snap(near ? near[0] + between(-near[2], near[2]) : between(16, W - w - 16));
      const y = snap(near ? near[1] + between(-near[2], near[2]) : between(16, H - h - 16));
      if (isFree(x - margin, y - margin, w + margin * 2, h + margin * 2)) {
        reserve(x - margin, y - margin, w + margin * 2, h + margin * 2);
        return [x, y];
      }
    }
    return null;
  };

  /* Random route with PCB style 45 degree jogs */
  const walk = (x: number, y: number, d: number, segs: number, minStep: number, maxStep: number, grid = 8): Pt[] => {
    const pts: Pt[] = [[x, y]];
    for (let k = 0; k < segs; k++) {
      const diag = d % 2 === 1;
      const steps = diag ? int(1, 3) : int(minStep, maxStep);
      x += DIRS[d][0] * steps * grid;
      y += DIRS[d][1] * steps * grid;
      pts.push([x, y]);
      if (diag) d = (d + (rand() < 0.5 ? 1 : 7)) % 8;
      else {
        const r = rand();
        if (r < 0.35) d = (d + 1) % 8;
        else if (r < 0.7) d = (d + 7) % 8;
      }
    }
    return pts;
  };
  const via = (x: number, y: number) => board.rings.push({ x, y, r: 3, hole: 1.4 });
  const fanOut = (x: number, y: number, d: number, maxSegs = 3, maxStep = 4) => {
    const pts = walk(x, y, d, int(1, maxSegs), 1, maxStep);
    board.top.push({ pts, w: 1.2 });
    const end = pts[pts.length - 1];
    if (rand() < 0.75) via(end[0], end[1]);
    if (pts.length > 2) routes.push(pts);
  };
  const corners = (x: number, y: number, w: number, h: number, arm = 10) => {
    board.silk.push(
      [[x, y + arm], [x, y], [x + arm, y]],
      [[x + w - arm, y], [x + w, y], [x + w, y + arm]],
      [[x + w, y + h - arm], [x + w, y + h], [x + w - arm, y + h]],
      [[x + arm, y + h], [x, y + h], [x, y + h - arm]],
    );
  };

  /* Mounting holes */
  const inset = 34;
  for (const [x, y] of [
    [inset, inset],
    [W - inset, inset],
    [inset, H - inset],
    [W - inset, H - inset],
  ] as Pt[]) {
    board.rings.push({ x, y, r: 13, hole: 6 });
    board.silk.push(
      Array.from({ length: 25 }, (_, i): Pt => [x + Math.cos((i / 24) * Math.PI * 2) * 18, y + Math.sin((i / 24) * Math.PI * 2) * 18]),
    );
    reserve(x - 22, y - 22, 44, 44);
  }

  /* Quad flat chips with pins on all four sides */
  const qfp = (label: string, part: string, size: number, near?: [number, number, number]) => {
    const pin = 10;
    const p = place(size, size, pin + 16, 80, near);
    if (!p) return;
    const [x, y] = p;
    board.chips.push({ x, y, w: size, h: size, label, part });
    const pitch = 8;
    const n = Math.floor((size - 16) / pitch);
    const start = (size - (n - 1) * pitch) / 2;
    for (let i = 0; i < n; i++) {
      const o = start + i * pitch;
      const sides: [Pad, Pt, number][] = [
        [{ x: x + o - 2, y: y - pin, w: 4, h: pin, r: 1 }, [x + o, y - pin], 6],
        [{ x: x + o - 2, y: y + size, w: 4, h: pin, r: 1 }, [x + o, y + size + pin], 2],
        [{ x: x - pin, y: y + o - 2, w: pin, h: 4, r: 1 }, [x - pin, y + o], 4],
        [{ x: x + size, y: y + o - 2, w: pin, h: 4, r: 1 }, [x + size + pin, y + o], 0],
      ];
      for (const [pad, end, d] of sides) {
        board.pads.push(pad);
        if (rand() < 0.62) fanOut(end[0], end[1], d);
      }
    }
    corners(x - pin - 5, y - pin - 5, size + (pin + 5) * 2, size + (pin + 5) * 2, 12);
    board.labels.push({ x: x - pin - 5, y: y - pin - 10, text: label, size: 10, align: "left" });
    board.labels.push({ x: x + size / 2, y: y + size / 2 + 3, text: part, size: 9, align: "center" });
  };

  /* Small outline chips with pins on two sides */
  const soic = (label: string, part: string) => {
    const w = 56;
    const h = 32;
    const p = place(w, h, 22, 60);
    if (!p) return;
    const [x, y] = p;
    board.chips.push({ x, y, w, h, label, part });
    for (let i = 0; i < 5; i++) {
      const px = x + 8 + i * 10;
      board.pads.push({ x: px - 2.5, y: y - 9, w: 5, h: 9, r: 1 }, { x: px - 2.5, y: y + h, w: 5, h: 9, r: 1 });
      if (rand() < 0.7) fanOut(px, y - 9, 6);
      if (rand() < 0.7) fanOut(px, y + h + 9, 2);
    }
    board.labels.push({ x, y: y - 14, text: label, size: 9, align: "left" });
    board.labels.push({ x: x + w / 2, y: y + h / 2 + 3, text: part, size: 8, align: "center" });
  };

  /* Ball grid array with dog bone escapes */
  const bga = (label: string, part: string) => {
    const size = 78;
    const p = place(size, size, 20, 60);
    if (!p) return;
    const [x, y] = p;
    board.chips.push({ x, y, w: size, h: size, label, part });
    const n = 7;
    const pitch = 10;
    const start = (size - (n - 1) * pitch) / 2;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const bx = x + start + i * pitch;
        const by = y + start + j * pitch;
        board.balls.push({ x: bx, y: by, r: 2.4, hole: 0 });
        const edge = i === 0 || j === 0 || i === n - 1 || j === n - 1;
        if (edge && rand() < 0.8) {
          const d = i === 0 ? 5 : i === n - 1 ? 1 : j === 0 ? 7 : 3;
          const end: Pt = [bx + DIRS[d][0] * 9, by + DIRS[d][1] * 9];
          board.top.push({ pts: [[bx, by], end], w: 1 });
          via(end[0], end[1]);
        }
      }
    }
    corners(x - 6, y - 6, size + 12, size + 12, 12);
    board.labels.push({ x: x - 6, y: y - 12, text: `${label}  ${part}`, size: 9, align: "left" });
  };

  /* Pin header that sends a bus into the board */
  const header = (label: string, name: string) => {
    const pins = 8;
    const pitch = 16;
    const vertical = rand() < 0.5;
    const w = vertical ? 16 : pins * pitch;
    const h = vertical ? pins * pitch : 16;
    const p = place(w, h, 18, 80);
    if (!p) return;
    const [x, y] = p;
    board.silkBoxes.push({ x: x - 4, y: y - 4, w: w + 8, h: h + 8, r: 2 });
    for (let i = 0; i < pins; i++) {
      const cx = vertical ? x + 8 : x + 8 + i * pitch;
      const cy = vertical ? y + 8 + i * pitch : y + 8;
      if (i === 0) board.squares.push({ x: cx - 5, y: cy - 5, w: 10, h: 10, r: 1 });
      board.rings.push({ x: cx, y: cy, r: 5, hole: 2.2 });
    }
    board.labels.push({ x: x - 4, y: y - 10, text: `${label}  ${name}`, size: 9, align: "left" });
    const d = vertical ? (x < W / 2 ? 0 : 4) : y < H / 2 ? 2 : 6;
    const startPt: Pt = vertical ? [x + 8 + DIRS[d][0] * 12, y + h / 2] : [x + w / 2, y + 8 + DIRS[d][1] * 12];
    bus(startPt[0], startPt[1], d, pins, pitch);
  };

  /* A bus: parallel traces that bend together */
  const bus = (x: number, y: number, d: number, lines: number, pitch: number, layer: "top" | "bottom" = "top") => {
    const centre = walk(x, y, d, int(3, 6), 4, 16);
    for (let i = 0; i < lines; i++) {
      const pts = offsetPolyline(centre, (i - (lines - 1) / 2) * pitch);
      board[layer].push({ pts, w: layer === "top" ? 1.4 : 1.1 });
      const end = pts[pts.length - 1];
      via(end[0], end[1]);
      if (layer === "top") routes.push(pts);
    }
  };

  /* Parts list (decorative): an ECE bench in silkscreen */
  qfp("U1", "ESP32-S3", 120, [W * 0.68, H * 0.42, 120]);
  qfp("U2", "STM32F411", 76);
  qfp("U3", "RP2040", 68);
  bga("U8", "LPDDR4");
  soic("U4", "W25Q64");
  soic("U5", "CH340C");
  soic("U6", "TPS5430");
  if (area > 0.7) soic("U7", "LM358");

  header("J1", "UART");
  header("J2", "GPIO");

  for (let i = 0; i < count(7); i++) {
    const p = place(10, 10, 4, 20);
    if (!p) continue;
    bus(p[0], p[1], pick([0, 2, 4, 6]), int(4, 8), 8, rand() < 0.3 ? "bottom" : "top");
  }

  /* Crystals near the chips */
  const crystal = (label: string, freq: string) => {
    const chip = board.chips[0];
    const p = place(30, 12, 10, 60, chip ? [chip.x + chip.w / 2, chip.y + chip.h / 2, chip.w + 90] : undefined);
    if (!p) return;
    const [x, y] = p;
    board.silkBoxes.push({ x, y, w: 30, h: 12, r: 6 });
    board.pads.push({ x: x - 4, y: y + 2, w: 8, h: 8, r: 1.5 }, { x: x + 26, y: y + 2, w: 8, h: 8, r: 1.5 });
    board.labels.push({ x, y: y - 5, text: `${label} ${freq}`, size: 8, align: "left" });
    fanOut(x - 4, y + 6, 4, 2, 3);
    fanOut(x + 34, y + 6, 0, 2, 3);
  };
  crystal("Y1", "16MHz");
  crystal("Y2", "32.768k");

  /* Passives: resistors, capacitors, inductors, diodes, fuses */
  const prefixes = ["R", "R", "R", "C", "C", "C", "L", "D", "F"];
  const tally: Record<string, number> = {};
  for (let i = 0; i < count(90); i++) {
    const horizontal = rand() < 0.6;
    const w = horizontal ? 22 : 8;
    const h = horizontal ? 8 : 22;
    const chip = board.chips.length && rand() < 0.6 ? pick(board.chips) : null;
    const near: [number, number, number] | undefined = chip
      ? [chip.x + chip.w / 2 - w / 2, chip.y + chip.h / 2 - h / 2, Math.max(chip.w, chip.h) + 90]
      : undefined;
    const p = place(w, h, 6, 24, near);
    if (!p) continue;
    const [x, y] = p;
    const a: Pad = { x, y, w: 8, h: 8, r: 1.5 };
    const b: Pad = horizontal ? { x: x + 14, y, w: 8, h: 8, r: 1.5 } : { x, y: y + 14, w: 8, h: 8, r: 1.5 };
    board.pads.push(a, b);
    const kind = pick(prefixes);
    tally[kind] = (tally[kind] ?? 0) + 1;
    board.labels.push({
      x: horizontal ? x : x + 11,
      y: horizontal ? y - 4 : y + 10,
      text: `${kind}${tally[kind]}`,
      size: 8,
      align: "left",
    });
    const ends: [Pad, number][] = [
      [a, horizontal ? 4 : 6],
      [b, horizontal ? 0 : 2],
    ];
    for (const [pad, d] of ends) {
      if (rand() < 0.8) fanOut(pad.x + 4 + DIRS[d][0] * 4, pad.y + 4 + DIRS[d][1] * 4, d, 3, 6);
    }
  }

  /* Three pin transistors */
  for (let i = 0; i < count(14); i++) {
    const p = place(14, 14, 6, 24);
    if (!p) continue;
    const [x, y] = p;
    board.silkBoxes.push({ x, y: y + 3, w: 14, h: 8, r: 1 });
    board.pads.push({ x: x - 1, y: y - 4, w: 5, h: 6, r: 1 }, { x: x + 10, y: y - 4, w: 5, h: 6, r: 1 }, { x: x + 4.5, y: y + 12, w: 5, h: 6, r: 1 });
    board.labels.push({ x: x + 18, y: y + 10, text: `Q${i + 1}`, size: 8, align: "left" });
    if (rand() < 0.8) fanOut(x + 7, y + 18, 2, 2, 4);
  }

  /* Test points */
  for (let i = 0; i < count(10); i++) {
    const p = place(10, 10, 6, 20);
    if (!p) continue;
    board.rings.push({ x: p[0] + 5, y: p[1] + 5, r: 4.5, hole: 0 });
    board.labels.push({ x: p[0] + 13, y: p[1] + 8, text: `TP${i + 1}`, size: 8, align: "left" });
  }

  /* Copper pours, hatched */
  for (let i = 0; i < count(4); i++) {
    const w = snap(between(120, 280));
    const h = snap(between(70, 170));
    const p = place(w, h, 8, 30);
    if (p) board.pours.push({ x: p[0], y: p[1], w, h });
  }

  /* Long top traces */
  for (let i = 0; i < count(38); i++) {
    const pts = walk(snap(between(0, W)), snap(between(0, H)), pick([0, 2, 4, 6]), int(2, 5), 3, 16);
    board.top.push({ pts, w: 1.6 });
    const end = pts[pts.length - 1];
    board.rings.push({ x: end[0], y: end[1], r: rand() < 0.5 ? 4.5 : 3, hole: rand() < 0.5 ? 1.8 : 1.4 });
    routes.push(pts);
  }

  /* Bottom layer: thinner, blue, joined to the top by vias */
  for (let i = 0; i < count(70); i++) {
    const pts = walk(snap(between(0, W)), snap(between(0, H)), pick([0, 2, 4, 6]), int(2, 5), 2, 12);
    board.bottom.push({ pts, w: 1.1 });
    const end = pts[pts.length - 1];
    via(end[0], end[1]);
    if (rand() < 0.5) via(pts[0][0], pts[0][1]);
  }

  /* Stitching vias */
  for (let i = 0; i < count(90); i++) via(snap(between(12, W - 12)), snap(between(12, H - 12)));

  /* Board silkscreen */
  board.labels.push(
    { x: W - 60, y: H - 62, text: "BEPRODEEP DAS · PORTFOLIO REV 2.0", size: 10, align: "right" },
    { x: W - 60, y: H - 48, text: "JGEC ECE · JALPAIGURI 26.52N 88.72E", size: 9, align: "right" },
    { x: 60, y: 40, text: "BD-PF-02", size: 9, align: "left" },
  );

  /* Signals and packets ride the longer top copper */
  const long = routes.filter((r) => lengthOf(r) > 70).sort((a, b) => lengthOf(b) - lengthOf(a));
  board.signals = long.slice(0, count(46)).map((pts) => ({
    pts,
    len: lengthOf(pts),
    speed: between(90, 230),
    phase: between(0, 1200),
    box: boxOf(pts),
  }));
  board.packets = long.slice(0, Math.min(PACKETS.length, count(16))).map((pts, i) => ({
    pts,
    len: lengthOf(pts),
    speed: between(40, 80),
    phase: between(0, 900),
    box: boxOf(pts),
    text: PACKETS[i],
  }));

  return board;
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Draws the static board once; the reveal copies from it every frame */
export function drawBoard(ctx: CanvasRenderingContext2D, b: Board, pal: Palette, mono: string) {
  ctx.clearRect(0, 0, b.width, b.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  /* Design grid */
  ctx.fillStyle = pal.grid;
  for (let y = 12; y < b.height; y += 24) for (let x = 12; x < b.width; x += 24) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);

  /* Hatched pours */
  ctx.strokeStyle = pal.pour;
  ctx.lineWidth = 1;
  for (const p of b.pours) {
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.clip();
    ctx.beginPath();
    for (let k = -p.h; k < p.w; k += 7) {
      ctx.moveTo(p.x + k, p.y);
      ctx.lineTo(p.x + k + p.h, p.y + p.h);
    }
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    roundRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.stroke();
  }

  /* Copper: bottom layer first, then top */
  const traces = (list: Trace[], color: string) => {
    ctx.strokeStyle = color;
    for (const t of list) {
      ctx.lineWidth = t.w;
      ctx.beginPath();
      strokePath(ctx, t.pts);
      ctx.stroke();
    }
  };
  traces(b.bottom, pal.bottom);
  traces(b.top, pal.top);

  /* Chip bodies */
  for (const c of b.chips) {
    ctx.beginPath();
    roundRect(ctx, c.x, c.y, c.w, c.h, 3);
    ctx.fillStyle = pal.chip;
    ctx.fill();
    ctx.strokeStyle = pal.chipLine;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x + 8, c.y + 8, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = pal.silk;
    ctx.fill();
  }

  /* Pads and balls */
  ctx.fillStyle = pal.pad;
  ctx.beginPath();
  for (const p of [...b.pads, ...b.squares]) roundRect(ctx, p.x, p.y, p.w, p.h, p.r);
  ctx.fill();
  ctx.beginPath();
  for (const r of b.balls) {
    ctx.moveTo(r.x + r.r, r.y);
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
  }
  ctx.fill();

  /* Vias and through holes, drawn as rings so the page shows through */
  ctx.fillStyle = pal.via;
  ctx.beginPath();
  for (const r of b.rings) {
    ctx.moveTo(r.x + r.r, r.y);
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    if (r.hole > 0) {
      ctx.moveTo(r.x + r.hole, r.y);
      ctx.arc(r.x, r.y, r.hole, 0, Math.PI * 2, true);
    }
  }
  ctx.fill("evenodd");

  /* Silkscreen */
  ctx.strokeStyle = pal.silk;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const line of b.silk) strokePath(ctx, line);
  for (const box of b.silkBoxes) roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
  ctx.stroke();

  ctx.fillStyle = pal.silk;
  ctx.textBaseline = "alphabetic";
  for (const l of b.labels) {
    ctx.font = `500 ${l.size}px ${mono}`;
    ctx.textAlign = l.align;
    ctx.fillText(l.text, l.x, l.y);
  }
}

const hits = (box: Box, x: number, y: number, w: number, h: number, pad = 40) =>
  box[2] + pad > x && box[0] - pad < x + w && box[3] + pad > y && box[1] - pad < y + h;

/** Draws moving signals and packets inside a rectangle */
export function drawSignals(
  ctx: CanvasRenderingContext2D,
  b: Board,
  t: number,
  pal: Palette,
  mono: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of b.signals) {
    if (!hits(s.box, x, y, w, h)) continue;
    const head = ((t * s.speed + s.phase) % (s.len + 160)) - 40;
    const tail = head - 30;
    if (head <= 0 || tail >= s.len) continue;
    const seg = subPath(s.pts, Math.max(0, tail), Math.min(s.len, head));
    ctx.beginPath();
    strokePath(ctx, seg);
    ctx.strokeStyle = pal.pulseGlow;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = pal.pulse;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.font = `600 10px ${mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of b.packets) {
    const [px, py] = pointAt(p.pts, (t * p.speed + p.phase) % p.len);
    if (px < x - 60 || px > x + w + 60 || py < y - 20 || py > y + h + 20) continue;
    if (p.width === undefined) p.width = ctx.measureText(p.text).width + 12;
    ctx.beginPath();
    roundRect(ctx, px - p.width / 2, py - 8, p.width, 16, 3);
    ctx.fillStyle = pal.packetBg;
    ctx.fill();
    ctx.strokeStyle = pal.pulse;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = pal.packetInk;
    ctx.fillText(p.text, px, py + 0.5);
  }
  ctx.textBaseline = "alphabetic";
}
