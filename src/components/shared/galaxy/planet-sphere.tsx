"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { accentBg, accentBorder } from "@/components/ui/accent";
import { pixelCirclePolygon } from "@/game/galaxy/chart";
import type { Accent } from "@/types/content";

/** Resolution of the stepped "pixel" outline. */
const PIXEL_CELLS = 14;
const CLIP = pixelCirclePolygon(PIXEL_CELLS);
const SURFACE_SPIN_S = 14;
const SPIN = { x: ["0%", "-50%"] };

interface PlanetSphereProps {
  accent: Accent;
  /** Diameter in px at scale 1. Scaled by the inherited `--planet-scale` CSS variable. */
  size: number;
  ring: boolean;
  spin: boolean;
}

/** Layered-CSS pixel planet: accent body, drifting surface bands, hard crescent shadow, square highlight. */
export function PlanetSphere({ accent, size, ring, spin }: PlanetSphereProps) {
  const dim = `calc(${size}px * var(--planet-scale, 1))`;
  const ringClass = cn(
    "pointer-events-none absolute top-1/2 left-1/2 h-[34%] w-[175%] -translate-x-1/2 -translate-y-1/2 -rotate-[16deg] rounded-[50%] border-2",
    accentBorder[accent],
  );
  return (
    <span aria-hidden className="relative block" style={{ width: dim, height: dim }}>
      {ring ? <span className={cn(ringClass, "opacity-50")} /> : null}
      <span
        className={cn("absolute inset-0 overflow-hidden", accentBg[accent])}
        style={{ clipPath: CLIP }}
      >
        <motion.span
          className="absolute inset-y-0 left-0 w-[200%]"
          animate={spin ? SPIN : undefined}
          transition={{ duration: SURFACE_SPIN_S, ease: "linear", repeat: Infinity }}
        >
          <span className="bg-void/20 absolute top-[28%] left-[6%] h-[10%] w-[30%]" />
          <span className="bg-void/20 absolute top-[56%] left-[22%] h-[8%] w-[40%]" />
          <span className="bg-void/20 absolute top-[28%] left-[56%] h-[10%] w-[30%]" />
          <span className="bg-void/20 absolute top-[56%] left-[72%] h-[8%] w-[22%]" />
        </motion.span>
        <span
          className="bg-void/45 absolute inset-0 translate-x-[30%] translate-y-[24%]"
          style={{ clipPath: CLIP }}
        />
        <span className="bg-starlight/85 absolute top-[18%] left-[22%] size-[14%]" />
        <span className="bg-starlight/50 absolute top-[32%] left-[18%] size-[8%]" />
      </span>
      {ring ? (
        <span className={cn(ringClass, "border-t-transparent border-r-transparent")} />
      ) : null}
    </span>
  );
}
