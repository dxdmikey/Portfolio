"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STORAGE_KEYS } from "@/lib/constants";
import { stationCopy, stationGraph } from "@/content/station";
import { appendLog } from "@/game/station/log";
import { progress } from "@/game/station/power-up";
import { INITIAL_STATION, StationStore } from "@/game/station/store";
import { usePowerPress } from "./use-power-press";
import { useSyncRun } from "./use-sync-run";
import { useTimers } from "./use-timers";

/** Before hydration nothing is known about stored progress: render a cold station. */
const serverSnapshot = () => INITIAL_STATION;

/**
 * The CH4 station: persisted progress in an external store, plus the actions that drive it
 * (press a module, run the first sync, reset). Timers live here; the rules in `game/station`.
 * Under reduced motion charges and the sync resolve instantly.
 */
export function useStation() {
  const { bus, sfx, store } = useGame();
  const reduced = useReducedMotion();
  const [station] = useState(() => new StationStore(store, STORAGE_KEYS.station, stationGraph));
  const state = useSyncExternalStore(station.subscribe, station.getSnapshot, serverSnapshot);
  const timers = useTimers();
  const press = usePowerPress(station, timers, reduced);
  const runSync = useSyncRun(station, timers, reduced);

  // Restored progress: let the sky catch up once (an event, not React state).
  useEffect(() => {
    const restored = progress(stationGraph, station.getSnapshot());
    if (restored.online > 0) bus.emit({ type: "station:power", ...restored });
  }, [station, bus]);

  const reset = useCallback(() => {
    timers.clearAll();
    sfx.play("blip");
    station.update((s) => ({
      ...INITIAL_STATION,
      log: appendLog(s.log, {
        source: stationCopy.log.station,
        text: stationCopy.log.reset,
        tone: "info",
      }),
    }));
    bus.emit({ type: "station:power", ...progress(stationGraph, INITIAL_STATION) });
  }, [timers, sfx, station, bus]);

  return { state, press, runSync, reset, reduced };
}
