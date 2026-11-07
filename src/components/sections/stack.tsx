"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { layers } from "@/content/site";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Each layer is darker than the one above it */
const tone = [
  { band: "bg-l1 text-l1-ink", muted: "text-l1-muted" },
  { band: "bg-l2 text-l2-ink", muted: "text-l2-muted" },
  { band: "bg-l3 text-l3-ink", muted: "text-l3-muted" },
  { band: "bg-l4 text-l4-ink", muted: "text-l4-muted" },
];

/**
 * The lamp sinks down the rail as you scroll through the four layers, and
 * the layer it is in gets marked. Reduced motion: it rests in the data layer.
 */
export function Stack() {
  const wrap = useRef<HTMLDivElement>(null);
  const lamp = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = wrap.current;
      const dot = lamp.current;
      if (!root || !dot) return;
      const bands = gsap.utils.toArray<HTMLElement>("[data-layer]", root);
      const mm = gsap.matchMedia();

      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { reduce } = ctx.conditions as { reduce: boolean };
          const mark = (index: number) => bands.forEach((b, i) => (b.dataset.active = String(i === index)));

          if (reduce) {
            const third = bands[2];
            gsap.set(dot, { y: third.offsetTop + 56 });
            mark(2);
            return;
          }

          const startY = bands[0].offsetTop + 56;
          const last = bands[bands.length - 1];
          const endY = last.offsetTop + last.offsetHeight - 40;

          gsap.fromTo(
            dot,
            { y: startY },
            {
              y: endY,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top 55%",
                end: "bottom 60%",
                scrub: 0.6,
                invalidateOnRefresh: true,
                onUpdate: () => {
                  const y = Number(gsap.getProperty(dot, "y"));
                  let index = 0;
                  bands.forEach((b, i) => {
                    if (y >= b.offsetTop) index = i;
                  });
                  mark(index);
                },
              },
            },
          );
        },
      );

      return () => mm.revert();
    },
    { scope: wrap },
  );

  return (
    <section id="stack" aria-labelledby="stack-title" className="pt-12">
      <div className="container-page flex flex-wrap items-end justify-between gap-x-12 gap-y-4 pb-12">
        <h2 id="stack-title" className="display-section text-ink">
          How deep I go
        </h2>
        <p className="type-body max-w-[460px] text-muted">
          Four layers, one person. This is what I reach for at each depth. The lamp sinks through them as you scroll.
        </p>
      </div>

      <div ref={wrap} className="relative">
        <ol>
          {layers.map((layer, i) => (
            <li key={layer.title} data-layer data-active="false" className={cn("group relative", tone[i].band)}>
              <div className="container-page relative py-11">
                {/* Rail segment: lines up across bands into one continuous rail */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 left-[calc(16px+8px)] w-px bg-current opacity-15 md:left-[calc(32px+8px)] xl:left-[calc(40px+8px)]"
                />
                {/* Content clears the rail at every width */}
                <div className="flex flex-wrap items-start gap-x-10 gap-y-3 pl-12">
                  <span
                    className={cn(
                      "type-mono basis-full transition-colors duration-500 lg:basis-12 lg:pt-3",
                      tone[i].muted,
                      "group-data-[active=true]:font-semibold group-data-[active=true]:text-current",
                    )}
                  >
                    <span className="sr-only">Layer </span>
                    {layer.depth}
                  </span>
                  <h3 className="display-layer min-w-0 flex-[1_1_240px]">{layer.title}</h3>
                  <p className={cn("min-w-0 flex-[1_1_240px] text-[19px] leading-[1.45]", tone[i].muted)}>{layer.what}</p>
                  <p className="type-body-sm min-w-0 flex-[1_1_280px] leading-[1.6]">{layer.tools}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* The lamp on the rail */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="container-page relative h-full">
            <span
              ref={lamp}
              className="lamp-dot absolute top-0 left-4 size-[18px] md:left-8 xl:left-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
