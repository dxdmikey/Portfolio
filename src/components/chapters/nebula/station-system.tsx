"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { accentBorder, accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";
import type { Satellite, Station } from "@/content/nebula";
import { OrbitSatellite, ORBIT_RX, ORBIT_RY } from "./orbit-satellite";
import { questById } from "./quest-lookup";
import { StationSprite } from "./station-sprite";

const ORBIT_S = 70;

export type Selection = { kind: "station" } | { kind: "sat"; id: string };

interface Props {
  station: Station;
  sats: readonly Satellite[];
  /** `null` when another system is selected. */
  selection: Selection | null;
  onSelect: (s: Selection) => void;
}

/** One station with its orbiting satellites. Orbits pause while hovered or focused. */
export function StationSystem({ station, sats, selection, onSelect }: Props) {
  const quest = questById(station.questId);
  const angle = useMotionValue(0);
  const ctrl = useRef<AnimationPlaybackControls | null>(null);
  const reduced = useReducedMotion();
  const { trigger } = useDiscover(station.discovery, { accent: station.accent, sound: "select" });

  useEffect(() => {
    if (reduced) return;
    const c = animate(angle, 360, { duration: ORBIT_S, ease: "linear", repeat: Infinity });
    ctrl.current = c;
    return () => c.stop();
  }, [reduced, angle]);

  const stationSelected = selection?.kind === "station";
  return (
    <div
      className="relative mx-auto h-72 w-full max-w-xs"
      onPointerEnter={() => ctrl.current?.pause()}
      onPointerLeave={() => ctrl.current?.play()}
      onFocus={() => ctrl.current?.pause()}
      onBlur={() => ctrl.current?.play()}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-1/2 rounded-full border-2 border-dashed opacity-40",
          accentBorder[station.accent],
        )}
        style={{ width: ORBIT_RX * 2, height: ORBIT_RY * 2, translate: "-50% -50%" }}
      />
      <button
        type="button"
        aria-pressed={stationSelected}
        aria-label={`${station.name}: ${quest.title}, ${quest.period}`}
        onClick={(e) => {
          trigger(e);
          onSelect({ kind: "station" });
        }}
        className={cn(
          "bg-void absolute top-1/2 left-1/2 flex min-h-11 w-36 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 border-2 p-2",
          stationSelected
            ? "border-coin shadow-[0_0_0_3px_var(--coin)]"
            : accentBorder[station.accent],
        )}
      >
        <StationSprite className={accentText[station.accent]} />
        <span aria-hidden className="font-pixel text-px-xs text-center leading-relaxed">
          {station.name}
        </span>
      </button>
      {sats.map((s) => {
        const sub = quest.subQuests?.[s.subIndex];
        if (!sub) return null;
        return (
          <OrbitSatellite
            key={s.id}
            sat={s}
            station={station}
            title={sub.title}
            angle={angle}
            selected={selection?.kind === "sat" && selection.id === s.id}
            onSelect={() => onSelect({ kind: "sat", id: s.id })}
          />
        );
      })}
    </div>
  );
}
