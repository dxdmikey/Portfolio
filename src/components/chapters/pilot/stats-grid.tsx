"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { animate } from "motion/react";
import { profile } from "@/content/profile";
import { pilotCopy, statNotes } from "@/content/pilot";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useGame } from "@/providers/game-provider";
import { accentText } from "@/components/ui/accent";
import { StatBar } from "@/components/ui/stat-bar";
import { cn } from "@/lib/cn";
import type { Stat } from "@/types/content";

const REFILL_S = 0.8;
/** A stat bar refilling: the charge-up sound, softened. */
const REFILL_SOUND = { volume: 0.6 } as const;

function StatButton({
  stat,
  active,
  onPick,
}: {
  stat: Stat;
  active: boolean;
  onPick: (id: string) => void;
}) {
  const [shown, setShown] = useState<number>(stat.value);
  const reduced = useReducedMotion();
  const { trigger } = useDiscover("stats", {
    accent: stat.accent,
    sound: "power-up",
    soundOptions: REFILL_SOUND,
  });
  const anim = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => anim.current?.stop(), []);

  const onClick = (e: MouseEvent<HTMLElement>) => {
    trigger(e);
    onPick(stat.id);
    anim.current?.stop();
    if (reduced) return;
    anim.current = animate(0, stat.value, {
      duration: REFILL_S,
      ease: "easeOut",
      onUpdate: setShown,
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "bg-void min-h-11 w-full cursor-pointer border-2 p-3 text-left transition-colors",
        active ? "border-coin" : "border-grid hover:border-dust",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-px-xs text-dust leading-relaxed">{stat.label}</span>
        <span className={cn("font-pixel text-px-sm", accentText[stat.accent])}>{stat.value}</span>
      </span>
      <StatBar
        value={shown}
        max={100}
        accent={stat.accent}
        label={stat.label}
        segmented
        className="mt-3"
      />
    </button>
  );
}

/** Six attributes. Clicking one refills its bar and has NOVA explain what it means in practice. */
export function StatsGrid() {
  const [picked, setPicked] = useState<string | null>(null);
  const { bus } = useGame();

  const onPick = (id: string) => {
    setPicked(id);
    const text = statNotes[id];
    if (text) bus.emit({ type: "nova:say", text });
  };

  const note = picked ? statNotes[picked] : undefined;
  return (
    <div>
      <h3 className="font-pixel text-px-sm text-dust mb-3 uppercase">{pilotCopy.statsHeading}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {profile.stats.map((s) => (
          <li key={s.id}>
            <StatButton stat={s} active={picked === s.id} onPick={onPick} />
          </li>
        ))}
      </ul>
      <p
        aria-live="polite"
        className="text-dust border-grid mt-3 min-h-11 border-2 border-dashed p-3 text-sm"
      >
        {note ?? pilotCopy.statsHint}
      </p>
    </div>
  );
}
