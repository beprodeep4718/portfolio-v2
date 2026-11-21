"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero, primaryCta, site } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { lampStore } from "@/components/story/lamp-store";
import { Clock } from "@/components/clock";
import type { LampState } from "./lamp-field";
import { CircuitReveal } from "./circuit-reveal";

const LampField = dynamic(() => import("./lamp-field"), { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The lamp is the full stop of the name. On a mouse it follows the cursor
 * around the hero, warming the letters it passes, and settles back as the
 * full stop when the cursor leaves. The story lamp draws it and carries it
 * off down the page when you scroll; wherever it is, the letters and the
 * circuit board under it stay lit.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const lit = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLDivElement>(null);
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
    const o = lit.current;
    if (!el || !d || !o || !running) return;

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
      }
      const k = pointer.inside ? 0.14 : 0.09;
      pos.x += (tx - pos.x) * k;
      pos.y += (ty - pos.y) * k;

      /* Where the lamp rests, for the story lamp to draw and carry */
      const home = lampStore.home;
      home.x = pos.x;
      home.y = pos.y;
      home.size = size;
      home.el = el;
      home.ready = true;

      /* Light whatever is under the lamp, even once it has started down the page */
      const final = lampStore.final;
      const lx = final.active ? final.x - r.left : pos.x;
      const ly = final.active ? final.y - r.top : pos.y;
      o.style.setProperty("--lx", `${lx - (or.left - r.left)}px`);
      o.style.setProperty("--ly", `${ly - (or.top - r.top)}px`);

      lamp.current.x = lx;
      lamp.current.y = ly;
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

  /* With the light gone down the page, the name sinks back into the dark */
  useEffect(() => {
    const el = section.current;
    const c = content.current;
    if (!el || !c || reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.to(c, {
      opacity: 0.35,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: "+=640", scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(c, { clearProps: "opacity" });
    };
  }, [reduce]);

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

      <div ref={content} className="container-page flex flex-col gap-9 pt-6 pb-22 md:pt-8">
        {/* What used to sit in the top bar: the role and the time in Jalpaiguri */}
        <motion.p {...rise(0)} className="type-mono flex flex-wrap justify-between gap-x-6 gap-y-1 text-muted">
          <span>{hero.role}</span>
          <span>
            Jalpaiguri <Clock /> IST
          </span>
        </motion.p>

        <motion.div {...rise(0.1)} className="relative">
          <h1 id="hero-name" className="display-name relative text-ink">
            {site.name}
            <span
              ref={dock}
              aria-hidden="true"
              data-dock="hero"
              className="lamp ml-[0.05em] size-[0.16em]"
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
