"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { CHARGE_MS } from "@/game/station/boot";

const MS_PER_S = 1000;

const SIDES = [
  { className: "top-0 left-0 h-[3px] w-full origin-left", from: { scaleX: 0 }, to: { scaleX: 1 } },
  { className: "top-0 right-0 h-full w-[3px] origin-top", from: { scaleY: 0 }, to: { scaleY: 1 } },
  {
    className: "right-0 bottom-0 h-[3px] w-full origin-right",
    from: { scaleX: 0 },
    to: { scaleX: 1 },
  },
  {
    className: "bottom-0 left-0 h-full w-[3px] origin-bottom",
    from: { scaleY: 0 },
    to: { scaleY: 1 },
  },
] as const;

/** The ring is drawn one side at a time, clockwise from the top-left corner. */
const SIDE_S = CHARGE_MS / MS_PER_S / SIDES.length;

/**
 * A pixel ring that fills around a charging module in CHARGE_MS (the module comes online when it
 * closes). Pure decoration; only mounted while charging and when motion is allowed.
 */
export function ChargeRing() {
  return (
    <span aria-hidden className="pointer-events-none absolute -inset-[5px]">
      {SIDES.map((side, i) => (
        <motion.span
          key={side.className}
          className={cn("bg-plasma absolute", side.className)}
          initial={side.from}
          animate={side.to}
          transition={{ duration: SIDE_S, delay: i * SIDE_S, ease: "linear" }}
        />
      ))}
    </span>
  );
}
