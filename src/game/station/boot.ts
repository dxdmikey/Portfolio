/**
 * Boot sequence on top of the power-up rules: a ready module first CHARGES for a moment, then
 * comes online. Pure and time-free: the caller starts a charge, waits (or not, under reduced
 * motion) and finishes it. Generic over the state so extra fields ride along untouched.
 */
import {
  isComplete,
  missingUpstream,
  type ModuleStatus,
  type PowerUpState,
  type StationGraph,
} from "./power-up";

/** How long a module charges before it comes online (ms). */
export const CHARGE_MS = 600;

export type BootStatus = ModuleStatus | "charging";

export interface BootState extends PowerUpState {
  /** Modules mid-charge. Not online yet, so they don't unlock anything downstream. */
  readonly charging: ReadonlySet<string>;
}

export type ChargeResult<S extends BootState> =
  | { kind: "charging"; state: S }
  | { kind: "locked"; state: S; missing: readonly string[] }
  /** Already charging: a double click must not double-charge. */
  | { kind: "busy"; state: S }
  | { kind: "already"; state: S }
  | { kind: "unknown"; state: S };

export type FinishResult<S extends BootState> =
  | { kind: "online"; state: S; complete: boolean }
  /** Nothing was charging for that id (e.g. the station was reset mid-charge). */
  | { kind: "idle"; state: S };

const has = (graph: StationGraph, id: string) => graph.modules.some((m) => m.id === id);

export function bootStatusOf(graph: StationGraph, state: BootState, id: string): BootStatus {
  if (state.powered.has(id)) return "online";
  if (state.charging.has(id)) return "charging";
  return missingUpstream(graph, state, id).length === 0 ? "ready" : "locked";
}

/** Begin charging a ready module. Other modules may charge at the same time. */
export function startCharge<S extends BootState>(
  graph: StationGraph,
  state: S,
  id: string,
): ChargeResult<S> {
  if (!has(graph, id)) return { kind: "unknown", state };
  if (state.powered.has(id)) return { kind: "already", state };
  if (state.charging.has(id)) return { kind: "busy", state };
  const missing = missingUpstream(graph, state, id);
  if (missing.length > 0) return { kind: "locked", state, missing };
  return { kind: "charging", state: { ...state, charging: new Set([...state.charging, id]) } };
}

/** The charge is full: the module comes online. */
export function finishCharge<S extends BootState>(
  graph: StationGraph,
  state: S,
  id: string,
): FinishResult<S> {
  if (!state.charging.has(id)) return { kind: "idle", state };
  const charging = new Set(state.charging);
  charging.delete(id);
  const next: S = { ...state, charging, powered: new Set([...state.powered, id]) };
  return { kind: "online", state: next, complete: isComplete(graph, next) };
}
