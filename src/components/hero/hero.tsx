"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { hero, primaryCta, site } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import type { LampState } from "./lamp-field";
import { CircuitReveal } from "./circuit-reveal";

const LampField = dynamic(() => import("./lamp-field"), { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The lamp is the full stop of the name. On a mouse it follows the cursor
 * around the hero, warming the letters it passes, and settles back as the
 * full stop when the cursor leaves.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const floating = useRef<HTMLSpanElement>(null);
  const lit = useRef<HTMLSpanElement>(null);
  const lamp = useRef<LampState>({ x: 0, y: 0, size: 0, ready: false });
  const [running, setRunning] = useState(true);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), {
      rootMargin: "80px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = section.current;
    const d = dock.current;
    const f = floating.current;
    const o = lit.current;
    if (!el || !d || !f || !o || !running) return;

    const carry = window.matchMedia("(pointer: fine)").matches && !reduce;
    const pointer = { x: 0, y: 0, inside: false };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    if (carry) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const pos = { x: 0, y: 0, started: false };
    let raf = 0;
    const frame = () => {
      const r = el.getBoundingClientRect();
      const dr = d.getBoundingClientRect();
      const or = o.getBoundingClientRect();
      const size = dr.width;
      const dockX = dr.left - r.left + size / 2;
      const dockY = dr.top - r.top + size / 2;
      const tx = pointer.inside ? pointer.x : dockX;
      const ty = pointer.inside ? pointer.y : dockY;

      if (!pos.started) {
        pos.x = tx;
        pos.y = ty;
        pos.started = true;
        el.dataset.lampReady = "true";
      }
      const k = pointer.inside ? 0.14 : 0.09;
      pos.x += (tx - pos.x) * k;
      pos.y += (ty - pos.y) * k;

      f.style.width = `${size}px`;
      f.style.height = `${size}px`;
      f.style.transform = `translate3d(${pos.x - size / 2}px, ${pos.y - size / 2}px, 0)`;
      o.style.setProperty("--lx", `${pos.x - (or.left - r.left)}px`);
      o.style.setProperty("--ly", `${pos.y - (or.top - r.top)}px`);

      lamp.current.x = pos.x;
      lamp.current.y = pos.y;
      lamp.current.size = size;
      lamp.current.ready = true;

      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      if (reduce) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [running, reduce]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section
      ref={section}
      id="top"
      aria-labelledby="hero-name"
      className="group/hero relative isolate overflow-hidden"
    >
      {/* What the light reveals: the circuits under the code */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <CircuitReveal lamp={lamp} running={running} reduce={reduce} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <LampField lamp={lamp} reducedMotion={reduce} running={running} />
      </div>

      {/* The floating lamp: sits on the full stop until the cursor carries it */}
      <span
        ref={floating}
        aria-hidden="true"
        className="lamp pointer-events-none absolute top-0 left-0 z-20 opacity-0 transition-opacity duration-500 group-data-[lamp-ready=true]/hero:opacity-100"
      />

      <div className="container-page flex flex-col gap-9 pt-14 pb-22">
        <motion.div {...rise(0.1)} className="relative">
          <h1 id="hero-name" className="display-name relative text-ink">
            {site.name}
            <span
              ref={dock}
              aria-hidden="true"
              className="lamp ml-[0.05em] size-[0.16em] group-data-[lamp-ready=true]/hero:invisible"
            />
          </h1>
          {/* Same text, lit only around the lamp */}
          <span
            aria-hidden="true"
            className="display-name lit-text pointer-events-none absolute inset-x-0 top-0 -bottom-[0.3em] select-none"
            ref={lit}
          >
            {site.name}
            <span className="ml-[0.05em] inline-block size-[0.16em]" />
          </span>
        </motion.div>

        <motion.p {...rise(0.25)} className="type-mono -mt-3 text-muted">
          <span className="pointer-coarse:hidden">{hero.hintPointer} </span>
          {hero.hintScroll}
        </motion.p>

        <motion.div
          {...rise(0.35)}
          className="flex flex-wrap items-start gap-x-12 gap-y-8 border-t border-rule pt-8"
        >
          <p className="type-lead min-w-0 flex-[2_1_400px] text-ink">{hero.lead}</p>
          <p className="type-body-sm min-w-0 flex-[1_1_240px] text-muted">{hero.nameNote}</p>
          <div className="type-small flex min-w-0 flex-[1_1_200px] flex-col gap-1 text-muted">
            <span className="font-semibold text-ink">Now</span>
            {hero.now.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div className="flex min-w-0 flex-[1_1_200px] flex-col items-start gap-3">
            <a href={primaryCta.href} className={buttonClass("primary")}>
              {primaryCta.label}
            </a>
            <span className="type-small text-muted">{hero.availability}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
