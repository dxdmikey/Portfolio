import { describe, expect, it } from "vitest";
import {
  INITIAL_STATION,
  restoreStation,
  serializeStation,
  StationStore,
} from "@/game/station/store";
import { SYNC_DONE } from "@/game/station/sync";
import { appendLog } from "@/game/station/log";
import { createMemoryStore } from "@/lib/storage";
import { stationGraph } from "@/content/station";

const ALL = stationGraph.modules.map((m) => m.id);

describe("station persistence", () => {
  it("restores a valid save and round-trips it", () => {
    const s = restoreStation(stationGraph, { powered: ALL, synced: true });
    expect(s.powered.size).toBe(ALL.length);
    expect(s.sync).toEqual(SYNC_DONE);
    expect(serializeStation(s)).toEqual({ powered: ALL, synced: true });
  });

  it("trusts nothing: drops unknown ids, orphans and an impossible 'synced'", () => {
    const s = restoreStation(stationGraph, { powered: ["erp", "lake", "nope", 42], synced: true });
    expect([...s.powered]).toEqual(["erp"]); // lake needs ingest, which needs all three sources
    expect(s.sync.phase).toBe("idle");
    for (const bad of [null, "x", 3, { powered: "erp" }, {}])
      expect(restoreStation(stationGraph, bad)).toBe(INITIAL_STATION);
  });

  it("restores regardless of the stored order", () => {
    const s = restoreStation(stationGraph, {
      powered: ["ingest", "fleet", "fuel", "erp"],
      synced: false,
    });
    expect(s.powered.size).toBe(4);
  });

  it("persists progress changes only, and notifies subscribers", () => {
    const kv = createMemoryStore({ station: { powered: ["erp"], synced: false } });
    const store = new StationStore(kv, "station", stationGraph);
    expect(store.getSnapshot().powered.has("erp")).toBe(true);
    let calls = 0;
    const off = store.subscribe(() => calls++);

    store.update((s) => ({
      ...s,
      log: appendLog(s.log, { source: "x", text: "y", tone: "info" }),
    }));
    expect(calls).toBe(1);
    expect(kv.get("station", null)).toEqual({ powered: ["erp"], synced: false });

    store.update((s) => ({ ...s, powered: new Set([...s.powered, "fuel"]) }));
    expect(kv.get("station", null)).toEqual({ powered: ["erp", "fuel"], synced: false });

    const same = store.getSnapshot();
    expect(store.update((s) => s)).toBe(same);
    expect(calls).toBe(2);

    store.update(() => INITIAL_STATION);
    expect(kv.get("station", null)).toEqual({ powered: [], synced: false });
    off();
    store.update((s) => ({ ...s, fault: { target: "a", blockers: [], nonce: 1 } }));
    expect(calls).toBe(3);
  });
});
