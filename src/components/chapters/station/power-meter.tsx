import { cn } from "@/lib/cn";
import { stationCopy } from "@/content/station";

/** One block per module: lime when online. Exposed as a meter to assistive tech. */
export function PowerMeter({ online, total }: { online: number; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-pixel text-px-xs text-dust uppercase">{stationCopy.meterLabel}</span>
        <span
          aria-live="polite"
          className={cn(
            "font-pixel text-px-xs uppercase",
            online === total ? "text-xp" : "text-coin",
          )}
        >
          {stationCopy.progress(online, total)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={stationCopy.meterLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={online}
        aria-valuetext={stationCopy.progress(online, total)}
        className="bg-void border-grid flex h-5 gap-[3px] border-2 p-[2px]"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-full flex-1 transition-colors duration-200",
              i < online ? "bg-xp" : "bg-grid/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
