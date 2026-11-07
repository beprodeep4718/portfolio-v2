import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

const base =
  "focus-ring inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-sm px-5 whitespace-nowrap " +
  "type-body-sm font-semibold transition-[transform,background-color,color,border-color] duration-300 ease-smooth " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  /* Ink on paper in light mode, lamp on night in dark mode */
  primary: "bg-btn text-btn-ink hover:bg-btn-hover",
  secondary: "border border-line text-ink hover:border-rule",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

type Common = { variant?: Variant; children: ReactNode; className?: string };

export function ButtonLink({ variant, className, children, ...props }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, className)} {...props}>
      {children}
    </a>
  );
}

export function Button({
  variant,
  className,
  children,
  type = "button",
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...props}>
      {children}
    </button>
  );
}
