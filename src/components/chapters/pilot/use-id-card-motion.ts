"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, useAnimate, useMotionValue } from "motion/react";

const FLIP_S = 0.6;
const FLIP_DEG = 180;
/** Teaser wiggle: tilt open, nudge back, settle. */
const PEEK_KEYS = [0, 25, -6, 0];
const PEEK_S = 0.9;
const PEEK_DELAY_MS = 500;
const PEEK_VISIBLE = 0.6;
const SHAKE_KEYS = [0, -5, 5, -3, 3, 0];
const SHAKE_S = 0.3;

/**
 * Motion for the pilot ID card: one `rotate` value drives the flip and the first-view peek
 * wiggle (a new animation replaces the old one), and `shake` jolts the card after the stamp lands.
 * Everything is a no-op under reduced motion.
 */
export function useIdCardMotion(reduced: boolean) {
  const rotate = useMotionValue(0);
  const [scope, animateScope] = useAnimate<HTMLDivElement>();
  const flipped = useRef(false);

  const flipTo = useCallback(
    (next: boolean) => {
      flipped.current = next;
      if (reduced) return;
      void animate(rotate, next ? FLIP_DEG : 0, { duration: FLIP_S, ease: "easeInOut" });
    },
    [reduced, rotate],
  );

  const shake = () => {
    if (reduced || !scope.current) return;
    void animateScope(scope.current, { x: SHAKE_KEYS }, { duration: SHAKE_S });
  };

  useEffect(() => {
    const el = scope.current;
    if (reduced || !el || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        timer = setTimeout(() => {
          if (!flipped.current)
            void animate(rotate, PEEK_KEYS, { duration: PEEK_S, ease: "easeInOut" });
        }, PEEK_DELAY_MS);
      },
      { threshold: PEEK_VISIBLE },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [reduced, rotate, scope]);

  return { rotate, scope, flipTo, shake };
}
