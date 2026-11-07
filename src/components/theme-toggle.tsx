"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { setTheme, useTheme } from "@/components/theme";
import { cn } from "@/lib/cn";

export function ThemeToggle() {
  const theme = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="focus-ring relative flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors duration-300 hover:bg-row-hover active:scale-[0.98]"
    >
      <Sun
        size={18}
        aria-hidden="true"
        className={cn(
          "absolute transition-[transform,opacity] duration-500 ease-smooth",
          dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
        )}
      />
      <Moon
        size={18}
        aria-hidden="true"
        className={cn(
          "absolute transition-[transform,opacity] duration-500 ease-smooth",
          dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
    </button>
  );
}
