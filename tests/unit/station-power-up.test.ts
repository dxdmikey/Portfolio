import { describe, expect, it } from "vitest";
import {
  initialPowerUp,
  isComplete,
  isEdgeLive,
  joinLabels,
  labelsFor,
  missingUpstream,
  power,
  progress,
  statusOf,
  type PowerUpState,
  type StationGraph,
} from "@/game/station/power-up";
import { stationGraph } from "@/content/station";

const graph: StationGraph = {
  modules: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
    { id: "d", label: "D" },
  ],
  edges: [
    ["a", "c"],
    ["b", "c"],
    ["c", "d"],
  ],
};

function powerAll(g: StationGraph, ids: readonly string[]): PowerUpState {
  return ids.reduce((s, id) => power(g, s, id).state, initialPowerUp());
}

describe("station power-up machine", () => {
  it("starts with sources ready and everything else locked", () => {
    const s = initialPowerUp();
    expect(statusOf(graph, s, "a")).toBe("ready");
    expect(statusOf(graph, s, "b")).toBe("ready");
    expect(statusOf(graph, s, "c")).toBe("locked");
    expect(missingUpstream(graph, s, "c")).toEqual(["a", "b"]);
  });

  it("refuses locked modules and reports what's missing", () => {
    const s = powerAll(graph, ["a"]);
    const r = power(graph, s, "c");
    expect(r.kind).toBe("locked");
    if (r.kind === "locked") expect(r.missing).toEqual(["b"]);
    expect(r.state).toBe(s);
  });

  it("powers in pipeline order and detects completion", () => {
    let s = powerAll(graph, ["a", "b"]);
    expect(statusOf(graph, s, "c")).toBe("ready");
    const r1 = power(graph, s, "c");
    expect(r1).toMatchObject({ kind: "powered", complete: false });
    s = r1.state;
    const r2 = power(graph, s, "d");
    expect(r2).toMatchObject({ kind: "powered", complete: true });
    expect(isComplete(graph, r2.state)).toBe(true);
    expect(progress(graph, r2.state)).toEqual({ online: 4, total: 4 });
  });

  it("is immutable and handles repeats and unknown ids", () => {
    const s = powerAll(graph, ["a"]);
    expect(power(graph, s, "a").kind).toBe("already");
    expect(power(graph, s, "zzz").kind).toBe("unknown");
    const next = power(graph, s, "b").state;
    expect(s.powered.has("b")).toBe(false);
    expect(next.powered.has("b")).toBe(true);
  });

  it("marks an edge live once both ends are online", () => {
    const s = powerAll(graph, ["a", "b"]);
    expect(isEdgeLive(s, ["a", "c"])).toBe(false);
    expect(isEdgeLive(power(graph, s, "c").state, ["a", "c"])).toBe(true);
  });

  it("formats labels for hints", () => {
    expect(joinLabels(labelsFor(graph, ["a", "b", "zzz", "c"]))).toBe("A, B and C");
    expect(joinLabels(["A"])).toBe("A");
    expect(joinLabels([])).toBe("");
  });
});

describe("Navayuga station content", () => {
  it("has 8 modules that can all be powered from the sources", () => {
    expect(stationGraph.modules).toHaveLength(8);
    let s = initialPowerUp();
    // Repeatedly power whatever is ready: proves the graph has no unreachable modules.
    for (let i = 0; i < stationGraph.modules.length; i++) {
      const ready = stationGraph.modules.find((m) => statusOf(stationGraph, s, m.id) === "ready");
      if (ready) s = power(stationGraph, s, ready.id).state;
    }
    expect(isComplete(stationGraph, s)).toBe(true);
  });

  it("locks Ingest behind all three sources", () => {
    expect(
      labelsFor(stationGraph, missingUpstream(stationGraph, initialPowerUp(), "ingest")),
    ).toEqual(["ERP", "Fuel API", "Fleet & IoT"]);
  });
});
