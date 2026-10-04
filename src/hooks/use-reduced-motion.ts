"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(fn: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", fn);
  return () => mql.removeEventListener("change", fn);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
