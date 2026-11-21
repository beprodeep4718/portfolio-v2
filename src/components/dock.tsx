"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Briefcase,
  ChatCircle,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  Moon,
  Pulse,
  Stack as StackIcon,
  Sun,
  type Icon,
} from "@phosphor-icons/react";
import { nav, site } from "@/content/site";
import { setTheme, useTheme } from "@/components/theme";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Item size at rest, at its largest right under the cursor, and how far either side the growth reaches */
const BASE = 44;
const PEAK = 70;
const REACH = 140;
const SPRING = { mass: 0.1, stiffness: 170, damping: 14 };

const sectionIcons: Record<string, Icon> = { work: Briefcase, stack: StackIcon, now: Pulse, contact: ChatCircle };
const socialIcons: Record<(typeof site.socials)[number]["icon"], Icon> = {
  github: GithubLogo,
  linkedin: LinkedinLogo,
  instagram: InstagramLogo,
};

const sections = [
  { label: "Home", href: "#top", id: "top" },
  ...nav,
  { label: "Contact", href: "#contact", id: "contact" },
];

/** Grows with the cursor's nearness, on a spring so it settles rather than snaps */
function useDockSize(mouseX: MotionValue<number>, ref: RefObject<HTMLElement | null>) {
  const target = useTransform(mouseX, (x) => {
    const el = ref.current;
    if (!el || !Number.isFinite(x)) return BASE;
    const b = el.getBoundingClientRect();
    const d = Math.abs(x - (b.left + b.width / 2));
    return d < REACH ? BASE + ((PEAK - BASE) * (1 + Math.cos((Math.PI * d) / REACH))) / 2 : BASE;
  });
  return useSpring(target, SPRING);
}

type ItemProps = {
  mouseX: MotionValue<number>;
  label: string;
  tips: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  active?: boolean;
  lamp?: boolean;
  className?: string;
  children?: ReactNode;
};

function DockItem({ mouseX, label, tips, href, external, onClick, active, lamp, className, children }: ItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [tip, setTip] = useState(false);
  const size = useDockSize(mouseX, ref);
  const glyph = useTransform(size, (s) => s * (lamp ? 0.3 : 0.45));

  const control = cn(
    "focus-ring relative flex items-center justify-center rounded-full transition-colors duration-300 hover:bg-row-hover",
    active ? "text-ink" : "text-muted hover:text-ink",
  );
  const inner = lamp ? (
    <motion.span aria-hidden="true" className="lamp-dot" style={{ width: glyph, height: glyph }} />
  ) : (
    <motion.span aria-hidden="true" className="relative block" style={{ width: glyph, height: glyph }}>
      {children}
    </motion.span>
  );

  return (
    <li
      ref={ref}
      className={cn("relative flex", className)}
      onMouseEnter={() => tips && setTip(true)}
      onMouseLeave={() => setTip(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && setTip(true)}
      onBlur={() => setTip(false)}
    >
      {href ? (
        <motion.a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          aria-label={label}
          aria-current={active ? "location" : undefined}
          className={control}
          style={{ width: size, height: size }}
        >
          {inner}
        </motion.a>
      ) : (
        <motion.button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(control, "cursor-pointer")}
          style={{ width: size, height: size }}
        >
          {inner}
        </motion.button>
      )}

      <AnimatePresence>
        {tip ? (
          <motion.span
            aria-hidden="true"
            className="type-mono pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-md bg-ink px-2.5 py-1 text-[12px] leading-[1.4] whitespace-nowrap text-bg"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* The lamp marks the section you are in */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lamp shadow-[0_0_6px_rgba(255,122,26,0.9),0_0_14px_rgba(255,122,26,0.5)] transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </li>
  );
}

function Divider({ className }: { className?: string }) {
  return <li aria-hidden="true" className={cn("mx-0.5 h-6.5 w-px self-center bg-line md:mx-1", className)} />;
}

/**
 * The site's navigation: a dock floating at the foot of the screen. On a
 * mouse the icons grow as the cursor passes and name themselves; a lamp dot
 * sits under the section you are reading. Phones get the sections and the
 * theme only, since the socials are also in Say hello.
 */
export function Dock() {
  const [active, setActive] = useState<string | null>(null);
  const [fine, setFine] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const mouseX = useMotionValue(Infinity);
  const theme = useTheme();
  const dark = theme === "dark";

  /* Mark the section in the middle of the viewport */
  useEffect(() => {
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        setActive(sections.find((s) => visible.get(s.id))?.id ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  /* Growing and tooltips need a real hover */
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const magnify = fine && !reduce;

  return (
    <nav aria-label="Main" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center print:hidden md:bottom-6">
      <motion.ul
        className="pointer-events-auto flex h-[58px] items-end rounded-full border border-line bg-dock p-1.5 shadow-[var(--dock-shadow)] backdrop-blur-xl backdrop-saturate-150 md:h-[62px] md:gap-1.5 md:p-2"
        onMouseMove={(e) => magnify && mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ opacity: 0, y: reduce ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
      >
        {sections.map((s) => {
          const SectionIcon = sectionIcons[s.id];
          return (
            <DockItem
              key={s.id}
              mouseX={mouseX}
              label={s.label}
              tips={fine}
              href={s.href}
              active={active === s.id}
              lamp={s.id === "top"}
            >
              {SectionIcon ? <SectionIcon size="100%" /> : null}
            </DockItem>
          );
        })}

        <Divider />
        {site.socials.map((s) => {
          const SocialIcon = socialIcons[s.icon];
          return (
            <DockItem
              key={s.icon}
              mouseX={mouseX}
              label={s.label}
              tips={fine}
              href={s.href}
              external
              className="hidden md:flex"
            >
              <SocialIcon size="100%" />
            </DockItem>
          );
        })}
        <Divider className="hidden md:block" />

        <DockItem
          mouseX={mouseX}
          label={dark ? "Switch to light mode" : "Switch to dark mode"}
          tips={fine}
          onClick={() => setTheme(dark ? "light" : "dark")}
        >
          <Sun
            size="100%"
            className={cn(
              "absolute inset-0 transition-[transform,opacity] duration-500 ease-smooth",
              dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
            )}
          />
          <Moon
            size="100%"
            className={cn(
              "absolute inset-0 transition-[transform,opacity] duration-500 ease-smooth",
              dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
            )}
          />
        </DockItem>
      </motion.ul>
    </nav>
  );
}
