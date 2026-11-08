"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION } from "./paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  as?: "ul" | "ol" | "dl" | "div";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** A list whose items rise in one after another the first time it comes into view */
export function RiseGroup({ as: Tag = "div", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.from(Array.from(el.children), {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });
    return () => mm.revert();
  });

  return (
    <Tag ref={ref as never} className={className} {...rest}>
      {children}
    </Tag>
  );
}
