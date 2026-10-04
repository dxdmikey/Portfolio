/**
 * The station's whole state in one external store React reads with `useSyncExternalStore`.
 * Progress (powered modules + "synced") persists through a `KeyValueStore`; charges, the running
 * sync, faults and the log are session-only. No timers here: the hook owns the clock.
 */
import type { KeyValueStore } from "@/lib/storage";
import type { BootState } from "./boot";
import { EMPTY_LOG, type BootLog } from "./log";
import { isComplete, missingUpstream, type StationGraph } from "./power-up";
import { SYNC_DONE, SYNC_IDLE, type SyncState } from "./sync";

/** A short circuit: `target` was clicked while `blockers` were offline. */
export interface StationFault {
  readonly target: string;
  readonly blockers: readonly string[];
  /** Changes on every short so the sparks replay. */
  readonly nonce: number;
}

export interface StationState extends BootState {
  readonly sync: SyncState;
  readonly log: BootLog;
  readonly fault: StationFault | null;
}

/** What survives a reload. */
export interface PersistedStation {
  powered: string[];
  synced: boolean;
}

export const INITIAL_STATION: StationState = {
  powered: new Set(),
  charging: new Set(),
  sync: SYNC_IDLE,
  log: EMPTY_LOG,
  fault: null,
};

export function serializeStation(state: StationState): PersistedStation {
  return { powered: [...state.powered], synced: state.sync.phase === "done" };
}

/**
 * Rebuild state from stored data, trusting nothing: unknown ids are dropped, a module only
 * stays online if its whole upstream did, and "synced" needs a fully online station.
 */
export function restoreStation(graph: StationGraph, raw: unknown): StationState {
  if (typeof raw !== "object" || raw === null) return INITIAL_STATION;
  const data = raw as Partial<Record<keyof PersistedStation, unknown>>;
  const stored = new Set(
    Array.isArray(data.powered)
      ? data.powered.filter((x): x is string => typeof x === "string")
      : [],
  );
  const powered = new Set<string>();
  // Modules are listed upstream-first, but loop until stable so any order works.
  for (let changed = true; changed;) {
    changed = false;
    for (const m of graph.modules) {
      if (
        stored.has(m.id) &&
        !powered.has(m.id) &&
        missingUpstream(graph, { powered }, m.id).length === 0
      ) {
        powered.add(m.id);
        changed = true;
      }
    }
  }
  const synced = data.synced === true && isComplete(graph, { powered });
  if (powered.size === 0 && !synced) return INITIAL_STATION;
  return { ...INITIAL_STATION, powered, sync: synced ? SYNC_DONE : SYNC_IDLE };
}

export class StationStore {
  private state: StationState;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly kv: KeyValueStore,
    private readonly key: string,
    graph: StationGraph,
  ) {
    this.state = restoreStation(graph, kv.get<unknown>(key, null));
  }

  getSnapshot = (): StationState => this.state;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** Apply a pure transition; persists when progress changed, then notifies. */
  update(transition: (state: StationState) => StationState): StationState {
    const prev = this.state;
    const next = transition(prev);
    if (next === prev) return prev;
    this.state = next;
    const synced = (s: StationState) => s.sync.phase === "done";
    if (next.powered !== prev.powered || synced(next) !== synced(prev))
      this.kv.set(this.key, serializeStation(next));
    this.listeners.forEach((fn) => fn());
    return next;
  }
}
