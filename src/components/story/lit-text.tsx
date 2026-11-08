"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION, clearWords, paintWords, passage } from "./paint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  text: string;
  as?: "p" | "span";
  className?: string;
  /** A parent scene lights it (with paintWords) instead of the scroll position */
  manual?: boolean;
};

/**
 * Text whose words light up one after another as you read past it, as if the
 * lamp were passing over them. Screen readers get the sentence whole; under
 * reduced motion it is simply lit.
 */
export function LitText({ text, as: Tag = "p", className, manual = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || manual) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        const paint = () => paintWords(el, passage(el));
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onUpdate: paint,
          onToggle: paint,
          onRefresh: paint,
        });
        paint();
        return () => clearWords(el);
      });
      return () => mm.revert();
    },
    { dependencies: [manual, text] },
  );

  return (
    <Tag ref={ref as never} className={className} data-lit="">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i} data-word="">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </Tag>
  );
}
