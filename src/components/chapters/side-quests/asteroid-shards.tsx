"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import type { Accent } from "@/types/content";
import type { Shard } from "@/game/belt/fracture";
import { pixelPathsByChar } from "@/lib/pixel-path";

/** Pixel chars → fill classes. "a" is the lit edge, which takes the asteroid's accent. */
const BASE_FILL: Record<string, string> = { "#": "fill-dust", o: "fill-grid" };
const ACCENT_FILL: Record<Accent, string> = {
  plasma: "fill-plasma",
  xp: "fill-xp",
  coin: "fill-coin",
  warp: "fill-warp",
};

export function rockFill(ch: string, accent: Accent): string | undefined {
  return ch === "a" ? ACCENT_FILL[accent] : BASE_FILL[ch];
}

/** One rock (or shard) drawn on the full 16×16 grid, so shards line up with the whole rock. */
export function RockArt({ rows, accent }: { rows: readonly string[]; accent: Accent }) {
  const paths = useMemo(() => [...pixelPathsByChar(rows)], [rows]);
  const size = rows.length;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="pixelated size-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {paths.map(([ch, d]) => (
        <path key={ch} d={d} className={rockFill(ch, accent)} />
      ))}
    </svg>
  );
}

const FLIGHT_S = 0.95;
const RETURN_S = 0.6;
/** px: base flight distance + up to this much more per shard, and a little fall. */
const FLY_PX = 60;
const FLY_EXTRA_PX = 60;
const FALL_PX = 22;
const SPIN_DEG = 240;
/** Second split: share of the flight when big shards break, and how far the pieces drift apart. */
const SPLIT_AT = 0.35;
const DRIFT_PX = 22;
const DRIFT_EXTRA_PX = 30;
const CHILD_SPIN_DEG = 200;
/** Shards stay solid for this share of the flight, then fade. */
const HOLD = 0.55;

const signed = (jitter: number) => jitter * 2 - 1;
const origin = (s: Shard, size: number) =>
  `${((s.cx + 0.5) / size) * 100}% ${((s.cy + 0.5) / size) * 100}%`;
/** Keyframes and their times, optionally played backwards (shards flying home). */
function track(values: number[], times: number[], reverse: boolean) {
  return reverse
    ? { values: [...values].reverse(), times: times.map((t) => 1 - t).reverse() }
    : { values, times };
}

interface ShardsProps {
  shards: readonly Shard[];
  accent: Accent;
  /** Play the break backwards: shards fly in and fade up, ending as the whole rock. */
  reverse: boolean;
  onDone?: () => void;
}

/** The cracked asteroid: shards fly out with spin, big ones break again mid-flight, then fade. */
export function AsteroidShards({ shards, accent, reverse, onDone }: ShardsProps) {
  const duration = reverse ? RETURN_S : FLIGHT_S;
  const ease = "easeOut";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {shards.map((s, i) => {
        const size = s.rows.length;
        const dist = FLY_PX + s.jitter * FLY_EXTRA_PX;
        const x = track([0, s.dx * dist], [0, 1], reverse);
        const y = track([0, s.dy * dist + FALL_PX], [0, 1], reverse);
        const rotate = track([0, signed(s.jitter) * SPIN_DEG], [0, 1], reverse);
        const opacity = track([1, 1, 0], [0, HOLD, 1], reverse);
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ transformOrigin: origin(s, size) }}
            initial={{
              x: x.values[0],
              y: y.values[0],
              rotate: rotate.values[0],
              opacity: opacity.values[0],
            }}
            animate={{ x: x.values, y: y.values, rotate: rotate.values, opacity: opacity.values }}
            transition={{
              x: { duration, ease },
              y: { duration, ease },
              rotate: { duration, ease },
              opacity: { duration, times: opacity.times },
            }}
            onAnimationComplete={i === 0 ? onDone : undefined}
          >
            {s.children.length === 0 ? (
              <RockArt rows={s.rows} accent={accent} />
            ) : (
              s.children.map((c, j) => {
                const drift = DRIFT_PX + c.jitter * DRIFT_EXTRA_PX;
                const cx = track([0, 0, c.dx * drift], [0, SPLIT_AT, 1], reverse);
                const cy = track([0, 0, c.dy * drift], [0, SPLIT_AT, 1], reverse);
                const spin = track(
                  [0, 0, signed(c.jitter) * CHILD_SPIN_DEG],
                  [0, SPLIT_AT, 1],
                  reverse,
                );
                return (
                  <motion.div
                    key={j}
                    className="absolute inset-0"
                    style={{ transformOrigin: origin(c, size) }}
                    initial={{ x: cx.values[0], y: cy.values[0], rotate: spin.values[0] }}
                    animate={{ x: cx.values, y: cy.values, rotate: spin.values }}
                    transition={{ duration, times: cx.times, ease }}
                  >
                    <RockArt rows={c.rows} accent={accent} />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
