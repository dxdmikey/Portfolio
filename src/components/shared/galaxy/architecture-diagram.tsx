"use client";

import { useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { accentBorder } from "@/components/ui/accent";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { describeFlow, groupByColumn } from "@/game/galaxy/architecture";
import type { Accent, Project } from "@/types/content";
import { FlowLines } from "./flow-lines";
import { useFlowPaths } from "./use-flow-paths";

type Architecture = NonNullable<Project["architecture"]>;

/** Stage headings by column; extra columns fall back to "Stage n". */
const STAGE_LABELS = ["Sources", "Ingest", "Lakehouse", "Serve"] as const;

interface ArchitectureDiagramProps {
  architecture: Architecture;
  accent: Accent;
}

/**
 * Sources → Ingest → Lakehouse → Serve, built from the project's nodes and edges.
 * Columns side by side on large screens, stacked (arrows pointing down) on small ones.
 */
export function ArchitectureDiagram({ architecture, accent }: ArchitectureDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const layout = useFlowPaths(ref, architecture.edges);
  const columns = groupByColumn(architecture.nodes);
  const grid = { "--cols": columns.length } as CSSProperties;

  return (
    <figure className="flex flex-col gap-4">
      <div
        ref={ref}
        style={grid}
        className="relative grid gap-10 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:gap-12"
      >
        <FlowLines layout={layout} accent={accent} animate={!reducedMotion} />
        {columns.map((col, i) => (
          <div key={col[0]?.column ?? i} className="flex flex-col gap-3">
            <p className="font-pixel text-px-xs text-dust bg-nebula relative z-10 self-start px-1 uppercase">
              {STAGE_LABELS[i] ?? `Stage ${i + 1}`}
            </p>
            <ul className="grid grid-cols-2 gap-3 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-8">
              {col.map((node) => (
                <li
                  key={node.id}
                  data-node={node.id}
                  className={cn(
                    "bg-nebula-2 shadow-pixel-sm relative z-10 border-2 p-3 only:col-span-2",
                    accentBorder[accent],
                  )}
                >
                  <p className="font-pixel text-px-xs text-starlight uppercase">{node.label}</p>
                  <p className="text-dust mt-1 text-sm leading-snug">{node.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="text-dust text-sm">
        <span className="font-pixel text-px-xs text-coin mr-2 uppercase">Data flow</span>
        {describeFlow(architecture.nodes, architecture.edges)}
      </figcaption>
    </figure>
  );
}
