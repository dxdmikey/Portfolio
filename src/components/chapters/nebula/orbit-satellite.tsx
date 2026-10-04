"use client";

import type { MouseEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useDiscover } from "@/hooks/use-discover";
import { accentBorder, accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";
import type { Station, Satellite } from "@/content/nebula";

const DEG = Math.PI / 180;
/** Half-width and half-height of the elliptical orbit, in px. Wide enough to clear the station box. */
export const ORBIT_RX = 130;
export const ORBIT_RY = 92;
/** Pills sway this many degrees either side of their resting angle (kept small so labels never collide). */
const SWAY_DEG = 18;
/** Sway cycles per full turn of the shared angle (one turn = the orbit period). */
const SWAY_CYCLES = 4;

interface Props {
  sat: Satellite;
  station: Station;
  title: string;
  angle: MotionValue<number>;
  selected: boolean;
  onSelect: (e: MouseEvent<HTMLElement>) => void;
}

/** A satellite pill that drifts back and forth along its station's orbit; `angle` (shared) drives the sway. */
export function OrbitSatellite({ sat, station, title, angle, selected, onSelect }: Props) {
  const theta = useTransform(
    angle,
    (a) => (sat.angle + Math.sin(a * SWAY_CYCLES * DEG) * SWAY_DEG) * DEG,
  );
  const x = useTransform(theta, (t) => Math.cos(t) * ORBIT_RX);
  const y = useTransform(theta, (t) => Math.sin(t) * ORBIT_RY);
  const { trigger } = useDiscover(sat.discovery, { accent: station.accent, sound: "blip" });

  return (
    <motion.div style={{ x, y }} className="absolute top-1/2 left-1/2 size-0">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${sat.label}: ${title}, sub-mission of ${station.name}`}
        onClick={(e) => {
          trigger(e);
          onSelect(e);
        }}
        className={cn(
          "bg-void shadow-pixel absolute top-0 left-0 flex min-h-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center border-2 px-3 whitespace-nowrap",
          selected ? "bg-nebula-2 border-coin" : accentBorder[station.accent],
        )}
      >
        <span
          aria-hidden
          className={cn(
            "font-pixel text-px-xs uppercase",
            selected ? "text-coin" : accentText[station.accent],
          )}
        >
          {sat.label}
        </span>
      </button>
    </motion.div>
  );
}
