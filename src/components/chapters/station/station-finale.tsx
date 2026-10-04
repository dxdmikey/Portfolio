"use client";

import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { stationCopy, stationDemo, stationSyncStages } from "@/content/station";
import { activeStage, type SyncState } from "@/game/station/sync";

const POP = { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } };
const POP_SPRING = { type: "spring", stiffness: 420, damping: 18 } as const;

interface StationFinaleProps {
  sync: SyncState;
  animate: boolean;
  onRun: (event: MouseEvent<HTMLButtonElement>) => void;
}

function runLabel(sync: SyncState): string {
  const stage = activeStage(sync, stationSyncStages);
  if (stage) return stationCopy.sync.stage(stage.id);
  return sync.phase === "done" ? stationCopy.sync.rerun : stationCopy.sync.run;
}

/** Before 8/8: a dim teaser of what the finale unlocks (so the log never sits next to a hole). */
export function FinaleTeaser({ online, total }: { online: number; total: number }) {
  return (
    <div className="border-grid text-dust flex flex-col items-center justify-center gap-3 border-2 border-dashed p-5 text-center lg:min-h-full">
      <PixelIcon name="lock" size={16} />
      <p className="font-pixel text-px-xs uppercase">{stationCopy.sync.run}</p>
      <p className="max-w-[40ch] text-sm">{stationCopy.sync.teaser(total - online)}</p>
    </div>
  );
}

/** 8/8: "Station online", then the "Run first sync" demo and its result. */
export function StationFinale({ sync, animate, onRun }: StationFinaleProps) {
  const running = sync.phase === "running";
  return (
    <motion.div
      initial={animate ? POP.initial : false}
      animate={POP.animate}
      transition={POP_SPRING}
    >
      <PixelCard
        accent="xp"
        className="flex flex-col items-center gap-3 p-5 text-center shadow-[6px_6px_0_0_var(--xp)]"
      >
        <p className="font-pixel text-px-md text-xp sm:text-px-lg text-glow flex items-center gap-3 uppercase">
          <PixelIcon name="star" size={16} />
          {stationCopy.onlineBanner}
          <PixelIcon name="star" size={16} />
        </p>
        <p className="text-dust max-w-[60ch] text-sm">{stationCopy.onlineNote}</p>
        {/* aria-disabled (not disabled) so keyboard focus stays put while the batch runs; extra clicks are ignored. */}
        <PixelButton
          variant="coin"
          onClick={onRun}
          aria-disabled={running || undefined}
          aria-busy={running || undefined}
          className="mt-1 aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          <PixelIcon name="bolt" size={12} />
          {runLabel(sync)}
        </PixelButton>
        {sync.phase === "done" ? (
          <motion.div
            initial={animate ? POP.initial : false}
            animate={POP.animate}
            transition={POP_SPRING}
            className="border-coin flex flex-col items-center gap-1 border-2 border-dashed px-4 py-3"
          >
            <p className="font-pixel text-px-sm text-coin flex items-center gap-2 uppercase">
              <PixelIcon name="star" size={12} />
              {stationCopy.sync.doneBanner}
            </p>
            <p className="text-dust max-w-[56ch] text-sm">{stationCopy.sync.doneNote}</p>
            <span className="font-pixel text-px-xs bg-coin text-on-accent mt-1 px-2 py-1 uppercase">
              {stationDemo.tag}
            </span>
          </motion.div>
        ) : null}
      </PixelCard>
    </motion.div>
  );
}
