"use client";

import { useMemo, useRef, type MouseEvent } from "react";
import { useFlowPaths } from "@/components/shared/galaxy/use-flow-paths";
import { groupByColumn } from "@/game/galaxy/architecture";
import { bootStatusOf } from "@/game/station/boot";
import { edgeKey, shortEdges } from "@/game/station/flow";
import { isEdgeLive, joinLabels, labelsFor, missingUpstream } from "@/game/station/power-up";
import type { StationState } from "@/game/station/store";
import { activeStage } from "@/game/station/sync";
import {
  stationCopy,
  stationGraph,
  stationModules,
  stationStages,
  stationSyncStages,
} from "@/content/station";
import { ModuleReadout } from "./module-readout";
import { StationFlow } from "./station-flow";
import { StationModule } from "./station-module";
import type { PressKind } from "./use-power-press";

const COLUMNS = groupByColumn(stationModules);
const NONE: ReadonlySet<string> = new Set();

interface StationDiagramProps {
  state: StationState;
  animate: boolean;
  onPress: (id: string, event: MouseEvent<HTMLButtonElement>) => PressKind;
}

function statusText(state: StationState, id: string): string {
  const status = bootStatusOf(stationGraph, state, id);
  if (status !== "locked") return stationCopy.status[status];
  return stationCopy.status.locked(
    joinLabels(labelsFor(stationGraph, missingUpstream(stationGraph, state, id))),
  );
}

/** Which pipes glow and which modules are lit right now (live data, the sync batch, a short). */
function useHighlights(state: StationState) {
  const { powered, charging, sync, fault } = state;
  return useMemo(() => {
    // A blocker stops pulsing as soon as it starts charging.
    const blockers = (fault?.blockers ?? []).filter((id) => !powered.has(id) && !charging.has(id));
    const stage = activeStage(sync, stationSyncStages);
    const syncing = new Set(stage?.modules ?? []);
    return {
      live: new Set(stationGraph.edges.filter((e) => isEdgeLive({ powered }, e)).map(edgeKey)),
      hot: new Set(stationGraph.edges.filter(([, to]) => syncing.has(to)).map(edgeKey)),
      shorted: fault ? new Set(shortEdges(fault.target, fault.blockers)) : NONE,
      blockers: new Set(blockers),
      syncing,
    };
  }, [powered, charging, sync, fault]);
}

/**
 * The station laid out like the platform architecture: Sources → Ingest → Lakehouse/Transforms →
 * Reports/AI agent. Side by side on large screens, stacked with downward pipes on small ones.
 */
export function StationDiagram({ state, animate, onPress }: StationDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const layout = useFlowPaths(ref, stationGraph.edges);
  const lit = useHighlights(state);

  return (
    <div ref={ref} className="relative grid gap-10 lg:grid-cols-4 lg:gap-12">
      <StationFlow
        layout={layout}
        live={lit.live}
        hot={lit.hot}
        shorted={lit.shorted}
        fault={state.fault}
        animate={animate}
      />
      {COLUMNS.map((col, i) => (
        <div key={col[0]?.column ?? i} className="flex flex-col gap-3">
          <p className="font-pixel text-px-xs text-dust bg-nebula relative z-10 self-start px-1 uppercase">
            {stationStages[i] ?? `Stage ${i + 1}`}
          </p>
          <ul className="grid grid-cols-2 gap-3 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-8">
            {col.map((m) => (
              <li key={m.id} className="only:col-span-2">
                <StationModule
                  id={m.id}
                  label={m.label}
                  detail={m.detail}
                  status={bootStatusOf(stationGraph, state, m.id)}
                  statusText={statusText(state, m.id)}
                  fault={lit.blockers.has(m.id)}
                  syncing={lit.syncing.has(m.id)}
                  readout={<ModuleReadout id={m.id} sync={state.sync} />}
                  animate={animate}
                  onPress={onPress}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
