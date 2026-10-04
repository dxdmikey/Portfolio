/**
 * "Power up the station": modules come online in pipeline order. A module can be powered
 * once every module feeding it (its upstream) is online; modules with no upstream (sources)
 * are ready from the start. Immutable state, so React can hold it in useState.
 */

export interface StationModule {
  id: string;
  label: string;
}

export type StationEdge = readonly [from: string, to: string];

export interface StationGraph {
  modules: readonly StationModule[];
  edges: readonly StationEdge[];
}

export type ModuleStatus = "online" | "ready" | "locked";

export interface PowerUpState {
  readonly powered: ReadonlySet<string>;
}

export type PowerResult =
  | { kind: "powered"; state: PowerUpState; complete: boolean }
  | { kind: "locked"; state: PowerUpState; missing: readonly string[] }
  | { kind: "already"; state: PowerUpState }
  | { kind: "unknown"; state: PowerUpState };

export const initialPowerUp = (): PowerUpState => ({ powered: new Set() });

/** Ids of the modules that feed `id` directly. */
export function upstreamOf(graph: StationGraph, id: string): string[] {
  return graph.edges.filter(([, to]) => to === id).map(([from]) => from);
}

/** Direct upstream modules that are not online yet. */
export function missingUpstream(graph: StationGraph, state: PowerUpState, id: string): string[] {
  return upstreamOf(graph, id).filter((up) => !state.powered.has(up));
}

export function statusOf(graph: StationGraph, state: PowerUpState, id: string): ModuleStatus {
  if (state.powered.has(id)) return "online";
  return missingUpstream(graph, state, id).length === 0 ? "ready" : "locked";
}

export function isComplete(graph: StationGraph, state: PowerUpState): boolean {
  return graph.modules.length > 0 && graph.modules.every((m) => state.powered.has(m.id));
}

export function progress(
  graph: StationGraph,
  state: PowerUpState,
): { online: number; total: number } {
  const online = graph.modules.filter((m) => state.powered.has(m.id)).length;
  return { online, total: graph.modules.length };
}

/** An edge carries data once its target module is online (which implies its source is). */
export function isEdgeLive(state: PowerUpState, [from, to]: StationEdge): boolean {
  return state.powered.has(from) && state.powered.has(to);
}

/** Try to power a module. Never throws; the result says what happened. */
export function power(graph: StationGraph, state: PowerUpState, id: string): PowerResult {
  if (!graph.modules.some((m) => m.id === id)) return { kind: "unknown", state };
  if (state.powered.has(id)) return { kind: "already", state };
  const missing = missingUpstream(graph, state, id);
  if (missing.length > 0) return { kind: "locked", state, missing };
  const next: PowerUpState = { powered: new Set([...state.powered, id]) };
  return { kind: "powered", state: next, complete: isComplete(graph, next) };
}

/** Labels for ids, in the order given (unknown ids are skipped). */
export function labelsFor(graph: StationGraph, ids: readonly string[]): string[] {
  const byId = new Map(graph.modules.map((m) => [m.id, m.label]));
  return ids.flatMap((id) => {
    const label = byId.get(id);
    return label ? [label] : [];
  });
}

/** "A", "A and B", "A, B and C". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
