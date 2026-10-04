import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small chip for tech tags and traits. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("border-grid bg-void text-dust inline-block border px-2 py-0.5 text-sm", className)}>
      {children}
    </span>
  );
}
