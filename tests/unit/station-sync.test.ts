import { describe, expect, it } from "vitest";
import {
  activeStage,
  advanceSync,
  startSync,
  stageProgress,
  SYNC_DONE,
  SYNC_IDLE,
  syncAt,
  totalSyncMs,
  type SyncState,
} from "@/game/station/sync";
import { stationSyncStages } from "@/content/station";

const stages = [
  { id: "a", ms: 100 },
  { id: "b", ms: 200 },
  { id: "c", ms: 300 },
] as const;

describe("station first sync", () => {
  it("only starts when the station is online, and never twice at once", () => {
    expect(startSync(SYNC_IDLE, false, stages).kind).toBe("offline");
    const r = startSync(SYNC_IDLE, true, stages);
    expect(r).toEqual({ kind: "started", state: { phase: "running", stage: 0 } });
    expect(startSync(r.state, true, stages).kind).toBe("busy");
    expect(startSync(SYNC_DONE, true, stages).kind).toBe("started"); // re-run
    expect(startSync(SYNC_IDLE, true, []).kind).toBe("offline");
  });

  it("walks every stage in order, then finishes", () => {
    let s: SyncState = { phase: "running", stage: 0 };
    const seen = [activeStage(s, stages)?.id];
    for (let i = 0; i < stages.length; i++) {
      s = advanceSync(s, stages);
      seen.push(activeStage(s, stages)?.id);
    }
    expect(seen).toEqual(["a", "b", "c", undefined]);
    expect(s).toEqual(SYNC_DONE);
    expect(advanceSync(SYNC_DONE, stages)).toBe(SYNC_DONE);
    expect(advanceSync(SYNC_IDLE, stages)).toBe(SYNC_IDLE);
  });

  it("derives the state from elapsed time (fake clock)", () => {
    expect(totalSyncMs(stages)).toBe(600);
    expect(syncAt(stages, -1)).toEqual(SYNC_IDLE);
    expect(syncAt(stages, 0)).toEqual({ phase: "running", stage: 0 });
    expect(syncAt(stages, 99)).toEqual({ phase: "running", stage: 0 });
    expect(syncAt(stages, 100)).toEqual({ phase: "running", stage: 1 });
    expect(syncAt(stages, 599)).toEqual({ phase: "running", stage: 2 });
    expect(syncAt(stages, 600)).toEqual(SYNC_DONE);
  });

  it("reports per-stage progress", () => {
    const s: SyncState = { phase: "running", stage: 1 };
    expect(stageProgress(s, stages, "a")).toBe("done");
    expect(stageProgress(s, stages, "b")).toBe("active");
    expect(stageProgress(s, stages, "c")).toBe("pending");
    expect(stageProgress(SYNC_IDLE, stages, "a")).toBe("pending");
    expect(stageProgress(SYNC_DONE, stages, "c")).toBe("done");
    expect(stageProgress(s, stages, "zzz")).toBe("pending");
  });

  it("the Navayuga sync runs sources → lake layers → reports → agent in 4–6 s", () => {
    expect(stationSyncStages.map((s) => s.id)).toEqual([
      "sources",
      "ingest",
      "bronze",
      "silver",
      "gold",
      "transform",
      "reports",
      "agent",
    ]);
    const total = totalSyncMs(stationSyncStages);
    expect(total).toBeGreaterThanOrEqual(4000);
    expect(total).toBeLessThanOrEqual(6000);
  });
});
