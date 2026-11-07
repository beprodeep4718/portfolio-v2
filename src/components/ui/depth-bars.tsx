import { cn } from "@/lib/cn";

/** Four bars: how far down the stack (interface to infrastructure) a project goes */
export function DepthBars({ depth, className }: { depth: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`Reaches ${depth} of 4 stack layers`}
      className={cn("inline-flex shrink-0 gap-1 self-center", className)}
    >
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn("h-1.5 w-3.5 rounded-[1px] transition-colors duration-300", n <= depth ? "bg-bar" : "bg-bar-off")}
        />
      ))}
    </span>
  );
}
