"use client";

import { useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Relaxed mode (WCAG 2.2.1, timing adjustable): no conveyor clock and no incident clock.
 * On by default for people who prefer reduced motion; anyone can switch it either way.
 */
export function useRelaxed() {
  const reducedMotion = useReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const relaxed = choice ?? reducedMotion;
  return { relaxed, setRelaxed: setChoice, reducedMotion };
}
