"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { refineryCopy } from "@/content/refinery";
import { cn } from "@/lib/cn";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { stageId } from "@/game/refinery/levels";
import { SLA_BUDGET, multiplierFor } from "@/game/refinery/scoring";
import type { ShiftState } from "@/game/refinery/shift";

const { hud, stages } = refineryCopy;
const POP_FROM = 1.8;
const POP_S = 0.3;
const HOT_MULTIPLIER = 3;

interface ShiftHudProps {
  state: ShiftState;
  reducedMotion: boolean;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-pixel text-px-xs text-dust uppercase">{label}</dt>
      <dd className="font-pixel text-px-sm text-starlight">{children}</dd>
    </div>
  );
}

/** Level, record count, score, streak multiplier and SLA budget pips. */
export function ShiftHud({ state, reducedMotion }: ShiftHudProps) {
  const { stats, stage, batch, cursor, phase } = state;
  const multiplier = multiplierFor(stats.streak);
  const left = Math.max(0, SLA_BUDGET - stats.breaches);
  const total = batch?.records.length ?? 0;
  const pop = reducedMotion ? undefined : { scale: [POP_FROM, 1] };
  return (
    <dl className="border-grid bg-nebula-2 grid grid-cols-2 gap-x-4 gap-y-3 border-2 px-4 py-3 sm:grid-cols-4">
      <Stat label={stages[stageId(stage)].tag}>
        {phase === "running" && total > 0 ? hud.record(Math.min(cursor + 1, total), total) : stages[stageId(stage)].name}
      </Stat>
      <Stat label={hud.score}>
        <motion.span key={stats.score} className="text-coin inline-block" animate={pop} transition={{ duration: POP_S }}>
          {stats.score}
        </motion.span>
      </Stat>
      <Stat label={hud.streak}>
        <span className="sr-only">{hud.multiplierAria(multiplier)}</span>
        <span className="inline-flex items-center gap-2" aria-hidden>
          <PixelIcon
            name="bolt"
            size={14}
            className={cn(multiplier >= HOT_MULTIPLIER ? "text-coin" : multiplier > 1 ? "text-xp" : "text-dust")}
          />
          <motion.span
            key={multiplier}
            className={cn("inline-block", multiplier > 1 ? "text-xp" : "text-starlight")}
            animate={pop}
            transition={{ duration: POP_S }}
          >
            ×{multiplier}
          </motion.span>
        </span>
      </Stat>
      <Stat label={hud.sla}>
        <span className="inline-flex gap-1.5" role="img" aria-label={hud.slaAria(left, SLA_BUDGET)}>
          {Array.from({ length: SLA_BUDGET }, (_, i) => (
            <span key={i} className={cn("size-3.5 border-2", i < left ? "border-xp bg-xp" : "border-danger bg-transparent")} />
          ))}
        </span>
      </Stat>
    </dl>
  );
}
