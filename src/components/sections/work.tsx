"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { projects } from "@/content/site";
import { cn } from "@/lib/cn";
import { DepthBars } from "@/components/ui/depth-bars";
import { RevealText } from "@/components/story/reveal-text";
import { RiseGroup } from "@/components/story/rise-group";
import { Featured } from "./featured";

const EASE = [0.22, 1, 0.36, 1] as const;

function Sign({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative flex size-6 shrink-0 items-center justify-center self-center">
      <span className="absolute h-0.5 w-3.5 rounded-full bg-ink" />
      <span
        className={cn(
          "absolute h-3.5 w-0.5 rounded-full bg-ink transition-transform duration-500 ease-smooth",
          open ? "scale-y-0" : "scale-y-100",
        )}
      />
    </span>
  );
}

export function Work() {
  const [open, setOpen] = useState<string | null>("chatrix");
  const reduce = useReducedMotion();

  return (
    <section
      id="work"
      data-chapter="work"
      aria-labelledby="work-title"
      className="container-page flex flex-col gap-6 pt-18 pb-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 id="work-title" className="display-section text-ink">
          <RevealText>Shipped</RevealText>
        </h2>
        <p className="type-small max-w-[420px] text-muted">
          The featured build comes first, with how it works inside. The four bars show how far down the stack each
          project goes.
        </p>
      </div>

      <Featured />

      <h3 className="type-item mt-10 text-ink">More work</h3>
      <RiseGroup as="ol" className="border-t border-rule">
        {projects.map((p, i) => {
          const isOpen = open === p.slug;
          const panelId = `work-${p.slug}-panel`;
          return (
            <li
              key={p.slug}
              id={`work-${p.slug}`}
              className={cn("scroll-mt-28 border-b border-line transition-colors duration-300", isOpen && "bg-row-open")}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : p.slug)}
                  className={cn(
                    "focus-ring flex w-full cursor-pointer items-start gap-x-4 px-4 py-6 text-left text-ink transition-colors duration-300 sm:gap-x-6",
                    !isOpen && "hover:bg-row-hover",
                  )}
                >
                  <span className="type-mono w-8 shrink-0 pt-2 text-muted sm:w-10">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-6 gap-y-2">
                    <span className="type-row flex-[1_1_220px]">{p.title}</span>
                    <span className="type-body-sm min-w-0 flex-[2_1_300px] font-normal text-muted">{p.what}</span>
                    <DepthBars depth={p.depth} />
                  </span>
                  <span className="pt-1">
                    <Sign open={isOpen} />
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="panel"
                    id={panelId}
                    initial={{ opacity: 0, y: reduce ? 0 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="flex flex-wrap items-start gap-x-10 gap-y-6 px-4 pb-8"
                  >
                    {p.image ? (
                      <div className="relative aspect-[16/9] min-w-0 flex-[3_1_520px] overflow-hidden rounded-md shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                        <Image
                          src={p.image.src}
                          alt={p.image.alt}
                          fill
                          sizes="(min-width: 1024px) 720px, 100vw"
                          className="object-cover object-[left_top]"
                        />
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-3">
                      <p className="type-body-lg text-ink">{p.detail}</p>
                      <p className="type-small text-muted">Built with {p.stack}</p>
                      {p.live || p.code ? (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                          {p.live ? (
                            <a
                              href={p.live}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="focus-ring type-body-sm inline-flex min-h-11 items-center rounded-sm font-semibold text-ink underline decoration-lamp decoration-2 underline-offset-[6px]"
                            >
                              Visit the site<span className="sr-only">: {p.title}, opens in a new tab</span>
                            </a>
                          ) : null}
                          {p.code ? (
                            <a
                              href={p.code}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="focus-ring type-body-sm inline-flex min-h-11 items-center rounded-sm font-semibold text-ink underline decoration-line decoration-2 underline-offset-[6px] transition-colors hover:decoration-rule"
                            >
                              Read the code<span className="sr-only">: {p.title} on GitHub, opens in a new tab</span>
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </RiseGroup>
    </section>
  );
}
