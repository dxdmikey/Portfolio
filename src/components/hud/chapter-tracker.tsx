"use client";

import { useCallback, useState } from "react";
import { chapters, type ChapterId } from "@/content/story";
import { cn } from "@/lib/cn";
import { useSfx } from "@/hooks/use-sfx";
import { useVisits } from "@/hooks/use-visits";
import { useGame } from "@/providers/game-provider";
import { useScrollSpy } from "./use-scroll-spy";

const IDS: readonly ChapterId[] = chapters.map((c) => c.id);
const FIRST = chapters[0];

/**
 * Where am I in the voyage: current chapter name + one clickable pip per chapter
 * (filled once visited). The label and pips follow the scroll live; the bus `chapter:enter`
 * (NOVA, star chart) and the screen-reader announcement wait until scrolling settles.
 */
export function ChapterTracker() {
  const { bus } = useGame();
  const [settled, setSettled] = useState<ChapterId | null>(null);
  const announce = useCallback(
    (chapter: ChapterId) => {
      setSettled(chapter);
      bus.emit({ type: "chapter:enter", chapter });
    },
    [bus],
  );
  const active = useScrollSpy(IDS, announce);
  const { visited } = useVisits();
  const { play } = useSfx();
  const current = chapters.find((c) => c.id === active) ?? FIRST;
  const spoken = chapters.find((c) => c.id === settled);

  return (
    <nav aria-label="Chapters" className="flex min-w-0 flex-1 items-center gap-3">
      <p
        aria-hidden
        className="font-pixel text-px-xs text-coin hidden min-w-0 truncate uppercase sm:block"
      >
        <span>▶ </span>
        <span className="text-dust">CH{current.number}</span> {current.label}
      </p>
      <p aria-live="polite" className="sr-only">
        {spoken ? `CH${spoken.number} ${spoken.label}` : ""}
      </p>
      {/* Phones: pips share the row's spare width (≥24px each, 44px tall); sm+: fixed 32px pips. */}
      <ol className="flex min-w-0 flex-1 items-center sm:ml-auto sm:flex-none sm:shrink-0 sm:gap-1">
        {chapters.map((c) => {
          const isCurrent = c.id === current.id;
          return (
            <li key={c.id} className="min-w-0 flex-1 sm:flex-none">
              <a
                href={`#${c.id}`}
                onClick={() => play("blip")}
                aria-label={`Chapter ${c.number}: ${c.label}`}
                aria-current={isCurrent ? "step" : undefined}
                title={`CH${c.number} ${c.label}`}
                className="group grid h-11 w-full min-w-6 place-items-center sm:w-8"
              >
                <span
                  aria-hidden
                  className={cn(
                    "block size-2.5 border-2 transition-all duration-150 group-hover:scale-125 sm:size-3",
                    isCurrent
                      ? "border-coin bg-coin scale-125"
                      : visited.has(c.id)
                        ? "border-plasma bg-plasma"
                        : "border-grid group-hover:border-plasma bg-transparent",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
