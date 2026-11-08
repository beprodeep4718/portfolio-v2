"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION } from "@/components/story/paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The four layers' list. A layer stays dim until the story lamp reaches it,
 * and the one it is in gets marked. Reduced motion: every layer is lit.
 */
export function StackLayers({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const root = wrap.current;
      if (!root) return;
      const bands = gsap.utils.toArray<HTMLElement>("[data-stack-layer]", root);
      const mm = gsap.matchMedia();

      mm.add(MOTION, () => {
        bands.forEach((band) => {
          /* From the scroll position, not toggles: a fast scroll can jump right past a layer */
          const mark = (self: ScrollTrigger) => {
            const y = self.scroll();
            band.dataset.reached = String(y >= self.start);
            band.dataset.active = String(y >= self.start && y < self.end);
          };
          ScrollTrigger.create({
            trigger: band,
            start: "top 50%",
            end: "bottom 50%",
            onUpdate: mark,
            onToggle: mark,
            onRefresh: mark,
          });
        });
        return () =>
          bands.forEach((band) => {
            band.dataset.reached = "true";
            band.dataset.active = "false";
          });
      });

      return () => mm.revert();
    },
    { scope: wrap },
  );

  return <ol ref={wrap}>{children}</ol>;
}
