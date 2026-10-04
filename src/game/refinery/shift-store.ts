import { createShift, step, type ShiftAction, type ShiftEffect, type ShiftState } from "./shift";
import type { IncidentSpec } from "./types";

/**
 * Holds the shift state for `useSyncExternalStore` and hands back each step's effects, so the
 * UI can play sounds and FX for exactly what happened (no diffing of state in effects).
 */
export class ShiftStore {
  private state: ShiftState;
  private readonly listeners = new Set<() => void>();

  constructor(seed: number, pool: readonly IncidentSpec[]) {
    this.state = createShift(seed, pool);
  }

  dispatch(action: ShiftAction): readonly ShiftEffect[] {
    const { state, effects } = step(this.state, action);
    if (state !== this.state) {
      this.state = state;
      this.listeners.forEach((fn) => fn());
    }
    return effects;
  }

  getSnapshot = (): ShiftState => this.state;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
