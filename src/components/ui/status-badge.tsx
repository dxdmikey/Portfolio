import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Accent } from "@/types/content";
import { accentBg } from "./accent";

/** Solid pixel badge, e.g. ACTIVE / COMPLETED / SIDE QUEST. */
export function StatusBadge({ accent, children, className }: { accent: Accent; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-pixel text-px-xs text-on-accent inline-block px-2 py-1 uppercase tracking-wider",
        accentBg[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}
