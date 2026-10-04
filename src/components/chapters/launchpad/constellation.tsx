"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { launchpad } from "@/content/launchpad";
import { useDiscover } from "@/hooks/use-discover";
import { useGame } from "@/providers/game-provider";
import { cn } from "@/lib/cn";

const STARS = launchpad.constellation.stars;
const LINE_POINTS = STARS.map((s) => `${s.x},${s.y}`).join(" ");
/** Degree of the first lit star (above the ping root), so the run sits mid-register. */
const STAR_DEGREE_OFFSET = 2;

/**
 * A hidden constellation: five slightly brighter stars. Light them all (any order) and
 * the lines draw in, revealing "The Lakehouse". Lives in its own box so the stars never
 * sit on top of the hero text.
 */
export function Constellation({ className }: { className?: string }) {
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  const { trigger } = useDiscover("constellation", { accent: "coin", fx: "confetti" });
  const { bus, sfx } = useGame();
  const complete = lit.size === STARS.length;

  const light = (i: number) => (e: MouseEvent<HTMLButtonElement>) => {
    if (complete) {
      trigger(e);
      return;
    }
    const next = new Set(lit).add(i);
    setLit(next);
    if (next.size === STARS.length) {
      trigger(e);
    } else {
      // Each star rings one note higher on the music's scale; the last one completes the chord.
      sfx.play("ping", { degree: next.size + STAR_DEGREE_OFFSET });
      const r = e.currentTarget.getBoundingClientRect();
      bus.emit({
        type: "fx",
        kind: "ripple",
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        accent: "coin",
      });
    }
  };

  return (
    <div className={cn("relative h-40 w-64 sm:h-48 sm:w-72", className)}>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-500",
          complete ? "opacity-100" : "opacity-0",
        )}
      >
        <polyline
          points={LINE_POINTS}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
          className={cn("text-coin", complete && "constellation-line")}
        />
      </svg>
      {STARS.map((s, i) => {
        const on = lit.has(i);
        return (
          <button
            key={`${s.x}-${s.y}`}
            type="button"
            aria-label={`${launchpad.constellation.starLabel} ${i + 1}`}
            aria-pressed={on}
            onClick={light(i)}
            style={
              { left: `${s.x}%`, top: `${s.y}%`, "--twinkle-delay": `${i * 0.7}s` } as CSSProperties
            }
            className="group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
          >
            <span
              aria-hidden
              className={cn(
                "mystery-star block transition-transform duration-200 group-hover:scale-150",
                on ? "bg-coin size-[8px] scale-150" : "bg-starlight size-[6px]",
              )}
            />
          </button>
        );
      })}
      <p
        aria-live="polite"
        className={cn(
          "font-pixel text-px-xs text-coin absolute inset-x-0 -bottom-6 text-center leading-relaxed transition-opacity duration-500",
          complete ? "opacity-100" : "opacity-0",
        )}
      >
        {complete ? (
          <>
            {launchpad.constellation.name} <span aria-hidden>✦</span>{" "}
            {launchpad.constellation.caption}
          </>
        ) : null}
      </p>
    </div>
  );
}
