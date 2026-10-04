"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";
import { BriefingLog } from "@/game/galaxy/briefing-log";
import { projects } from "@/content/projects";
import type { KeyValueStore } from "@/lib/storage";

const EMPTY: ReadonlySet<string> = new Set();
const PROJECT_IDS = projects.map((p) => p.id);

/**
 * One log per store, shared by every briefing on the page (star chart, side quests…),
 * so separate instances never overwrite each other's progress.
 */
const logs = new WeakMap<KeyValueStore, BriefingLog>();
function logFor(store: KeyValueStore): BriefingLog {
  const existing = logs.get(store);
  if (existing) return existing;
  const log = new BriefingLog(PROJECT_IDS, store);
  logs.set(store, log);
  return log;
}

/** Which briefings this visitor has opened, persisted through the injected KeyValueStore. */
export function useBriefingLog() {
  const { store } = useGame();
  const [log] = useState(() => logFor(store));
  const opened = useSyncExternalStore(log.subscribe, log.getSnapshot, () => EMPTY);
  return { log, opened };
}

/** Records that a briefing was opened (drives the star chart's read markers). No-op while `id` is undefined. */
export function useBriefingTracking(id: string | undefined) {
  const { store } = useGame();
  const [log] = useState(() => logFor(store));
  useEffect(() => {
    if (id) log.open(id);
  }, [id, log]);
}
