"use client";

import { useCallback, useRef, type CSSProperties, type RefObject } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { refineryCopy } from "@/content/refinery";
import { RELAXED_HOLD } from "@/game/refinery/conveyor";
import type { BatchRecord } from "@/game/refinery/types";
import { RecordCard } from "./record-card";
import { useStopwatch } from "./use-stopwatch";

/** Where the last record went: up to Silver, down to quarantine, or off the end of the belt. */
export type ExitDirection = "up" | "down" | "right";

const PERCENT = 100;
const ENTER_X = -24;
const EXIT_PX = 64;
const CARD_S = 0.25;
/** The belt stripes loop this many times per record trip, so faster levels look faster. */
const STRIPE_LOOPS_PER_TRIP = 16;

const cardVariants: Variants = {
  enter: { opacity: 0, x: ENTER_X },
  rest: { opacity: 1, x: 0, y: 0 },
  exit: (dir: ExitDirection) => ({
    opacity: 0,
    x: dir === "right" ? EXIT_PX : 0,
    y: dir === "up" ? -EXIT_PX : dir === "down" ? EXIT_PX : 0,
  }),
};

interface ConveyorProps {
  record: BatchRecord;
  /** Unique per record in the shift (stage + position). */
  recordKey: string;
  total: number;
  runDate: string;
  watermark: string | null;
  travelMs: number;
  relaxed: boolean;
  reducedMotion: boolean;
  exit: ExitDirection;
  /** Receives the record element in play (score pops and shakes anchor to it). */
  anchorRef: RefObject<HTMLElement | null>;
  onSlip: () => void;
}

/** The belt: the record rides left → right; reaching the SLA gate undecided means it slipped. */
export function Conveyor({ record, recordKey, total, runDate, watermark, travelMs, relaxed, reducedMotion, exit, anchorRef, onSlip }: ConveyorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement | null>(null);
  // Only ever point at the newest mover: the exiting one unmounting later must not clear it.
  const setMover = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      moverRef.current = el;
      anchorRef.current = el.firstElementChild instanceof HTMLElement ? el.firstElementChild : el;
    },
    [anchorRef],
  );

  useStopwatch({
    runKey: recordKey,
    durationMs: travelMs,
    active: !relaxed,
    watchRef: trackRef,
    onFrame: (p) => {
      if (moverRef.current) moverRef.current.style.transform = `translateX(${p * PERCENT}%)`;
    },
    onExpire: onSlip,
  });

  const rest = `translateX(${(relaxed ? RELAXED_HOLD : 0) * PERCENT}%)`;
  const beltStyle = { "--belt-loop": `${Math.round(travelMs / STRIPE_LOOPS_PER_TRIP)}ms` } as CSSProperties;
  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={refineryCopy.belt.aria}
      data-moving={!relaxed}
      style={beltStyle}
      className="refinery-belt border-grid bg-void relative grid min-h-52 items-start overflow-hidden border-2 pt-3 pb-5"
    >
      <span aria-hidden className="bg-danger absolute inset-y-0 right-0 w-1" />
      <span aria-hidden className="font-pixel text-px-xs text-danger absolute top-1 right-2 uppercase">
        {refineryCopy.belt.gate}
      </span>
      <AnimatePresence custom={exit} initial={false}>
        <div
          key={recordKey}
          ref={setMover}
          className="w-[calc(100%-15.5rem)] pl-2 [grid-area:1/1]"
          style={{ transform: rest }}
        >
          <motion.div
            className="w-60"
            custom={exit}
            variants={cardVariants}
            initial={reducedMotion ? false : "enter"}
            animate="rest"
            exit={reducedMotion ? undefined : "exit"}
            transition={{ duration: CARD_S }}
          >
            <RecordCard record={record} total={total} runDate={runDate} watermark={watermark} />
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}
