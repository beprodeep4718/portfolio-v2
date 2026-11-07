"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Pt = [number, number];
type Node = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  layer?: string;
};

/* ------------------------------------------------------------------
   Layout, in viewBox units (1200 x 300), two rows.
   Top: client → API → BullMQ on Redis → worker (stream, validate,
   batch) → MongoDB. Bottom: the dashboard fed by SSE and Redis,
   and the invalid rows store under Validate.
------------------------------------------------------------------- */
const ROW1 = 40;
const ROW2 = 232;
const NODES: Node[] = [
  { id: "client", x: 0, y: ROW1, w: 130, h: 70, title: "Next.js client", sub: "users.csv", layer: "Interface" },
  { id: "api", x: 170, y: ROW1, w: 130, h: 70, title: "Express API", sub: "202 Accepted", layer: "Application" },
  { id: "queue", x: 340, y: ROW1, w: 140, h: 70, title: "BullMQ queue", sub: "on Redis", layer: "Infrastructure" },
  { id: "stream", x: 540, y: ROW1, w: 120, h: 70, title: "Stream", sub: "csv-parser" },
  { id: "validate", x: 700, y: ROW1, w: 120, h: 70, title: "Validate", sub: "3 layers" },
  { id: "batch", x: 860, y: ROW1, w: 120, h: 70, title: "Batch", sub: "bulkWrite" },
  { id: "mongo", x: 1040, y: ROW1, w: 160, h: 70, title: "MongoDB", sub: "users", layer: "Data" },
  { id: "dash", x: 0, y: ROW2, w: 260, h: 60, title: "Live dashboard", sub: "0%", layer: "Interface" },
  { id: "sse", x: 320, y: ROW2, w: 140, h: 60, title: "SSE", sub: "event stream", layer: "Application" },
  { id: "redis", x: 520, y: ROW2, w: 140, h: 60, title: "Redis", sub: "progress state", layer: "Infrastructure" },
  { id: "invalid", x: 700, y: ROW2, w: 120, h: 60, title: "Invalid rows", sub: "line + reason", layer: "Data" },
];

const MID1 = ROW1 + 35;
const MID2 = ROW2 + 30;
const LINKS: { pts: Pt[]; dashed?: boolean }[] = [
  { pts: [[130, MID1], [170, MID1]] },
  { pts: [[300, MID1], [340, MID1]] },
  { pts: [[480, MID1], [540, MID1]] },
  { pts: [[660, MID1], [700, MID1]] },
  { pts: [[820, MID1], [860, MID1]] },
  { pts: [[980, MID1], [1040, MID1]] },
  { pts: [[760, ROW1 + 70], [760, ROW2]] },
  { pts: [[590, 130], [590, ROW2]] },
  { pts: [[520, MID2], [460, MID2]] },
  { pts: [[320, MID2], [260, MID2]] },
  { pts: [[65, ROW2], [65, ROW1 + 70]], dashed: true },
];

const ROUTES = {
  upload: [[65, MID1], [235, MID1], [410, MID1]] as Pt[],
  pick: [[410, MID1], [600, MID1]] as Pt[],
  valid: [[600, MID1], [760, MID1], [920, MID1]] as Pt[],
  invalid: [[600, MID1], [760, MID1], [760, MID2]] as Pt[],
  batch: [[920, MID1], [1120, MID1]] as Pt[],
  progress: [[590, 130], [590, MID2], [390, MID2], [130, MID2]] as Pt[],
};

/* Timeline of one sample job, in seconds */
const CYCLE = 16;
const UPLOAD = 1.4;
const QUEUED = 2.2;
const PICKED = 2.8;
const DONE = 11.8; // 9 s of streaming: the README benchmark for 100,000 rows
const RESET = 14.8;
const TOTAL = 100_000;
const INVALID_RATE = 0.021;

const DOTS = 14;
const DOT_EVERY = 0.07;
const DOT_SPEED = 520;
const BLOCKS = 3;
const BLOCK_EVERY = 0.5;
const BLOCK_SPEED = 360;
const PULSES = 4;
const PULSE_EVERY = 0.35;
const PULSE_SPEED = 620;

function length(pts: Pt[]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

function pointAt(pts: Pt[], d: number): Pt {
  let rem = d;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rem <= seg) {
      const f = seg ? rem / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    }
    rem -= seg;
  }
  return pts[pts.length - 1];
}

const LEN = {
  upload: length(ROUTES.upload),
  pick: length(ROUTES.pick),
  valid: length(ROUTES.valid),
  invalid: length(ROUTES.invalid),
  batch: length(ROUTES.batch),
  progress: length(ROUTES.progress),
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const fmt = new Intl.NumberFormat("en-US");
const isInvalid = (k: number) => ((k * 2654435761) >>> 0) % 48 === 0;

const path = (pts: Pt[]) => "M" + pts.map((p) => p.join(" ")).join("L");

export function IngestDiagram() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(sel: string) => el.querySelector<T>(sel);
    const qa = <T extends Element>(sel: string) => Array.from(el.querySelectorAll<T>(sel));

    const token = q<SVGGElement>("[data-token]");
    const dots = qa<SVGCircleElement>("[data-dot]");
    const blocks = qa<SVGRectElement>("[data-block]");
    const pulses = qa<SVGCircleElement>("[data-pulse]");
    const batchFill = q<SVGRectElement>("[data-batch-fill]");
    const dashFill = q<SVGRectElement>("[data-dash-fill]");
    const jobCard = q<SVGRectElement>("[data-job]");
    const nodes = Object.fromEntries(qa<SVGGElement>("[data-node]").map((n) => [n.dataset.node!, n]));
    const subs = Object.fromEntries(qa<SVGTextElement>("[data-sub]").map((n) => [n.dataset.sub!, n]));
    const status = q<HTMLParagraphElement>("[data-status]");
    const clock = q<HTMLSpanElement>("[data-clock]");

    const show = (n: Element | null, on: boolean) => n?.setAttribute("opacity", on ? "1" : "0");
    const move = (n: Element | null, p: Pt) => n?.setAttribute("transform", `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
    const setText = (n: Element | null | undefined, text: string) => {
      if (n && n.textContent !== text) n.textContent = text;
    };
    const activate = (ids: string[]) => {
      for (const [id, n] of Object.entries(nodes)) n.dataset.active = String(ids.includes(id));
    };

    let lastStatus = "";
    const render = (t: number) => {
      /* Upload token: client → API → queue → worker */
      if (t < UPLOAD) {
        show(token, true);
        move(token, pointAt(ROUTES.upload, easeInOut(t / UPLOAD) * LEN.upload));
      } else if (t < QUEUED) {
        show(token, false);
      } else if (t < PICKED) {
        show(token, true);
        move(token, pointAt(ROUTES.pick, easeInOut((t - QUEUED) / (PICKED - QUEUED)) * LEN.pick));
      } else show(token, false);
      show(jobCard, t >= UPLOAD && t < PICKED);

      /* Rows streaming through validation */
      const p = Math.min(1, Math.max(0, (t - PICKED) / (DONE - PICKED)));
      const rows = t < PICKED ? 0 : t >= RESET ? TOTAL : Math.round(TOTAL * p);
      const invalid = Math.floor(rows * INVALID_RATE);
      const valid = rows - invalid;
      const written = t >= DONE ? valid : Math.floor(valid / 1000) * 1000;
      const streaming = t >= PICKED && t < DONE;

      const newest = Math.floor((t - PICKED) / DOT_EVERY);
      dots.forEach((dot, j) => {
        const k = newest - j;
        const born = PICKED + k * DOT_EVERY;
        const age = t - born;
        const bad = isInvalid(k);
        const route = bad ? ROUTES.invalid : ROUTES.valid;
        const len = bad ? LEN.invalid : LEN.valid;
        const d = age * DOT_SPEED;
        const visible = k >= 0 && born < DONE && d <= len;
        show(dot, visible);
        if (visible) {
          move(dot, pointAt(route, d));
          dot.dataset.bad = String(bad);
        }
      });

      const newestBlock = Math.floor((t - PICKED - 0.5) / BLOCK_EVERY);
      blocks.forEach((b, j) => {
        const k = newestBlock - j;
        const born = PICKED + 0.5 + k * BLOCK_EVERY;
        const d = (t - born) * BLOCK_SPEED;
        const visible = k >= 0 && born < DONE + 0.2 && d <= LEN.batch;
        show(b, visible);
        if (visible) move(b, pointAt(ROUTES.batch, d));
      });

      const newestPulse = Math.floor((t - PICKED) / PULSE_EVERY);
      pulses.forEach((pl, j) => {
        const k = newestPulse - j;
        const born = PICKED + k * PULSE_EVERY;
        const d = (t - born) * PULSE_SPEED;
        const visible = k >= 0 && born < DONE + 0.1 && d <= LEN.progress;
        show(pl, visible);
        if (visible) move(pl, pointAt(ROUTES.progress, d));
      });

      const fill = streaming ? ((t - PICKED) % BLOCK_EVERY) / BLOCK_EVERY : 0;
      if (batchFill) batchFill.style.transform = `scaleX(${fill.toFixed(3)})`;
      const shown = t >= RESET ? 0 : p;
      if (dashFill) dashFill.style.transform = `scaleX(${shown.toFixed(3)})`;

      /* Readouts on the nodes */
      setText(subs.queue, t >= UPLOAD && t < PICKED ? "1 job waiting" : streaming ? "1 job active" : "on Redis");
      setText(subs.stream, streaming || (t >= DONE && t < RESET) ? `${fmt.format(rows)} rows` : "csv-parser");
      setText(subs.invalid, rows > 0 && t < RESET ? `${fmt.format(invalid)} kept` : "line + reason");
      setText(subs.mongo, written > 0 && t < RESET ? `${fmt.format(written)} written` : "users");
      setText(subs.dash, `${Math.round(shown * 100)}%`);

      if (t < UPLOAD) activate(t < UPLOAD / 2 ? ["client"] : ["api"]);
      else if (t < PICKED) activate(["queue"]);
      else if (t < DONE) activate(["stream", "validate", "batch", "redis", "sse", "dash"]);
      else if (t < RESET) activate(["mongo", "dash"]);
      else activate([]);

      const elapsed = t >= PICKED ? Math.min(t, DONE) - PICKED : 0;
      setText(clock, t < PICKED ? "0.0 s" : `${elapsed.toFixed(1)} s`);
      const line =
        t < UPLOAD
          ? "The client uploads users.csv. The API stores it and replies 202 straight away."
          : t < QUEUED
            ? "Job #128 waits in the BullMQ queue on Redis."
            : t < PICKED
              ? "A worker picks up the job."
              : t < DONE
                ? "Streaming rows through three validation layers, writing valid ones in batches of 1,000."
                : t < RESET
                  ? `Done: 100,000 rows in about 9 seconds, ${fmt.format(invalid)} invalid rows kept with their line numbers.`
                  : "Starting the next upload.";
      if (line !== lastStatus && status) {
        status.textContent = line;
        lastStatus = line;
      }
    };

    if (reduce) {
      render(PICKED + (DONE - PICKED) * 0.64);
      return;
    }

    let raf = 0;
    let running = false;
    let offset = 0;
    let started = 0;
    const loop = (now: number) => {
      render((((now - started) / 1000 + offset) % CYCLE + CYCLE) % CYCLE);
      raf = requestAnimationFrame(loop);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        started = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && running) {
        running = false;
        offset += (performance.now() - started) / 1000;
        cancelAnimationFrame(raf);
      }
    });
    observer.observe(el);
    render(0);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div ref={root} className="flex flex-col gap-3">
      <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:mx-0 md:px-0">
        <svg
          viewBox="-8 -8 1216 316"
          role="img"
          aria-label="Parsr architecture. The Next.js client uploads a CSV to the Express API, which queues a job in BullMQ on Redis. A worker streams the file, validates each row in three layers and writes valid rows to MongoDB in batches, keeping invalid rows with their reasons. Progress is stored in Redis and sent to a live dashboard over Server Sent Events."
          className="block h-auto w-full min-w-[880px] font-sans"
        >
          {/* Worker process group */}
          <rect x="520" y="8" width="480" height="122" rx="14" className="fill-none stroke-line" strokeWidth="1.25" strokeDasharray="5 5" />
          <text x="536" y="0" className="fill-muted font-mono text-[11px]">
            Worker process · Application
          </text>

          {/* Connectors */}
          {LINKS.map((l, i) => (
            <path
              key={i}
              d={path(l.pts)}
              className="fill-none stroke-line"
              strokeWidth="1.5"
              strokeDasharray={l.dashed ? "4 5" : undefined}
            />
          ))}
          <text x="76" y="176" className="fill-muted font-mono text-[11px]">
            same Next.js app
          </text>

          {/* Flowing things sit under the nodes, so they pass through them */}
          <g aria-hidden="true">
            {Array.from({ length: DOTS }, (_, i) => (
              <circle key={i} data-dot r="4" opacity="0" className="fill-lamp data-[bad=true]:fill-muted" />
            ))}
            {Array.from({ length: BLOCKS }, (_, i) => (
              <rect key={i} data-block x="-13" y="-8" width="26" height="16" rx="3" opacity="0" className="fill-lamp" />
            ))}
            {Array.from({ length: PULSES }, (_, i) => (
              <circle key={i} data-pulse r="3.5" opacity="0" className="fill-ink" />
            ))}
          </g>

          {/* Nodes */}
          {NODES.map((n) => (
            <g key={n.id} data-node={n.id} data-active="false" className="group">
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx="10"
                strokeWidth="1.5"
                className="fill-bg stroke-line transition-colors duration-500 group-data-[active=true]:stroke-lamp"
              />
              {n.layer ? (
                <text x={n.x} y={n.y - 10} className="fill-muted font-mono text-[11px]">
                  {n.layer}
                </text>
              ) : null}
              <text x={n.x + 14} y={n.y + (n.h >= 70 ? 28 : 24)} className="fill-ink text-[15px] font-semibold tracking-tight">
                {n.title}
              </text>
              <text x={n.x + 14} y={n.y + (n.h >= 70 ? 48 : 43)} data-sub={n.id} className="fill-muted font-mono text-[11px]">
                {n.sub}
              </text>
            </g>
          ))}

          {/* Job card parked in the queue */}
          <rect data-job x="354" y="96" width="56" height="7" rx="2" opacity="0" className="fill-lamp" />

          {/* Batch filling up to 1,000 rows */}
          <rect x="874" y="97" width="92" height="5" rx="2.5" className="fill-line" />
          <rect data-batch-fill x="874" y="97" width="92" height="5" rx="2.5" className="fill-lamp" style={{ transformBox: "fill-box", transformOrigin: "left center", transform: "scaleX(0)" }} />

          {/* Dashboard progress over SSE */}
          <rect x="130" y="268" width="114" height="5" rx="2.5" className="fill-line" />
          <rect data-dash-fill x="130" y="268" width="114" height="5" rx="2.5" className="fill-lamp" style={{ transformBox: "fill-box", transformOrigin: "left center", transform: "scaleX(0)" }} />

          {/* The uploaded file */}
          <g data-token opacity="0" aria-hidden="true">
            <rect x="-38" y="-12" width="76" height="24" rx="4" className="fill-bg stroke-lamp" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" className="fill-ink font-mono text-[11px]">
              users.csv
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p data-status className="type-small min-h-[1.5em] text-ink" aria-hidden="true">
          The client uploads users.csv. The API stores it and replies 202 straight away.
        </p>
        <p className="type-mono text-muted">
          Sample run at benchmark speed · <span data-clock>0.0 s</span>
        </p>
      </div>
      <p className="type-mono text-muted md:hidden">Swipe the diagram to follow the pipeline.</p>
    </div>
  );
}
