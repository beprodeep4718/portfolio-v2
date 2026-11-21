/** Small helpers shared by the scroll story. No React here, so any client module can use them. */

/** Room the floating dock takes at the foot of the screen; pinned scenes stay clear of it */
export const DOCK_H = 96;

export const MOTION = "(prefers-reduced-motion: no-preference)";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Where the page's content starts at this width (matches the container-page utility) */
export function contentLeft(width: number) {
  const pad = width >= 1280 ? 40 : width >= 768 ? 32 : 16;
  return Math.max(0, (width - 1320) / 2) + pad;
}

/**
 * 0 to 1 as an element passes through the viewport: starts when its top is at
 * `from` of the viewport height, ends when its bottom is at `to`. Always
 * finishes by the bottom of the page, so text near the end still lights fully.
 */
export function passage(el: HTMLElement, from = 0.82, to = 0.45) {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const r = el.getBoundingClientRect();
  const max = document.documentElement.scrollHeight - vh;
  const end = Math.min(r.bottom + y - to * vh, max);
  const start = Math.min(r.top + y - from * vh, end - 120);
  return clamp01((y - start) / (end - start));
}

const wordCache = new WeakMap<HTMLElement, HTMLElement[]>();

function wordsOf(root: HTMLElement) {
  let words = wordCache.get(root);
  if (!words) {
    words = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
    wordCache.set(root, words);
  }
  return words;
}

/** Lights the words of a LitText one after another; the two at the front glow lamp orange */
export function paintWords(root: HTMLElement, p: number) {
  const words = wordsOf(root);
  const front = p * (words.length + 2);
  words.forEach((word, i) => {
    const v = clamp01((front - i) / 2);
    const opacity = v >= 1 ? "" : (0.16 + 0.84 * v).toFixed(3);
    const color = v > 0.04 && v < 0.96 ? "var(--lamp-text)" : "";
    if (word.style.opacity !== opacity) word.style.opacity = opacity;
    if (word.style.color !== color) word.style.color = color;
  });
}

export function clearWords(root: HTMLElement) {
  wordsOf(root).forEach((word) => {
    word.style.opacity = "";
    word.style.color = "";
  });
}

/** Counts every number in a value up from zero: "802,028" at 0.5 reads "401,014" */
export function countText(value: string, p: number) {
  return value.replace(/\d[\d,]*/g, (match) => {
    const n = Math.round(Number(match.replace(/,/g, "")) * p);
    return match.includes(",") ? n.toLocaleString("en-US") : String(n);
  });
}
