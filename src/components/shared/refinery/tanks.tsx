"use client";

import { motion } from "motion/react";
import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";
import type { TankLevels } from "@/game/refinery/shift";
import type { Choice } from "@/game/refinery/types";

type TankId = "bronze" | "silver" | "gold" | "quarantine";

const TANKS: Record<TankId, { border: string; fill: string; text: string }> = {
  bronze: { border: "border-dust", fill: "bg-dust", text: "text-dust" },
  silver: { border: "border-xp", fill: "bg-xp", text: "text-xp" },
  gold: { border: "border-coin", fill: "bg-coin", text: "text-coin" },
  quarantine: { border: "border-danger", fill: "bg-danger", text: "text-danger" },
};
const GAUGE_TICKS = [1, 2, 3, 4] as const;
const DRIP_FALL_PX = 40;
const DRIP_S = 0.5;

interface TankProps {
  id: TankId;
  count: number;
  total: number;
  /** Changes every time a record lands in (or leaves) this tank; null = no drip. */
  drip: number | null;
  reducedMotion: boolean;
  /** Gold fills after Silver drains. */
  delayed?: boolean;
}

function Tank({ id, count, total, drip, reducedMotion, delayed = false }: TankProps) {
  const t = TANKS[id];
  const level = total === 0 ? 0 : count / total;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("bg-void relative h-20 w-full max-w-20 border-2 sm:h-28 lg:h-36", t.border)}>
        <div
          className={cn(
            "absolute inset-0 origin-bottom opacity-80 transition-transform duration-500",
            t.fill,
            delayed && "delay-500 duration-700",
          )}
          style={{ transform: `scaleY(${level})` }}
        />
        {GAUGE_TICKS.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="border-grid absolute right-0 w-1/3 border-t-2"
            style={{ bottom: `${(tick / (GAUGE_TICKS.length + 1)) * 100}%` }}
          />
        ))}
        {drip !== null && !reducedMotion ? (
          <motion.span
            key={drip}
            aria-hidden
            className={cn("absolute top-0 left-1/2 size-2.5 -translate-x-1/2", t.fill)}
            initial={{ y: -DRIP_FALL_PX / 2, opacity: 1 }}
            animate={{ y: DRIP_FALL_PX, opacity: 0 }}
            transition={{ duration: DRIP_S, ease: "easeIn" }}
          />
        ) : null}
      </div>
      {/* Body font on phones: "QUARANTINE" in the pixel font is wider than a quarter of 375px. */}
      <p className={cn("text-center text-xs font-semibold uppercase sm:font-pixel sm:text-px-xs sm:font-normal", t.text)}>
        {refineryCopy.tanks.labels[id]}
      </p>
      <p className="font-pixel text-px-sm text-starlight">{count}</p>
    </div>
  );
}

interface TanksProps {
  levels: TankLevels;
  gold: boolean;
  /** Number of records judged so far and where the last one went (null = slipped into Silver). */
  answered: number;
  lastChoice: Choice | null | undefined;
  reducedMotion: boolean;
}

/** Bronze → Silver → Gold (on a winning shift), plus a quarantine bin. Fills use transform only (scaleY). */
export function Tanks({ levels, gold, answered, lastChoice, reducedMotion }: TanksProps) {
  const drip = answered > 0 ? answered : null;
  const summary = refineryCopy.tanks.summary({
    bronze: levels.bronze,
    silver: gold ? 0 : levels.silver,
    gold: gold ? levels.silver : 0,
    quarantine: levels.quarantine,
    total: levels.total,
  });
  return (
    <div role="img" aria-label={summary} className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-2">
      <Tank
        id="bronze"
        count={levels.bronze}
        total={levels.total}
        drip={null}
        reducedMotion={reducedMotion}
      />
      <Tank
        id="silver"
        count={gold ? 0 : levels.silver}
        total={levels.total}
        drip={lastChoice === "promote" || lastChoice === null ? drip : null}
        reducedMotion={reducedMotion}
      />
      <Tank
        id="gold"
        count={gold ? levels.silver : 0}
        total={levels.total}
        drip={null}
        reducedMotion={reducedMotion}
        delayed
      />
      <Tank
        id="quarantine"
        count={levels.quarantine}
        total={levels.total}
        drip={lastChoice === "quarantine" ? drip : null}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
