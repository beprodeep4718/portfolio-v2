"use client";

import { useSyncExternalStore } from "react";
import { THEME_EVENT, THEME_KEY } from "@/lib/theme-script";

export type Theme = "light" | "dark";

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(notify: () => void) {
  window.addEventListener(THEME_EVENT, notify);
  return () => window.removeEventListener(THEME_EVENT, notify);
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage can be blocked; the choice still applies to this visit */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
