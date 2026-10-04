import { useId } from "react";
import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";

const { relaxed: copy } = refineryCopy;

interface RelaxedToggleProps {
  relaxed: boolean;
  onChange: (relaxed: boolean) => void;
}

/** Switch for relaxed mode (no timers). Usable at any point in the shift. */
export function RelaxedToggle({ relaxed, onChange }: RelaxedToggleProps) {
  const hintId = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        aria-pressed={relaxed}
        aria-describedby={hintId}
        onClick={() => onChange(!relaxed)}
        className={cn(
          "font-pixel text-px-xs inline-flex min-h-11 cursor-pointer items-center gap-3 border-2 px-3 py-2 uppercase",
          relaxed ? "border-xp text-xp" : "border-grid text-dust hover:border-plasma hover:text-plasma",
        )}
      >
        {copy.label}
        <span aria-hidden className={cn("border-2 px-1.5 py-0.5", relaxed ? "border-xp bg-xp text-on-accent" : "border-grid")}>
          {relaxed ? copy.on : copy.off}
        </span>
      </button>
      <p id={hintId} className="text-dust text-sm">
        {copy.hint}
      </p>
    </div>
  );
}
