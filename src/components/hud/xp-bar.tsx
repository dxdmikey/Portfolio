"use client";

import { sections } from "@/content/navigation";
import { computeXp } from "@/game/progress/visits";
import { useDiscoveryCount } from "@/hooks/use-discover";
import { useVisits } from "@/hooks/use-visits";

const PERCENT = 100;
const fmt = new Intl.NumberFormat("en-US");

/** EXP = chapters visited + discoveries found. Grows as the visitor plays the page. */
export function XpBar() {
  const { visited } = useVisits();
  const { found, total } = useDiscoveryCount();

  // Derived from the reactive snapshots (not the engines directly) so SSR and hydration agree.
  const { current, max } = computeXp({
    chaptersVisited: visited.size,
    chaptersTotal: sections.length,
    discoveriesFound: found,
    discoveriesTotal: total,
  });
  const ratio = max === 0 ? 0 : Math.min(current / max, 1);

  return (
    <div className="font-pixel text-px-xs sm:text-px-sm flex items-center gap-3">
      <span className="text-xp shrink-0" aria-hidden>
        EXP
      </span>
      <div
        role="progressbar"
        aria-label="Experience points"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${fmt.format(current)} of ${fmt.format(max)} XP`}
        className="border-grid bg-void h-4 min-w-0 flex-1 border-2 p-[2px]"
      >
        <div
          className="bg-xp xp-notches h-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${ratio * PERCENT}%` }}
        />
      </div>
      <span className="text-xp shrink-0 tabular-nums" aria-hidden>
        {fmt.format(current)} / {fmt.format(max)} XP
      </span>
    </div>
  );
}
