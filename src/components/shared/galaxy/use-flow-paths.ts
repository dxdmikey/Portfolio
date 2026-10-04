"use client";

import { useEffect, useState, type RefObject } from "react";
import { connectorPath, laneFloor, type Box, type FlowEdge } from "@/game/galaxy/architecture";

export interface FlowLayout {
  width: number;
  height: number;
  paths: readonly { key: string; d: string }[];
}

const EMPTY: FlowLayout = { width: 0, height: 0, paths: [] };

/**
 * Measures every `[data-node]` inside the container and returns SVG paths for the edges.
 * Re-measures on resize, so the same diagram works side-by-side and stacked.
 */
export function useFlowPaths(
  ref: RefObject<HTMLElement | null>,
  edges: readonly FlowEdge[],
): FlowLayout {
  const [layout, setLayout] = useState<FlowLayout>(EMPTY);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const boxes = new Map<string, Box>();
      el.querySelectorAll<HTMLElement>("[data-node]").forEach((node) => {
        const id = node.dataset.node;
        if (!id) return;
        const r = node.getBoundingClientRect();
        boxes.set(id, {
          left: r.left - base.left,
          top: r.top - base.top,
          width: r.width,
          height: r.height,
        });
      });
      const paths = edges.flatMap(([from, to]) => {
        const a = boxes.get(from);
        const b = boxes.get(to);
        return a && b
          ? [{ key: `${from}-${to}`, d: connectorPath(a, b, laneFloor(a, b, boxes.values())) }]
          : [];
      });
      setLayout({ width: base.width, height: base.height, paths });
    };
    // ResizeObserver fires once on observe, so this also handles the first measurement.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, edges]);

  return layout;
}
