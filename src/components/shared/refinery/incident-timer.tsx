"use client";

import { useRef } from "react";
import { INCIDENT_MS } from "@/game/refinery/scoring";
import { useStopwatch } from "./use-stopwatch";

const MS_PER_S = 1000;

interface IncidentTimerProps {
  runKey: string;
  active: boolean;
  onExpire: () => void;
}

/**
 * The incident clock: a draining bar plus seconds, written per frame through refs (no React state).
 * Decorative: the panel states the time limit in text once, so nothing is announced every second.
 */
export function IncidentTimer({ runKey, active, onExpire }: IncidentTimerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);
  useStopwatch({
    runKey,
    durationMs: INCIDENT_MS,
    active,
    watchRef: rootRef,
    onFrame: (p) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${1 - p})`;
      const left = String(Math.ceil(((1 - p) * INCIDENT_MS) / MS_PER_S));
      if (secondsRef.current && secondsRef.current.textContent !== left) secondsRef.current.textContent = left;
    },
    onExpire,
  });
  return (
    <div ref={rootRef} className="flex items-center gap-3" aria-hidden>
      <div className="border-grid bg-void h-3 flex-1 border">
        <div ref={barRef} className="bg-coin h-full origin-left" />
      </div>
      <span className="font-pixel text-px-xs text-coin w-8 text-right">
        <span ref={secondsRef}>{INCIDENT_MS / MS_PER_S}</span>s
      </span>
    </div>
  );
}
