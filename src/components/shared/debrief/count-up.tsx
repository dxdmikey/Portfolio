"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const NUMBER = /\d+(?:\.\d+)?/g;
const COUNT_S = 1;

/**
 * Counts every number inside a loot string up from zero ("99.7%" -> 0.0%...99.7%),
 * keeping decimals and symbols. Screen readers get the final value immediately.
 */
export function CountUp({ value }: { value: string }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, 1, { duration: COUNT_S, ease: "easeOut", onUpdate: setProgress });
    return () => controls.stop();
  }, [reduced]);

  const t = reduced ? 1 : progress;
  const text = value.replace(NUMBER, (m) => {
    const decimals = m.split(".")[1]?.length ?? 0;
    return (Number(m) * t).toFixed(decimals);
  });
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden>{text}</span>
    </>
  );
}
