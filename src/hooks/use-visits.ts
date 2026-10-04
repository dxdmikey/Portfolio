"use client";

import { useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";

const EMPTY: ReadonlySet<string> = new Set();

export function useVisits() {
  const { visits } = useGame();
  const visited = useSyncExternalStore(visits.subscribe, visits.getSnapshot, () => EMPTY);
  return { visited, tracker: visits };
}
