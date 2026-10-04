"use client";

import { motion } from "motion/react";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { debriefCopy } from "@/content/debriefs";
import type { QuestDebrief } from "@/types/content";
import { CountUp } from "./count-up";

const STAGGER_S = 0.1;

/**
 * Results as loot drops: tiles pop in one by one and their numbers count up.
 * Empty loot shows the in-progress state.
 */
export function LootGrid({ loot, inProgress }: Pick<QuestDebrief, "loot" | "inProgress">) {
  const reduced = useReducedMotion();
  if (loot.length === 0) {
    return (
      <p className="text-dust flex items-center gap-3">
        <PixelIcon name="rocket" size={20} className="text-plasma" />
        <span>
          <span className="font-pixel text-px-xs text-plasma mr-2 uppercase">
            {debriefCopy.inProgressTag}
          </span>
          {inProgress ?? debriefCopy.lootEmpty}
        </span>
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {loot.map((l, i) => (
        <motion.li
          key={l.label}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 20, delay: i * STAGGER_S }}
          className="border-coin bg-nebula border-2 p-3"
        >
          <p className="font-pixel text-px-sm text-coin leading-relaxed">
            <CountUp value={l.value} />
          </p>
          <p className="text-dust mt-1 text-sm">{l.label}</p>
        </motion.li>
      ))}
    </ul>
  );
}
