/** Layout helpers for the architecture diagram in a mission briefing. */

export interface FlowNode {
  id: string;
  label: string;
  column: number;
}

export type FlowEdge = readonly [string, string];

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Nodes grouped into ordered columns (gaps in column numbers are closed). */
export function groupByColumn<T extends FlowNode>(nodes: readonly T[]): T[][] {
  const cols = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
  return cols.map((c) => nodes.filter((n) => n.column === c));
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Plain-language description of the flow for the <figcaption> / screen readers. */
export function describeFlow(nodes: readonly FlowNode[], edges: readonly FlowEdge[]): string {
  const name = new Map(nodes.map((n) => [n.id, n.label]));
  const targets = [...new Set(edges.map(([, to]) => to))];
  return targets
    .map((to) => {
      const sources = edges.filter(([, t]) => t === to).map(([from]) => name.get(from) ?? from);
      return `${joinNames(sources)} ${sources.length > 1 ? "feed" : "feeds"} ${name.get(to) ?? to}.`;
    })
    .join(" ");
}

/**
 * SVG path between two boxes. Mostly-horizontal pairs connect right edge → left edge,
 * otherwise bottom → top (stacked mobile layout and same-column links).
 */
export function connectorPath(a: Box, b: Box, floor?: number): string {
  const horizontal = b.left >= a.left + a.width;
  if (horizontal) {
    const x1 = a.left + a.width;
    const y1 = a.top + a.height / 2;
    const x2 = b.left;
    const y2 = b.top + b.height / 2;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }
  const x1 = a.left + a.width / 2;
  const y1 = a.top + a.height;
  const x2 = b.left + b.width / 2;
  const y2 = b.top;
  // Drop straight down to the lane floor first, so the sideways bend stays in the gap below
  // every taller neighbour (stacked phone layout: Transforms → Reports must not cross Lakehouse).
  const start = Math.min(Math.max(floor ?? y1, y1), y2);
  const mid = (start + y2) / 2;
  const drop = start > y1 ? ` L ${x1} ${start}` : "";
  return `M ${x1} ${y1}${drop} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

/**
 * Lowest bottom edge, above `b`, among the boxes a downward a→b connector sweeps across
 * horizontally. The connector should bend only below it.
 */
export function laneFloor(a: Box, b: Box, boxes: Iterable<Box>): number {
  const x1 = a.left + a.width / 2;
  const x2 = b.left + b.width / 2;
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  let floor = a.top + a.height;
  for (const box of boxes) {
    const bottom = box.top + box.height;
    const overlaps = box.left < hi && box.left + box.width > lo;
    if (overlaps && bottom <= b.top && bottom > floor) floor = bottom;
  }
  return floor;
}
