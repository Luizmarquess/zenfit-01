import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function ZenFitMark({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", className)}
      style={{ background: "var(--gradient-hero)" }}
    >
      <Leaf className="h-1/2 w-1/2 text-white" strokeWidth={2.2} />
    </div>
  );
}

export function ZenFitWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-tight", className)}>
      Zen<span className="text-primary">Fit</span>
    </span>
  );
}
