"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTheme } from "@/components/theme";
import { darkPalette, drawBoard, drawSignals, generateBoard, lightPalette, type Board } from "./circuit";
import type { LampState } from "./lamp-field";

/**
 * The circuit board under the hero. A faint copy is always there; the lamp
 * lights up a circle of it, with signals and data packets moving along the
 * copper. Only the square around the lamp is redrawn each frame.
 */
export function CircuitReveal({
  lamp,
  running,
  reduce,
}: {
  lamp: RefObject<LampState>;
  running: boolean;
  reduce: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const baseCanvas = useRef<HTMLCanvasElement>(null);
  const litCanvas = useRef<HTMLCanvasElement>(null);
  const dark = useTheme() === "dark";

  useEffect(() => {
    const el = wrap.current;
    const base = baseCanvas.current;
    const lit = litCanvas.current;
    if (!el || !base || !lit) return;
    const litCtx = lit.getContext("2d");
    const baseCtx = base.getContext("2d");
    if (!litCtx || !baseCtx) return;

    const palette = dark ? darkPalette : lightPalette;
    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains").trim() || "ui-monospace, monospace";

    let board: Board | null = null;
    const source = document.createElement("canvas");
    let W = 0;
    let H = 0;
    let dpr = 1;
    let prev = { x: 0, y: 0, w: 0, h: 0 };
    let last = { x: -1, y: -1 };
    let raf = 0;
    const start = performance.now();

    const setup = () => {
      const rect = el.getBoundingClientRect();
      W = Math.round(rect.width);
      H = Math.round(rect.height);
      if (!W || !H) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      board = generateBoard(W, H);

      source.width = W * dpr;
      source.height = H * dpr;
      const sctx = source.getContext("2d");
      if (!sctx) return false;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(sctx, board, palette, mono);

      for (const c of [base, lit]) {
        c.width = W * dpr;
        c.height = H * dpr;
        c.style.width = `${W}px`;
        c.style.height = `${H}px`;
      }
      baseCtx.setTransform(1, 0, 0, 1, 0, 0);
      baseCtx.clearRect(0, 0, base.width, base.height);
      baseCtx.drawImage(source, 0, 0);
      litCtx.setTransform(1, 0, 0, 1, 0, 0);
      litCtx.clearRect(0, 0, lit.width, lit.height);
      prev = { x: 0, y: 0, w: 0, h: 0 };
      last = { x: -1, y: -1 };
      return true;
    };

    const draw = () => {
      const L = lamp.current;
      if (!board || !L.ready) return;
      const moved = Math.abs(L.x - last.x) > 0.3 || Math.abs(L.y - last.y) > 0.3;
      if (reduce && !moved) return;
      last = { x: L.x, y: L.y };

      const radius = Math.max(120, Math.min(340, W * 0.22));
      litCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      litCtx.clearRect(prev.x - 2, prev.y - 2, prev.w + 4, prev.h + 4);

      const x0 = Math.max(0, Math.floor(L.x - radius));
      const y0 = Math.max(0, Math.floor(L.y - radius));
      const x1 = Math.min(W, Math.ceil(L.x + radius));
      const y1 = Math.min(H, Math.ceil(L.y + radius));
      const w = x1 - x0;
      const h = y1 - y0;
      if (w <= 0 || h <= 0) return;

      litCtx.save();
      litCtx.beginPath();
      litCtx.rect(x0, y0, w, h);
      litCtx.clip();
      litCtx.drawImage(source, x0 * dpr, y0 * dpr, w * dpr, h * dpr, x0, y0, w, h);
      drawSignals(litCtx, board, reduce ? 0 : (performance.now() - start) / 1000, palette, mono, x0, y0, w, h);

      /* Light falloff: everything outside the lamp's reach fades to nothing */
      const light = litCtx.createRadialGradient(L.x, L.y, 0, L.x, L.y, radius);
      light.addColorStop(0, "rgba(0,0,0,1)");
      light.addColorStop(0.35, "rgba(0,0,0,0.85)");
      light.addColorStop(1, "rgba(0,0,0,0)");
      litCtx.globalCompositeOperation = "destination-in";
      litCtx.fillStyle = light;
      litCtx.fillRect(x0, y0, w, h);
      litCtx.restore();

      prev = { x: x0, y: y0, w, h };
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (!setup()) return;
    if (running) raf = requestAnimationFrame(loop);

    let resizeTimer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setup();
        draw();
      }, 150);
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [dark, running, reduce, lamp]);

  return (
    <div ref={wrap} aria-hidden="true" className="absolute inset-0">
      <canvas ref={baseCanvas} className="absolute inset-0 opacity-[0.05]" />
      <canvas ref={litCanvas} className="absolute inset-0" />
    </div>
  );
}
