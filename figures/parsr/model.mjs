/**
 * Parsr, the truth model. Every moving part and every number on the card
 * reads from here.
 *
 * Real numbers (from the StreamIngest README): 10,000 rows ingest in about
 * 1.2 s, writes go out as bulkWrite batches of 1,000, every row passes three
 * validation layers and invalid rows are kept with their reason.
 *
 * The figure runs a 10,000 row file about 10x slower than real time so the
 * eye can follow it. Each card on the belt stands for 250 rows.
 */

export const M = {
  ROWS: 10000,
  PER_CARD: 250,
  CARDS: 40,
  PER_BATCH: 4, // 4 cards x 250 rows = one bulkWrite of 1,000
  REAL_SECONDS: 1.2,
  /* card index -> the gate (1, 2 or 3) that rejects it: 2 x 250 = 500 bad rows */
  BAD: { 13: 2, 29: 3 },
  DISPATCH: 1.0, // the job ticket slides along the rail to the reader
  EVERY: 0.32, // a card leaves the reader every 0.32 s
  SPEED: 160, // belt speed, world units per second
  X0: -150, // where cards leave the reader
  GATES: [-95, -25, 45],
  PUSH_X: 105,
  END_X: 174,
  HATCH: [191, 50],
  DROP: 0.2,
  PUSH: 0.5,
  FLUSH: 0.3,
  HOLD: 2.6,
  RESET: 0.8,
  CARD_Z: 34,
  STACK_Z: 26,
  CARD_H: 2,
  TRAY_Z: 3,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ease = (s) => (s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2);

export function plan() {
  const release = (i) => M.DISPATCH + i * M.EVERY;
  const atPush = (i) => release(i) + (M.PUSH_X - M.X0) / M.SPEED;
  const atEnd = (i) => release(i) + (M.END_X - M.X0) / M.SPEED;
  const valid = [];
  for (let i = 0; i < M.CARDS; i++) if (!M.BAD[i]) valid.push(i);
  const batches = [];
  for (let b = 0; b * M.PER_BATCH < valid.length; b++) {
    const cards = valid.slice(b * M.PER_BATCH, (b + 1) * M.PER_BATCH);
    const last = cards[cards.length - 1];
    batches.push({ cards, flush: atEnd(last) + M.DROP + (cards.length < M.PER_BATCH ? 0.3 : 0.02) });
  }
  const slot = {};
  const batchOf = {};
  batches.forEach((b, bi) => b.cards.forEach((c, k) => ((slot[c] = k), (batchOf[c] = bi))));
  const badOrder = Object.keys(M.BAD).map(Number);
  const end = batches[batches.length - 1].flush + M.FLUSH;
  return { release, atPush, atEnd, valid, batches, slot, batchOf, badOrder, end, cycle: end + M.HOLD + M.RESET };
}

/** Where card i is at time t, and which layer draws it */
export function cardAt(i, t, S) {
  const rel = S.release(i);
  if (t < rel) return { layer: "none" };
  const bad = M.BAD[i];
  if (bad) {
    const ap = S.atPush(i);
    if (t < ap) return { layer: "belt", x: M.X0 + (t - rel) * M.SPEED, y: 50, z: M.CARD_Z };
    const k = S.badOrder.indexOf(i);
    const s = clamp((t - ap) / M.PUSH, 0, 1);
    const y = 50 + 38 * ease(s);
    const zEnd = M.TRAY_Z + k * M.CARD_H;
    const z = M.CARD_Z - (M.CARD_Z - zEnd) * s * s;
    const x = M.PUSH_X + k * 2;
    return { layer: y <= 70 ? "belt" : "tray", x, y, z, landed: s >= 1 };
  }
  const ae = S.atEnd(i);
  if (t < ae) return { layer: "belt", x: M.X0 + (t - rel) * M.SPEED, y: 50, z: M.CARD_Z };
  const top = M.STACK_Z + S.slot[i] * M.CARD_H;
  const flush = S.batches[S.batchOf[i]].flush;
  if (t < ae + M.DROP) {
    const s = (t - ae) / M.DROP;
    return { layer: "hatch", x: M.END_X + (M.HATCH[0] - M.END_X) * s, y: 50, z: M.CARD_Z - (M.CARD_Z - top) * s * s };
  }
  if (t < flush) return { layer: "hatch", x: M.HATCH[0], y: 50, z: top };
  const s = clamp((t - flush) / M.FLUSH, 0, 1);
  if (s >= 1) return { layer: "none" };
  return { layer: "hatch", x: M.HATCH[0], y: 50, z: top - 12 * ease(s) };
}

/** Everything else the figure shows at time t */
export function stateAt(t, S) {
  const streaming = clamp((t - M.DISPATCH) / (M.EVERY * M.CARDS), 0, 1);
  const read = Math.round(streaming * M.ROWS);
  let checked = 0;
  let rejected = 0;
  for (let i = 0; i < M.CARDS; i++) {
    if (t >= S.atPush(i)) checked += M.PER_CARD;
    if (M.BAD[i] && t >= S.atPush(i) + M.PUSH) rejected += M.PER_CARD;
  }
  let filed = 0;
  let batches = 0;
  S.batches.forEach((b) => {
    if (t >= b.flush + M.FLUSH * 0.6) {
      filed += b.cards.length * M.PER_CARD;
      batches += 1;
    }
  });
  /* the pusher stroke, for whichever bad card is at it */
  let ram = 0;
  for (const i of S.badOrder) {
    const s = (t - S.atPush(i)) / M.PUSH;
    if (s > 0 && s < 1.6) ram = Math.max(ram, s < 1 ? ease(s) : 1 - ease((s - 1) / 0.6));
  }
  /* the hatch floor sinks while a batch is filed */
  let sink = 0;
  for (const b of S.batches) {
    const s = (t - b.flush) / M.FLUSH;
    if (s > 0 && s < 1.6) sink = Math.max(sink, s < 1 ? ease(s) : 1 - ease((s - 1) / 0.6));
  }
  /* gate probes come down onto whatever card is under them */
  const gates = M.GATES.map((gx, g) => {
    let press = 0;
    let fail = false;
    for (let i = 0; i < M.CARDS; i++) {
      const rel = S.release(i);
      if (t < rel) continue;
      const x = M.X0 + (t - rel) * M.SPEED;
      if (M.BAD[i] && t > S.atPush(i)) continue;
      const d = Math.abs(x - gx);
      if (d < 14) {
        press = Math.max(press, 1 - d / 14);
        if (M.BAD[i] === g + 1) fail = true;
      }
    }
    return { press: ease(press), fail };
  });
  const done = t >= S.end;
  return {
    t,
    read,
    checked,
    rejected,
    filed,
    batches,
    ram,
    sink,
    gates,
    done,
    belt: clamp(t - M.DISPATCH, 0, S.end - M.DISPATCH) * M.SPEED,
    ticket: clamp(t / M.DISPATCH, 0, 1),
    progress: checked / M.ROWS,
  };
}

export function readoutOf(s) {
  const n = (v) => v.toLocaleString("en-US");
  if (s.t < M.DISPATCH) return "job queued · 10,000 rows waiting";
  if (s.done)
    return `${n(s.filed)} filed · ${n(s.rejected)} rejected · ${M.REAL_SECONDS} s at full speed`;
  return `${n(s.checked)} / ${n(M.ROWS)} rows · ${s.batches} batch${s.batches === 1 ? "" : "es"} filed · ${n(s.rejected)} rejected`;
}
