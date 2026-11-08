"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prologue } from "@/content/site";
import { LitText } from "@/components/story/lit-text";
import { lampStore } from "@/components/story/lamp-store";
import { MOTION, clamp01, clearWords, paintWords } from "@/components/story/paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Between the name and the work: what the name means, held on screen while
 * its three lines light up one after another and the lamp's halo widens.
 * Under reduced motion it is an ordinary, fully lit section.
 */
export function Prologue() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const lines = gsap.utils.toArray<HTMLElement>("[data-lit]", el);
      const mm = gsap.matchMedia();

      mm.add(MOTION, () => {
        const paint = (p: number) => {
          lines.forEach((line, i) => paintWords(line, clamp01((p - 0.04 - i * 0.29) / 0.26)));
          lampStore.glow = clamp01(p / 0.85) * (1 - clamp01((p - 0.9) / 0.1));
        };
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => paint(self.progress),
          onRefresh: (self) => paint(self.progress),
        });
        paint(trigger.progress);
        return () => {
          lines.forEach(clearWords);
          lampStore.glow = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="prologue"
      data-chapter="prologue"
      aria-label={prologue.label}
      className="flex min-h-svh items-center"
    >
      <div className="container-page py-28">
        <p className="type-mono mb-7 text-muted">{prologue.label}</p>
        {prologue.lines.map((line) => (
          <LitText key={line} manual text={line} className="display-statement max-w-[1100px] text-ink" />
        ))}
      </div>
    </section>
  );
}
