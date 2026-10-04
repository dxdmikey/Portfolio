import { describe, expect, it } from "vitest";
import { BriefingLog, GALAXY_OPENED_KEY } from "@/game/galaxy/briefing-log";
import {
  constellationLinks,
  flightOrder,
  headingDeg,
  periodStart,
  pixelCirclePolygon,
  turnTowards,
} from "@/game/galaxy/chart";
import { connectorPath, describeFlow, groupByColumn, laneFloor } from "@/game/galaxy/architecture";
import { projects } from "@/content/projects";
import { createMemoryStore } from "@/lib/storage";

const IDS = ["a", "b", "c"];

describe("BriefingLog", () => {
  it("reports first opens and completion, and persists", () => {
    const store = createMemoryStore();
    const log = new BriefingLog(IDS, store);
    expect(log.open("a")).toEqual({ first: true, complete: false });
    expect(log.open("a")).toEqual({ first: false, complete: false });
    log.open("b");
    expect(log.open("c")).toEqual({ first: true, complete: true });
    expect(store.get<string[]>(GALAXY_OPENED_KEY, [])).toEqual(IDS);
  });

  it("restores saved ids, ignoring unknown or corrupt ones", () => {
    const log = new BriefingLog(IDS, createMemoryStore({ [GALAXY_OPENED_KEY]: ["a", "zzz", 4] }));
    expect(log.has("a")).toBe(true);
    expect(log.getSnapshot().size).toBe(1);
    expect(
      new BriefingLog(IDS, createMemoryStore({ [GALAXY_OPENED_KEY]: "nope" })).getSnapshot().size,
    ).toBe(0);
  });

  it("ignores unknown ids and only notifies on change", () => {
    const log = new BriefingLog(IDS, createMemoryStore());
    let calls = 0;
    log.subscribe(() => calls++);
    expect(log.open("nope").first).toBe(false);
    log.open("a");
    log.open("a");
    expect(calls).toBe(1);
  });
});

describe("galaxy chart", () => {
  it("parses period start dates", () => {
    expect(periodStart("Apr 2024 – Apr 2025")).toBe(2024 * 12 + 3);
    expect(periodStart("Practice build")).toBeNull();
  });

  it("orders main missions chronologically, side missions last", () => {
    expect(flightOrder(projects).map((p) => p.id)).toEqual([
      "healthcare-integration",
      "healthcare-migration",
      "commercial-platform",
      "self-serve-platform",
      "aws-warehouse",
      "enterprise-platform",
    ]);
  });

  it("links the career path and tethers side missions to the nearest main planet", () => {
    const links = constellationLinks(projects);
    expect(links.filter((l) => l.kind === "path").map((l) => `${l.from}>${l.to}`)).toEqual([
      "healthcare-integration>healthcare-migration",
      "healthcare-migration>commercial-platform",
      "commercial-platform>self-serve-platform",
    ]);
    expect(links.filter((l) => l.kind === "side")).toHaveLength(2);
  });

  it("points the ship toward its target (0 deg = up)", () => {
    expect(headingDeg({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.1 }, 1)).toBeCloseTo(0);
    expect(headingDeg({ x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 }, 1)).toBeCloseTo(90);
    expect(headingDeg({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 1)).toBe(0);
  });

  it("turns the shortest way round", () => {
    expect(turnTowards(350, 10)).toBe(370);
    expect(turnTowards(10, 350)).toBe(-10);
    expect(turnTowards(0, 90)).toBe(90);
  });

  it("builds a closed stepped polygon", () => {
    const poly = pixelCirclePolygon(12);
    expect(poly.startsWith("polygon(")).toBe(true);
    expect(poly.split(",")).toHaveLength(12 * 4);
  });
});

describe("architecture helpers", () => {
  const nodes = [
    { id: "a", label: "A", column: 0 },
    { id: "b", label: "B", column: 0 },
    { id: "c", label: "C", column: 2 },
  ];

  it("groups nodes into ordered columns", () => {
    expect(groupByColumn(nodes).map((col) => col.map((n) => n.id))).toEqual([["a", "b"], ["c"]]);
  });

  it("describes the flow in words", () => {
    expect(
      describeFlow(nodes, [
        ["a", "c"],
        ["b", "c"],
      ]),
    ).toBe("A and B feed C.");
    expect(describeFlow(nodes, [["a", "b"]])).toBe("A feeds B.");
  });

  it("routes horizontally between columns and vertically otherwise", () => {
    const left = { left: 0, top: 0, width: 10, height: 10 };
    expect(connectorPath(left, { left: 20, top: 0, width: 10, height: 10 })).toMatch(/^M 10 5/);
    expect(connectorPath(left, { left: 0, top: 20, width: 10, height: 10 })).toMatch(/^M 5 10/);
  });

  it("bends a stacked connector only below a taller neighbour (phone layout)", () => {
    // Row 1: lake (tall, left) + transform (short, right). Row 2: reports (left).
    const lake = { left: 0, top: 0, width: 100, height: 200 };
    const transform = { left: 120, top: 0, width: 100, height: 80 };
    const reports = { left: 0, top: 260, width: 100, height: 80 };
    const floor = laneFloor(transform, reports, [lake, transform, reports]);
    expect(floor).toBe(200);
    const d = connectorPath(transform, reports, floor);
    // Straight drop from Transforms' bottom to below Lakehouse, then the S-bend in the gap.
    expect(d).toBe("M 170 80 L 170 200 C 170 230, 50 230, 50 260");
  });

  it("ignores boxes outside the connector's horizontal sweep and keeps the plain curve", () => {
    const a = { left: 0, top: 0, width: 10, height: 10 };
    const b = { left: 0, top: 40, width: 10, height: 10 };
    const far = { left: 300, top: 0, width: 10, height: 30 };
    expect(laneFloor(a, b, [a, b, far])).toBe(10);
    expect(connectorPath(a, b, 10)).toBe("M 5 10 C 5 25, 5 25, 5 40");
  });
});
