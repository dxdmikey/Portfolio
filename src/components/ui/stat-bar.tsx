import { cn } from "@/lib/cn";
import type { Accent } from "@/types/content";
import { accentBg } from "./accent";

interface StatBarProps {
  value: number;
  max?: number;
  accent: Accent;
  label: string;
  /** Segmented 8-bit look (10 blocks) instead of a smooth fill. */
  segmented?: boolean;
  className?: string;
}

const SEGMENTS = 10;

/** Accessible progress bar — exposes value to assistive tech via role="meter". */
export function StatBar({ value, max = 100, accent, label, segmented = false, className }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("bg-void border-grid h-3 w-full border", className)}
    >
      {segmented ? (
        <div className="flex h-full gap-[2px] p-[1px]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={cn("h-full flex-1", i < Math.round(pct / SEGMENTS) ? accentBg[accent] : "bg-transparent")}
            />
          ))}
        </div>
      ) : (
        <div className={cn("h-full", accentBg[accent])} style={{ width: `${pct}%` }} />
      )}
    </div>
  );
}
