/** What travels along the station's pipes: which sources feed each edge, and where a short runs. */
import { upstreamOf, type StationEdge, type StationGraph } from "./power-up";

/** Same key the flow-path measurer uses for an edge. */
export const edgeKey = ([from, to]: StationEdge): string => `${from}-${to}`;

/** Modules with no upstream: where data enters the station. */
export function sourceIds(graph: StationGraph): string[] {
  return graph.modules.filter((m) => upstreamOf(graph, m.id).length === 0).map((m) => m.id);
}

/**
 * The sources whose data reaches `id` (itself, if it is a source), in module order.
 * Cycle-safe, though the station graph has none.
 */
export function sourcesFeeding(graph: StationGraph, id: string): string[] {
  const sources = new Set(sourceIds(graph));
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);
    stack.push(...upstreamOf(graph, current));
  }
  return graph.modules.filter((m) => sources.has(m.id) && seen.has(m.id)).map((m) => m.id);
}

/** For every edge, the sources whose packets ride it (after ingest, they merge). */
export function edgeSources(graph: StationGraph): ReadonlyMap<string, readonly string[]> {
  return new Map(graph.edges.map((edge) => [edgeKey(edge), sourcesFeeding(graph, edge[0])]));
}

/** Pipes a short circuit runs along: from the clicked module back to each offline dependency. */
export function shortEdges(target: string, blockers: readonly string[]): string[] {
  return blockers.map((from) => edgeKey([from, target]));
}
