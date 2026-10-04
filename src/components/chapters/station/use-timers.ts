"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/** Named timeouts that are all cleared on unmount (and on demand). Scheduling a key again replaces it. */
export function useTimers() {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clear = useCallback((key: string) => {
    const t = timers.current.get(key);
    if (t !== undefined) clearTimeout(t);
    timers.current.delete(key);
  }, []);

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  const schedule = useCallback(
    (key: string, ms: number, fn: () => void) => {
      clear(key);
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          fn();
        }, ms),
      );
    },
    [clear],
  );

  useEffect(() => clearAll, [clearAll]);

  return useMemo(() => ({ schedule, clear, clearAll }), [schedule, clear, clearAll]);
}
