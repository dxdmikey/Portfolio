"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/providers/game-provider";
import type { GameEvent } from "@/types/events";

/** Subscribe to one bus event type for the lifetime of the component. */
export function useBusEvent<T extends GameEvent["type"]>(
  type: T,
  handler: (event: Extract<GameEvent, { type: T }>) => void,
) {
  const { bus } = useGame();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => bus.onType(type, (e) => ref.current(e)), [bus, type]);
}
