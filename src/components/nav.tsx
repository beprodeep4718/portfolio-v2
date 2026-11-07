"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { nav, site } from "@/content/site";
import { getLenis } from "@/components/motion/smooth-scroll";
import { Clock } from "@/components/clock";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP = 0.06;
const MAX_STAGGER = 0.4;

function scrollToHash(hash: string) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(hash, { offset: -80 });
  else document.querySelector(hash)?.scrollIntoView({ block: "start" });
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();

  const links = [...nav, { label: "Contact", href: "#contact", id: "contact" }];

  /* Mark the section in the middle of the viewport */
  useEffect(() => {
    const ids = links.map((l) => l.id);
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        setActive(ids.find((id) => visible.get(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lock = useCallback((locked: boolean) => {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    const lenis = getLenis();
    if (locked) lenis?.stop();
    else lenis?.start();
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    lock(false);
  }, [lock]);

  useEffect(() => {
    if (!open) return;
    lock(true);
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, lock, close]);

  const onMobileLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    close();
    requestAnimationFrame(() => scrollToHash(href));
  };

  const step = Math.min(STEP, MAX_STAGGER / links.length);

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md">
        <div className="container-page flex min-h-19 items-center justify-between gap-4 py-3">
          <a
            href="#top"
            className="focus-ring type-body-sm inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold tracking-tight text-ink"
          >
            {site.name}
            <span aria-hidden="true" className="lamp-dot size-[7px]" />
          </a>

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {links.map((item) => {
              const isActive = active === item.id;
              const isContact = item.id === "contact";
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "focus-ring type-small inline-flex min-h-11 items-center rounded-sm underline-offset-[6px] transition-colors duration-300",
                    isActive ? "text-ink underline decoration-lamp decoration-2" : "text-muted hover:text-ink",
                    isContact && "font-semibold text-ink",
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="type-mono hidden text-muted sm:inline">
              Jalpaiguri <Clock /> IST
            </span>
            <ThemeToggle />
            <button
              ref={toggleRef}
              type="button"
              className="focus-ring relative flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-row-hover active:scale-[0.98] md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => (open ? close() : setOpen(true))}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-500 ease-smooth",
                  open ? "translate-y-0 rotate-45" : "-translate-y-1",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-500 ease-smooth",
                  open ? "translate-y-0 -rotate-45" : "translate-y-1",
                )}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-bg/95 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: EASE } }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <nav aria-label="Mobile" className="container-page flex flex-1 flex-col justify-between pt-28 pb-10">
              <ul className="flex flex-col gap-1">
                {links.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * step }}
                  >
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={item.href}
                      onClick={(e) => onMobileLink(e, item.href)}
                      aria-current={active === item.id ? "location" : undefined}
                      className={cn(
                        "focus-ring display-section block rounded-sm py-2 transition-colors duration-300",
                        active === item.id ? "text-ink" : "text-muted hover:text-ink",
                      )}
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.p
                className="type-mono text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: MAX_STAGGER }}
              >
                Jalpaiguri <Clock /> IST, {site.coordinates}
              </motion.p>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
