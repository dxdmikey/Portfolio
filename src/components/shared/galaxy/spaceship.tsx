"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Point } from "@/game/galaxy/chart";
import { pixelPathsByChar } from "@/lib/pixel-path";

export const FLIGHT_S = 0.6;
const TURN_S = 0.2;
const PERCENT = 100;
const SHIP_PX = 30;

/** 9×11 sprite pointing up. b = hull, c = cockpit, w = wing, f = flame. */
const SPRITE = [
  "....b....",
  "...bbb...",
  "...bcb...",
  "..bbcbb..",
  "..bbbbb..",
  ".wbbbbbw.",
  "wwbbbbbww",
  "ww.bbb.ww",
  "w..b.b..w",
  "...f.f...",
  "...f.f...",
] as const;
/** One path per colour, computed once. */
const SHIP_PATHS = [...pixelPathsByChar(SPRITE).entries()];
const FILL: Record<string, string> = {
  b: "fill-plasma",
  c: "fill-coin",
  w: "fill-warp",
  f: "fill-coin",
};

function ShipSprite({ thrusting }: { thrusting: boolean }) {
  return (
    <svg
      viewBox="0 0 9 11"
      width={SHIP_PX}
      height={(SHIP_PX * 11) / 9}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {SHIP_PATHS.map(([ch, d]) =>
        ch === "f" && !thrusting ? null : <path key={ch} d={d} className={FILL[ch]} />,
      )}
    </svg>
  );
}

interface SpaceshipProps {
  at: Point;
  rotate: number;
  flying: boolean;
  reducedMotion: boolean;
  onArrive: () => void;
}

/**
 * The player's ship. The outer layer fills the chart, so translating it by x% of its own width
 * moves the sprite by x% of the chart — transform-only flight, no measuring.
 */
export function Spaceship({ at, rotate, flying, reducedMotion, onArrive }: SpaceshipProps) {
  const instant = { duration: 0 };
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      initial={false}
      animate={{ x: `${at.x * PERCENT}%`, y: `${at.y * PERCENT}%` }}
      transition={reducedMotion ? instant : { duration: FLIGHT_S, ease: "easeInOut" }}
      onAnimationComplete={onArrive}
    >
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
        <div className={cn(!flying && !reducedMotion && "animate-float")}>
          <motion.div
            initial={false}
            animate={{ rotate }}
            transition={reducedMotion ? instant : { duration: TURN_S }}
          >
            <ShipSprite thrusting={flying} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
