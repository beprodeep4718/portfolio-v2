"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type State = "idle" | "copied" | "failed";

export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2400);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" onClick={copy} aria-describedby="copy-status">
        {state === "copied" ? <Check size={18} weight="bold" aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        {state === "copied" ? "Email copied" : "Copy email"}
      </Button>
      <p id="copy-status" role="status" aria-live="polite" className="type-small text-muted">
        {state === "failed"
          ? `Copy failed. Select ${email} and copy it by hand.`
          : state === "copied"
            ? `${email} is on your clipboard.`
            : email}
      </p>
    </div>
  );
}
