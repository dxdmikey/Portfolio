"use client";

import { motion } from "motion/react";

/** Sparks per shorted pipe, how long each takes to run it (s), and the gap between them (s). */
const SPARKS = 3;
const SPARK_S = 0.45;
const SPARK_STAGGER = 0.12;
/** Spark length as a fraction of the pipe. */
const SPARK_LEN = 0.08;
const SPARK_WIDTH = 4;

interface ShortSparksProps {
  /** Pipe from the offline dependency to the clicked module. */
  d: string;
  animate: boolean;
}

/**
 * A short circuit on one pipe: the pipe flashes danger and sparks run backwards from the clicked
 * module to the dependency that is still offline. Reduced motion: just the danger pipe.
 */
export function ShortSparks({ d, animate }: ShortSparksProps) {
  return (
    <g fill="none">
      <path d={d} className="stroke-danger" strokeWidth={2} strokeOpacity={0.8} />
      {animate
        ? Array.from({ length: SPARKS }, (_, i) => (
            <motion.path
              key={i}
              d={d}
              className="stroke-danger"
              strokeWidth={SPARK_WIDTH}
              initial={{ pathLength: SPARK_LEN, pathOffset: 1 - SPARK_LEN }}
              animate={{ pathOffset: 0, opacity: [1, 1, 0] }}
              transition={{ duration: SPARK_S, delay: i * SPARK_STAGGER, ease: "linear" }}
            />
          ))
        : null}
    </g>
  );
}
