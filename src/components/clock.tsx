"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function subscribe(notify: () => void) {
  const id = window.setInterval(notify, 10_000);
  return () => window.clearInterval(id);
}

/** Local time in Jalpaiguri (IST), ticking client side only. */
export function Clock() {
  const time = useSyncExternalStore(
    subscribe,
    () => format.format(new Date()),
    () => "",
  );
  return <time suppressHydrationWarning>{time || "--:--"}</time>;
}
