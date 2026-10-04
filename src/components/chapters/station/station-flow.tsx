import { useId } from "react";
import { cn } from "@/lib/cn";
import type { FlowLayout } from "@/components/shared/galaxy/use-flow-paths";
import { stationGraph, stationSourceAccent } from "@/content/station";
import { edgeSources } from "@/game/station/flow";
import type { StationFault } from "@/game/station/store";
import type { Accent } from "@/types/content";
import { FlowPackets } from "./flow-packets";
import { ShortSparks } from "./short-sparks";

/** Packet colours per pipe, fixed by the graph (ERP plasma, fuel coin, fleet warp; mixed after Ingest). */
const EDGE_ACCENTS: ReadonlyMap<string, readonly Accent[]> = new Map(
  [...edgeSources(stationGraph)].map(([key, sources]) => [
    key,
    sources.flatMap((s) => stationSourceAccent[s] ?? []),
  ]),
);
const FALLBACK_ACCENTS: readonly Accent[] = ["plasma"];

interface StationFlowProps {
  layout: FlowLayout;
  /** Edge keys ("from-to") that carry data (both ends online). */
  live: ReadonlySet<string>;
  /** Edge keys the sync batch is travelling along right now. */
  hot: ReadonlySet<string>;
  /** Edge keys that just shorted, with the fault's nonce so sparks replay. */
  shorted: ReadonlySet<string>;
  fault: StationFault | null;
  animate: boolean;
}

/**
 * Pipes between modules, drawn behind them. Dormant pipes are faint dashes; live ones glow and
 * carry packets coloured by source; the sync batch lights its pipes amber; a short runs sparks.
 */
export function StationFlow({ layout, live, hot, shorted, fault, animate }: StationFlowProps) {
  const marker = useId();
  if (layout.width === 0) return null;
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 6 6"
          refX={6}
          refY={3}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 Z" className="fill-dust" />
        </marker>
      </defs>
      {layout.paths.map((p) => {
        const on = live.has(p.key);
        const isHot = hot.has(p.key);
        return (
          <g key={p.key} fill="none">
            <path
              d={p.d}
              className={cn(isHot ? "stroke-coin" : on ? "stroke-xp" : "stroke-dust")}
              strokeOpacity={isHot ? 1 : on ? 0.5 : 0.35}
              strokeWidth={isHot ? 3 : 2}
              strokeDasharray={on ? undefined : "3 6"}
              markerEnd={`url(#${marker})`}
            />
            {on ? (
              <FlowPackets
                d={p.d}
                accents={EDGE_ACCENTS.get(p.key) ?? FALLBACK_ACCENTS}
                animate={animate}
              />
            ) : null}
            {fault && shorted.has(p.key) ? (
              <ShortSparks key={fault.nonce} d={p.d} animate={animate} />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
