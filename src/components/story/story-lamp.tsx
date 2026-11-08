"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, type ChapterId } from "@/content/site";
import { lampStore } from "./lamp-store";
import { MOTION, NAV_H, clamp01, contentLeft, easeInOut } from "./paint";

/** How far you scroll before the lamp has left the name and reached its rail */
const LEAVE = 440;
/** The lamp rides the rail at this height of the viewport, which is also the reading line */
const LINE = 0.5;
/** Glow size (as the font size its em shadows scale with): the hero lamp's, then the rail's */
const HOME_GLOW = 16;
const RAIL_GLOW = 48;

type Geometry = {
  chapters: { id: ChapterId; top: number }[];
  layers: { top: number; bottom: number }[];
  /** Centre of the Say hello full stop, in page coordinates */
  dock: { x: number; y: number; size: number; glow: number } | null;
  max: number;
};

/**
 * The story lamp. It leaves the full stop of the name as you scroll, rides a
 * rail down the left gutter through every chapter (named beside it on wide
 * screens), and lands as the full stop of Say hello. Behind the content, its
 * halo widens while the prologue is lit. Not used under reduced motion: the
 * two full stops then stay where they are.
 */
export function StoryLamp() {
  const halo = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const h = halo.current;
    const r = rail.current;
    const t = trail.current;
    const l = label.current;
    const d = dot.current;
    if (!h || !r || !t || !l || !d) return;

    const run = () => {
      const html = document.documentElement;
      const main = document.getElementById("main");
      const dockEl = document.querySelector<HTMLElement>('[data-dock="contact"]');
      const geo: Geometry = { chapters: [], layers: [], dock: null, max: 0 };

      /* A pinned section is measured by the spacer that holds its place */
      const box = (el: HTMLElement) => {
        const parent = el.parentElement;
        const target = parent?.classList.contains("pin-spacer") ? parent : el;
        const b = target.getBoundingClientRect();
        return { top: b.top + window.scrollY, bottom: b.bottom + window.scrollY };
      };

      const measure = () => {
        geo.chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"))
          .map((el) => ({ id: el.dataset.chapter as ChapterId, top: box(el).top }))
          .sort((a, b) => a.top - b.top);
        geo.layers = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-layer]")).map(box);
        if (dockEl) {
          const b = dockEl.getBoundingClientRect();
          geo.dock = {
            x: b.left + b.width / 2,
            y: b.top + window.scrollY + b.height / 2,
            size: b.width,
            glow: parseFloat(getComputedStyle(dockEl).fontSize) || RAIL_GLOW,
          };
        }
        geo.max = ScrollTrigger.maxScroll(window);
      };

      /* Write a style only when it changes */
      const last = new Map<string, string>();
      const set = (el: HTMLElement, key: string, prop: string, value: string) => {
        if (last.get(key) === value) return;
        last.set(key, value);
        el.style.setProperty(prop, value);
      };

      let started = false;
      const tick = () => {
        const home = lampStore.home;
        if (!home.ready || !home.el) return;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const left = contentLeft(html.clientWidth);
        const railX = Math.round(left / 2);
        const railSize = left >= 64 ? 14 : left >= 32 ? 12 : 8;

        /* From where the hero holds it, down to the rail */
        const hb = home.el.getBoundingClientRect();
        const p1 = easeInOut(clamp01(y / LEAVE));
        let x = hb.left + home.x + (railX - hb.left - home.x) * p1;
        let ly = hb.top + home.y + (vh * LINE - hb.top - home.y) * p1;
        let size = home.size + (railSize - home.size) * p1;
        let glow = HOME_GLOW + ((RAIL_GLOW * railSize) / 14 - HOME_GLOW) * p1;

        /* From the rail into the full stop of Say hello */
        let p3 = 0;
        const dock = geo.dock;
        if (dock) {
          const end = Math.min(dock.y - 0.42 * vh, geo.max);
          const begin = Math.min(dock.y - 1.05 * vh, end - 120);
          p3 = easeInOut(clamp01((y - begin) / (end - begin)));
          x += (dock.x - x) * p3;
          ly += (dock.y - y - ly) * p3;
          size += (dock.size - size) * p3;
          glow += (dock.glow - glow) * p3;
        }
        const land = clamp01((p3 - 0.92) / 0.08);
        const on = p1 * (1 - p3);

        set(d, "dt", "transform", `translate3d(${(x - size / 2).toFixed(1)}px, ${(ly - size / 2).toFixed(1)}px, 0)`);
        set(d, "dw", "width", `${size.toFixed(1)}px`);
        set(d, "dh", "height", `${size.toFixed(1)}px`);
        set(d, "df", "font-size", `${glow.toFixed(1)}px`);
        set(d, "do", "opacity", (1 - land).toFixed(3));
        if (dockEl) set(dockEl, "dock", "opacity", land.toFixed(3));

        const railOn = left >= 32 ? on.toFixed(3) : "0";
        set(r, "rt", "transform", `translateX(${railX - 0.5}px)`);
        set(r, "ro", "opacity", railOn);
        set(t, "tt", "transform", `translateX(${railX - 0.5}px)`);
        set(t, "th", "height", `${Math.max(0, ly - NAV_H).toFixed(1)}px`);
        set(t, "to", "opacity", railOn);

        /* The chapter the reading line is in, written up the rail above the lamp */
        const line = y + vh * LINE;
        let chapter: ChapterId | null = null;
        for (const c of geo.chapters) if (c.top <= line) chapter = c.id;
        const text = chapter ? chapters[chapter] : "";
        if (l.textContent !== text) l.textContent = text;
        const layer = geo.layers.findIndex((b) => b.top <= line && line < b.bottom);
        set(l, "lc", "color", layer >= 2 ? "var(--l3-muted)" : "");
        set(l, "lt", "transform", `translate3d(${railX + railSize / 2 + 8}px, ${(ly - 16).toFixed(1)}px, 0) rotate(-90deg)`);
        set(l, "lo", "opacity", left >= 90 && text ? on.toFixed(3) : "0");

        /* The halo sits behind the content and widens while the prologue is lit */
        const g = lampStore.glow;
        const span = 420 + 1000 * g;
        set(h, "ht", "transform", `translate3d(${(x - 200).toFixed(1)}px, ${(ly - 200).toFixed(1)}px, 0) scale(${(span / 400).toFixed(3)})`);
        set(h, "ho", "opacity", (on * (0.85 + 0.15 * g)).toFixed(3));

        const final = lampStore.final;
        final.x = x;
        final.y = ly;
        final.size = size;
        final.active = true;
        if (!started) {
          started = true;
          html.dataset.story = "on";
        }
      };

      /* Keep positions right when the page changes height (a project row opening, images loading) */
      let height = main?.offsetHeight ?? 0;
      let timer = 0;
      const onRefresh = () => {
        measure();
        height = main?.offsetHeight ?? 0;
      };
      const observer = new ResizeObserver(() => {
        const now = main?.offsetHeight ?? 0;
        if (Math.abs(now - height) < 2) return;
        height = now;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      });
      if (main) observer.observe(main);

      ScrollTrigger.addEventListener("refresh", onRefresh);
      measure();
      gsap.ticker.add(tick);
      /* Every scene has registered by now; refresh them in page order so pins add up */
      const frame = requestAnimationFrame(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });

      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        observer.disconnect();
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        gsap.ticker.remove(tick);
        delete html.dataset.story;
        lampStore.final.active = false;
        if (dockEl) dockEl.style.opacity = "";
        for (const el of [h, r, t, l, d]) el.removeAttribute("style");
        l.textContent = "";
      };
    };

    const media = window.matchMedia(MOTION);
    let stop: (() => void) | null = null;
    const sync = () => {
      stop?.();
      stop = media.matches ? run() : null;
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      stop?.();
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          ref={halo}
          className="absolute top-0 left-0 size-[400px] rounded-full bg-[radial-gradient(circle,var(--halo)_0%,transparent_62%)] opacity-0"
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        <span ref={rail} className="absolute top-19 bottom-0 left-0 w-px bg-rail opacity-0" />
        <span
          ref={trail}
          className="absolute top-19 left-0 h-0 w-px bg-[linear-gradient(to_bottom,transparent,var(--lamp))] opacity-0"
        />
        <span
          ref={label}
          className="type-mono absolute top-0 left-0 origin-top-left text-[12px] leading-[18px] tracking-[0.08em] whitespace-nowrap text-muted uppercase opacity-0"
        />
        <span ref={dot} className="lamp absolute top-0 left-0 opacity-0" />
      </div>
    </>
  );
}
