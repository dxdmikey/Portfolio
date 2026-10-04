import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { stationDemo, stationLakeLayers, stationSyncStages } from "@/content/station";
import {
  SYNC_STAGE_MS,
  stageProgress,
  type StageProgress,
  type SyncState,
} from "@/game/station/sync";
import { DemoChart } from "./demo-chart";

/** Lake layer bar colours (static classes). */
const LAYER_FILL: Record<(typeof stationLakeLayers)[number]["id"], string> = {
  bronze: "bg-warp",
  silver: "bg-plasma",
  gold: "bg-coin",
};

/** A layer fills while the batch is in it, and stays full after. */
const FILL: Record<StageProgress, string> = {
  pending: "scale-x-0",
  active: "scale-x-100",
  done: "scale-x-100",
};
const FILL_TIMING: CSSProperties = { transitionDuration: `${SYNC_STAGE_MS}ms` };

const at = (sync: SyncState, id: string) => stageProgress(sync, stationSyncStages, id);

function LakeLayers({ sync }: { sync: SyncState }) {
  return (
    <span className="flex flex-col gap-1">
      {stationLakeLayers.map((layer) => (
        <span key={layer.id} className="flex items-center gap-2">
          <span className="font-pixel text-px-xs text-dust w-3">{layer.short}</span>
          <span className="bg-void border-grid h-2.5 flex-1 border">
            <span
              style={FILL_TIMING}
              className={cn(
                "block h-full origin-left transition-transform ease-linear",
                LAYER_FILL[layer.id],
                FILL[at(sync, layer.id)],
              )}
            />
          </span>
        </span>
      ))}
    </span>
  );
}

function ReportsChart({ sync }: { sync: SyncState }) {
  const drawn = at(sync, "reports") !== "pending";
  return (
    <span className="flex h-full flex-col gap-1">
      <DemoChart drawn={drawn} className="h-7" />
      <span className={cn("font-pixel text-px-xs uppercase", drawn ? "text-coin" : "text-dust")}>
        {drawn ? stationDemo.tag : stationDemo.reportsIdle}
      </span>
    </span>
  );
}

function AgentChat({ sync }: { sync: SyncState }) {
  const step = at(sync, "agent");
  if (step === "pending") return <span className="text-dust text-xs">{stationDemo.agentIdle}</span>;
  return (
    <span className="flex flex-col gap-1 text-xs leading-tight">
      <span className="bg-void border-grid text-starlight self-start border px-1.5 py-0.5">
        {stationDemo.question}
      </span>
      {step === "done" ? (
        <span className="border-plasma text-plasma flex flex-wrap items-end gap-x-2 self-end border px-1.5 py-0.5">
          {stationDemo.answer}
          <DemoChart drawn className="h-3 w-8 shrink-0" />
        </span>
      ) : (
        <span className="text-dust animate-blink self-end">▮</span>
      )}
    </span>
  );
}

const READOUTS: Readonly<Record<string, (sync: SyncState) => ReactNode>> = {
  lake: (sync) => <LakeLayers sync={sync} />,
  reports: (sync) => <ReportsChart sync={sync} />,
  agent: (sync) => <AgentChat sync={sync} />,
};

/**
 * The little live display some modules carry (lake layers, the report chart, the agent's chat).
 * Fixed height so the pipes never jump; decorative (the finale card has the text summary).
 */
export function ModuleReadout({ id, sync }: { id: string; sync: SyncState }) {
  const readout = READOUTS[id];
  if (!readout) return null;
  return (
    <span aria-hidden className="mt-1 block h-20 w-full overflow-hidden lg:h-16">
      {readout(sync)}
    </span>
  );
}
