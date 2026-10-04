"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  isExpired,
  isPaused,
  pauseStopwatch,
  progress,
  resumeStopwatch,
  startStopwatch,
  type Stopwatch,
} from "@/game/refinery/conveyor";

interface StopwatchOptions {
  /** A new value starts a new run (e.g. the next record on the belt). */
  runKey: string;
  durationMs: number;
  /** False = no clock at all (relaxed mode, or nothing to time). */
  active: boolean;
  /** The clock pauses while this element is scrolled fully off-screen. */
  watchRef: RefObject<HTMLElement | null>;
  /** Called every animation frame with progress 0..1. Write to the DOM via refs, never React state. */
  onFrame: (progress: number) => void;
  onExpire: () => void;
  /** Injected clock (tests); defaults to performance.now(). */
  now?: () => number;
}

const defaultNow = () => performance.now();

/**
 * Drives a pure `Stopwatch` with requestAnimationFrame. Pauses when the tab is hidden or the watched
 * element is off-screen (so nothing slips while you're away), and cleans up on unmount.
 */
export function useStopwatch({ runKey, durationMs, active, watchRef, onFrame, onExpire, now = defaultNow }: StopwatchOptions) {
  const frameRef = useRef(onFrame);
  const expireRef = useRef(onExpire);
  const nowRef = useRef(now);
  useEffect(() => {
    frameRef.current = onFrame;
    expireRef.current = onExpire;
    nowRef.current = now;
  });

  useEffect(() => {
    if (!active) return;
    const clock = () => nowRef.current();
    let sw: Stopwatch = startStopwatch(durationMs, clock());
    let raf = 0;
    let done = false;
    let hidden = document.hidden;
    let offscreen = false;

    const tick = () => {
      const t = clock();
      frameRef.current(progress(sw, t));
      if (isExpired(sw, t)) {
        done = true;
        expireRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (done) return;
      const t = clock();
      cancelAnimationFrame(raf);
      if (hidden || offscreen) {
        sw = pauseStopwatch(sw, t);
        return;
      }
      if (isPaused(sw)) sw = resumeStopwatch(sw, t);
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const target = watchRef.current;
    const io =
      target && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            offscreen = entry ? !entry.isIntersecting : false;
            sync();
          })
        : null;
    if (target) io?.observe(target);
    sync();

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, [runKey, durationMs, active, watchRef]);
}
