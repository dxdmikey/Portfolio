import { cn } from "@/lib/cn";
import { stationDemo } from "@/content/station";

/** Bars grow one after another (ms); the global reduced-motion CSS makes them appear at once. */
const GROW_MS = 280;
const STAGGER_MS = 70;
const PERCENT = 100;

/**
 * A tiny pixel bar chart of the demo shape (relative heights, not measurements). Decorative:
 * whoever shows it also says "Demo data" in text.
 */
export function DemoChart({ drawn, className }: { drawn: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "border-grid flex items-end gap-[2px] border-b-2 border-l-2 px-[2px]",
        className,
      )}
    >
      {stationDemo.bars.map((bar, i) => (
        <span
          key={bar.label}
          style={{
            height: `${bar.height * PERCENT}%`,
            transitionDuration: `${GROW_MS}ms`,
            transitionDelay: drawn ? `${i * STAGGER_MS}ms` : "0ms",
          }}
          className={cn(
            "block flex-1 origin-bottom transition-transform ease-out",
            drawn ? "bg-coin scale-y-100" : "bg-grid scale-y-[0.15]",
          )}
        />
      ))}
    </span>
  );
}
