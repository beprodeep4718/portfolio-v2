"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION, NAV_H, clamp01, clearWords, countText, easeOut, paintWords, passage } from "@/components/story/paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Room for the held scene: wide enough for two columns and tall enough to show it whole */
const HOLD = "(min-width: 1024px) and (min-height: 760px)";

/**
 * Parsr's chapter. On a large screen it is held below the header while you
 * scroll: the summary lights up, a row of data travels down the six steps as
 * the card sorter runs to match, and the results count up at the end. On
 * smaller screens each part plays as it passes. Reduced motion: all still.
 */
export function PipelineScene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const inner = el?.firstElementChild as HTMLElement | null;
      if (!el || !inner) return;

      const summary = el.querySelector<HTMLElement>("[data-lit]");
      const pipe = el.querySelector<HTMLElement>("[data-pipe]");
      const line = el.querySelector<HTMLElement>("[data-pipe-line]");
      const fill = el.querySelector<HTMLElement>("[data-pipe-fill]");
      const dot = el.querySelector<HTMLElement>("[data-pipe-dot]");
      const steps = gsap.utils.toArray<HTMLElement>("[data-pipe-step]", el);
      const marks = steps.map((s) => s.querySelector<HTMLElement>("[data-pipe-mark]"));
      const titles = steps.map((s) => s.querySelector<HTMLElement>("[data-pipe-title]"));
      const counts = gsap.utils.toArray<HTMLElement>("[data-count]", el);
      const figure = el.querySelector<HTMLElement>(".parsr");

      /* Centre of each step's marker, measured down the list */
      let centres: number[] = [];
      const measure = () => {
        centres = steps.map((s, i) => {
          const m = marks[i];
          return s.offsetTop + (m ? m.offsetTop + m.offsetHeight / 2 : 0);
        });
        if (line && centres.length > 1) {
          line.style.top = `${centres[0]}px`;
          line.style.bottom = "auto";
          line.style.height = `${centres[centres.length - 1] - centres[0]}px`;
        }
      };

      /* q from 0 to 1: how far the row has travelled from Upload to Watch */
      const paintPipe = (q: number) => {
        if (centres.length < 2) measure();
        if (centres.length < 2) return;
        const f = q * (centres.length - 1);
        const k = Math.min(centres.length - 2, Math.floor(f));
        const y = centres[k] + (centres[k + 1] - centres[k]) * (f - k);
        const current = Math.min(steps.length - 1, Math.floor(f + 0.001));
        steps.forEach((step, i) => {
          const passed = i <= f + 0.001;
          step.style.opacity = passed ? "" : "0.3";
          const m = marks[i];
          if (m) {
            m.style.background = passed ? "var(--lamp)" : "";
            m.style.borderColor = passed ? "var(--lamp)" : "";
          }
          const title = titles[i];
          if (title) title.style.color = i === current ? "var(--lamp-text)" : "";
        });
        if (dot) {
          dot.style.opacity = "1";
          dot.style.transform = `translateY(${(y - dot.offsetHeight / 2).toFixed(1)}px)`;
        }
        if (fill) {
          fill.style.top = `${centres[0]}px`;
          fill.style.height = `${(y - centres[0]).toFixed(1)}px`;
        }
      };

      /* The results stay dim until they count up, so the zeros read as still to come */
      const results = counts[0]?.closest("dl") ?? null;
      const paintCounts = (p: number) => {
        counts.forEach((c) => (c.textContent = countText(c.dataset.count ?? "", p)));
        if (results) results.style.opacity = p >= 1 ? "" : (0.35 + 0.65 * p).toFixed(3);
      };

      /* Hold the card sorter at a point in its run, or let it tour again (null) */
      const scrub = (q: number | null) => figure?.dispatchEvent(new CustomEvent("parsr:scrub", { detail: q }));

      const clear = () => {
        if (summary) clearWords(summary);
        for (const node of [...steps, ...marks, ...titles, dot, fill, line, results]) node?.removeAttribute("style");
        counts.forEach((c) => (c.textContent = c.dataset.count ?? ""));
      };

      const held = () => {
        gsap.set(el, { minHeight: `calc(100svh - ${NAV_H}px)`, display: "flex", alignItems: "center" });
        let lastQ = -1;
        const paint = (self: ScrollTrigger) => {
          const p = self.progress;
          if (summary) paintWords(summary, clamp01(p / 0.16));
          const q = clamp01((p - 0.14) / 0.68);
          paintPipe(q);
          paintCounts(easeOut(clamp01((p - 0.8) / 0.16)));
          if (self.isActive && Math.abs(q - lastQ) > 0.0005) {
            lastQ = q;
            scrub(q);
          }
        };
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: `top ${NAV_H}px`,
          end: () => `+=${Math.round(window.innerHeight * 2.2)}`,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: paint,
          onRefresh: (self) => {
            measure();
            paint(self);
          },
          onToggle: (self) => {
            if (self.isActive) return;
            lastQ = -1;
            scrub(null);
          },
        });
        measure();
        paint(trigger);
        return () => {
          scrub(null);
          clear();
        };
      };

      const passing = () => {
        if (summary) {
          const lightSummary = () => paintWords(summary, passage(summary));
          ScrollTrigger.create({
            trigger: summary,
            start: "top bottom",
            end: "bottom top",
            onUpdate: lightSummary,
            onToggle: lightSummary,
            onRefresh: lightSummary,
          });
          lightSummary();
        }
        if (pipe) {
          const travel = () => paintPipe(passage(pipe, 0.8, 0.5));
          ScrollTrigger.create({
            trigger: pipe,
            start: "top bottom",
            end: "bottom top",
            onUpdate: travel,
            onToggle: travel,
            onRefresh: () => {
              measure();
              travel();
            },
          });
          measure();
          travel();
        }
        if (results) {
          const count = { p: 0 };
          paintCounts(0);
          gsap.to(count, {
            p: 1,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => paintCounts(count.p),
            scrollTrigger: { trigger: results, start: "top 88%", once: true },
          });
        }
        return clear;
      };

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION, hold: HOLD }, (ctx) => {
        const { motion, hold } = ctx.conditions as { motion: boolean; hold: boolean };
        if (!motion) return;
        /* Hold it only if the whole scene fits under the header */
        const fits = inner.offsetHeight <= window.innerHeight - NAV_H - 24;
        return hold && fits ? held() : passing();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
