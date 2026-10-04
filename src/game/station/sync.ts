/**
 * "Run first sync": once the station is fully online, one demo batch travels through the
 * pipeline stage by stage (sources → ingest → bronze → silver → gold → transforms → reports →
 * agent). Pure state machine; the caller owns the clock and calls `advanceSync` when a stage's
 * time is up. `syncAt` derives the same state from elapsed time (handy for tests and replays).
 */

/** Default time a batch spends in one stage (ms). */
export const SYNC_STAGE_MS = 550;
/** The last stage lingers so the agent's answer can land (ms). */
export const SYNC_FINAL_STAGE_MS = 900;

export interface SyncStage {
  readonly id: string;
  /** How long the batch stays in this stage (ms). */
  readonly ms: number;
}

export type SyncState =
  | { readonly phase: "idle" }
  | { readonly phase: "running"; readonly stage: number }
  | { readonly phase: "done" };

export type StageProgress = "pending" | "active" | "done";

export const SYNC_IDLE: SyncState = { phase: "idle" };
export const SYNC_DONE: SyncState = { phase: "done" };

export type SyncStart =
  | { kind: "started"; state: SyncState }
  /** Every module must be online first. */
  | { kind: "offline"; state: SyncState }
  | { kind: "busy"; state: SyncState };

/** Start (or re-run) the sync. A finished sync can run again; a running one cannot restart. */
export function startSync(
  sync: SyncState,
  stationOnline: boolean,
  stages: readonly SyncStage[],
): SyncStart {
  if (sync.phase === "running") return { kind: "busy", state: sync };
  if (!stationOnline || stages.length === 0) return { kind: "offline", state: sync };
  return { kind: "started", state: { phase: "running", stage: 0 } };
}

/** The batch moves on to the next stage, or finishes after the last one. */
export function advanceSync(sync: SyncState, stages: readonly SyncStage[]): SyncState {
  if (sync.phase !== "running") return sync;
  const next = sync.stage + 1;
  return next < stages.length ? { phase: "running", stage: next } : SYNC_DONE;
}

export function totalSyncMs(stages: readonly SyncStage[]): number {
  return stages.reduce((sum, s) => sum + s.ms, 0);
}

/** Where a sync started at time 0 is after `elapsed` ms. */
export function syncAt(stages: readonly SyncStage[], elapsed: number): SyncState {
  if (elapsed < 0) return SYNC_IDLE;
  let end = 0;
  for (let i = 0; i < stages.length; i++) {
    end += stages[i]?.ms ?? 0;
    if (elapsed < end) return { phase: "running", stage: i };
  }
  return SYNC_DONE;
}

/** How far the batch has got relative to one stage. */
export function stageProgress(
  sync: SyncState,
  stages: readonly SyncStage[],
  id: string,
): StageProgress {
  const index = stages.findIndex((s) => s.id === id);
  if (index < 0 || sync.phase === "idle") return "pending";
  if (sync.phase === "done") return "done";
  if (index < sync.stage) return "done";
  return index === sync.stage ? "active" : "pending";
}

/** The stage the batch is in right now (undefined unless running). */
export function activeStage<T extends SyncStage>(
  sync: SyncState,
  stages: readonly T[],
): T | undefined {
  return sync.phase === "running" ? stages[sync.stage] : undefined;
}
