import { describe, expect, it } from "vitest";
import { bootStatusOf, finishCharge, startCharge, type BootState } from "@/game/station/boot";
import { edgeKey, edgeSources, shortEdges, sourceIds, sourcesFeeding } from "@/game/station/flow";
import { appendLog, appendLogs, EMPTY_LOG, MAX_LOG_LINES } from "@/game/station/log";
import type { StationGraph } from "@/game/station/power-up";
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

const cold = (): BootState & { extra: string } => ({
  powered: new Set(),
  charging: new Set(),
  extra: "kept",
});

describe("station boot (charge → online)", () => {
  it("charges a ready module, then brings it online", () => {
    const r = startCharge(graph, cold(), "a");
    expect(r.kind).toBe("charging");
    expect(bootStatusOf(graph, r.state, "a")).toBe("charging");
    const done = finishCharge(graph, r.state, "a");
    expect(done).toMatchObject({ kind: "online", complete: false });
    expect(bootStatusOf(graph, done.state, "a")).toBe("online");
    expect(done.state.charging.size).toBe(0);
    expect(done.state.extra).toBe("kept");
  });

  it("never double-charges, and lets other modules charge meanwhile", () => {
    const s1 = startCharge(graph, cold(), "a").state;
    expect(startCharge(graph, s1, "a").kind).toBe("busy");
    const s2 = startCharge(graph, s1, "b");
    expect(s2.kind).toBe("charging");
    expect([...s2.state.charging]).toEqual(["a", "b"]);
  });

  it("a charging upstream does not unlock downstream yet", () => {
    const s = startCharge(graph, startCharge(graph, cold(), "a").state, "b").state;
    const r = startCharge(graph, s, "c");
    expect(r.kind).toBe("locked");
    if (r.kind === "locked") expect(r.missing).toEqual(["a", "b"]);
    expect(bootStatusOf(graph, s, "c")).toBe("locked");
  });

  it("reports already, unknown, idle and completion", () => {
    let s: BootState = cold();
    for (const id of ["a", "b", "c"])
      s = finishCharge(graph, startCharge(graph, s, id).state, id).state;
    expect(startCharge(graph, s, "a").kind).toBe("already");
    expect(startCharge(graph, s, "zzz").kind).toBe("unknown");
    expect(finishCharge(graph, s, "d").kind).toBe("idle");
    const last = finishCharge(graph, startCharge(graph, s, "d").state, "d");
    expect(last).toMatchObject({ kind: "online", complete: true });
  });

  it("is immutable", () => {
    const s = cold();
    startCharge(graph, s, "a");
    expect(s.charging.size).toBe(0);
  });
});

describe("station flow", () => {
  it("finds sources and what feeds each pipe", () => {
    expect(sourceIds(graph)).toEqual(["a", "b"]);
    expect(sourcesFeeding(graph, "a")).toEqual(["a"]);
    expect(sourcesFeeding(graph, "d")).toEqual(["a", "b"]);
    expect(edgeSources(graph).get("c-d")).toEqual(["a", "b"]);
    expect(edgeSources(graph).get("a-c")).toEqual(["a"]);
  });

  it("merges all three Navayuga sources after Ingest", () => {
    const sources = edgeSources(stationGraph);
    expect(sources.get(edgeKey(["fuel", "ingest"]))).toEqual(["fuel"]);
    expect(sources.get(edgeKey(["lake", "agent"]))).toEqual(["erp", "fuel", "fleet"]);
  });

  it("runs a short from the clicked module back to each blocker", () => {
    expect(shortEdges("c", ["a", "b"])).toEqual(["a-c", "b-c"]);
  });
});

describe("station boot log", () => {
  it("appends with increasing ids and keeps only the newest lines", () => {
    const one = appendLog(EMPTY_LOG, { source: "a", text: "up", tone: "ok" });
    expect(one.lines).toEqual([{ id: 0, source: "a", text: "up", tone: "ok" }]);
    const many = appendLogs(
      EMPTY_LOG,
      Array.from({ length: MAX_LOG_LINES + 3 }, (_, i) => ({
        source: "s",
        text: `${i}`,
        tone: "info" as const,
      })),
    );
    expect(many.lines).toHaveLength(MAX_LOG_LINES);
    expect(many.lines[0]?.text).toBe("3");
    expect(many.seq).toBe(MAX_LOG_LINES + 3);
    expect(EMPTY_LOG.lines).toHaveLength(0);
  });
});
