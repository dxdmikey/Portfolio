"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { motion } from "motion/react";
import type { Accent } from "@/types/content";
import type { DiscoveryId } from "@/content/discoveries";
import { accentText } from "@/components/ui/accent";
import { sideQuestsCopy } from "@/content/side-quests";
import { asteroidRows } from "@/game/belt/asteroid-art";
import { fracture } from "@/game/belt/fracture";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useGame } from "@/providers/game-provider";
import { cn } from "@/lib/cn";
import { AsteroidShards, RockArt } from "./asteroid-shards";

interface AsteroidProps {
  seed: number;
  label: string;
  hint: string;
  discovery: DiscoveryId;
  accent: Accent;
  cracked: boolean;
  onCrack: () => void;
  onReform: () => void;
}

/**
 * Pixel asteroid. Click: it cracks into its own shards (a dust puff and a light shake),
 * then the briefing opens. "Re-form" flies the shards back home.
 */
export function Asteroid({
  seed,
  label,
  hint,
  discovery,
  accent,
  cracked,
  onCrack,
  onReform,
}: AsteroidProps) {
  const reduced = useReducedMotion();
  const { bus, sfx } = useGame();
  const { trigger } = useDiscover(discovery, { accent, fx: "smoke", sound: "crack" });
  const rows = useMemo(() => asteroidRows(seed), [seed]);
  const shards = useMemo(() => fracture(rows, seed), [rows, seed]);
  const [reforming, setReforming] = useState(false);
  const showShards = !reduced && (cracked || reforming);

  const crack = (e: MouseEvent<HTMLButtonElement>) => {
    if (reforming) return;
    trigger(e);
    const box = e.currentTarget.getBoundingClientRect();
    bus.emit({
      type: "fx",
      kind: "shake",
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
      accent,
    });
    onCrack();
  };
  const reform = () => {
    sfx.play("power-up");
    if (!reduced) setReforming(true);
    onReform();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <motion.button
          type="button"
          onClick={crack}
          disabled={cracked}
          aria-label={`${label}. ${hint}`}
          animate={{ opacity: cracked || reforming ? 0 : 1 }}
          transition={{ duration: 0 }}
          whileHover={reduced || cracked ? undefined : { rotate: 6, scale: 1.05 }}
          className="block size-40 cursor-pointer sm:size-52"
        >
          <RockArt rows={rows} accent={accent} />
        </motion.button>
        {showShards ? (
          <AsteroidShards
            key={cracked ? "break" : "reform"}
            shards={shards}
            accent={accent}
            reverse={!cracked}
            onDone={cracked ? undefined : () => setReforming(false)}
          />
        ) : null}
      </div>
      <p className={cn("font-pixel text-px-xs text-center uppercase", accentText[accent])}>
        {label}
      </p>
      {cracked ? (
        <button
          type="button"
          onClick={reform}
          className="font-pixel text-px-xs border-grid text-dust hover:border-plasma hover:text-plasma min-h-11 cursor-pointer border-2 px-4 uppercase"
        >
          {sideQuestsCopy.belt.reform}
        </button>
      ) : (
        <p className="text-dust text-sm">{hint}</p>
      )}
    </div>
  );
}
