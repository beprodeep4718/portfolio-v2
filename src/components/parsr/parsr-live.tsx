"use client";

import { useEffect, useRef } from "react";
import { mountParsr } from "./live.generated";

/** Starts the Parsr figure that sits beside it in the server HTML */
export function ParsrLive() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;
    return mountParsr(root);
  }, []);

  return <span ref={anchor} hidden />;
}
