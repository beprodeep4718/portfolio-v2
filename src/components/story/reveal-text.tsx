"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION } from "./paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** A heading's words rise into place from behind their baseline the first time they come into view */
export function RevealText({ children }: { children: ReactNode }) {
  const mask = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.from(inner.current, {
        yPercent: 110,
        duration: 1.1,
        ease: "expo.out",
        clearProps: "transform",
        scrollTrigger: { trigger: mask.current, start: "top 90%", once: true },
      });
    });
    return () => mm.revert();
  });

  return (
    <span ref={mask} className="reveal-mask">
      <span ref={inner} className="inline-block">
        {children}
      </span>
    </span>
  );
}
