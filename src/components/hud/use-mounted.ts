"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

/** False during SSR + hydration, true afterwards — without setState in an effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
