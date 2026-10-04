import { describe, expect, it } from "vitest";
import { sections } from "@/content/navigation";
import { projects } from "@/content/projects";
import { abilities } from "@/content/abilities";
import { resume } from "@/content/resume";
import { inventory } from "@/content/inventory";

describe("content integrity", () => {
  it("has unique section ids", () => {
    const ids = sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps planets apart so tap targets never overlap", () => {
    for (const a of projects) {
      for (const b of projects) {
        if (a.id >= b.id) continue;
        const d = Math.hypot(a.planet.x - b.planet.x, a.planet.y - b.planet.y);
        expect(d, `${a.id} ↔ ${b.id}`).toBeGreaterThan(0.15);
      }
    }
  });

  it("references only existing nodes in architecture edges", () => {
    for (const p of projects) {
      if (!("architecture" in p) || !p.architecture) continue;
      const ids = new Set(p.architecture.nodes.map((n) => n.id));
      for (const [from, to] of p.architecture.edges) {
        expect(ids.has(from) && ids.has(to)).toBe(true);
      }
    }
  });

  it("has exactly six top abilities with levels within 1–99", () => {
    expect(abilities).toHaveLength(6);
    abilities.forEach((a) => expect(a.level).toBeGreaterThan(0));
    abilities.forEach((a) => expect(a.level).toBeLessThan(100));
  });

  it("never includes a phone number in the resume", () => {
    expect(JSON.stringify(resume)).not.toMatch(/\+91|\d{10}/);
  });

  it("gives every inventory item a unique short label", () => {
    const abbrs = inventory.map((i) => i.abbr);
    expect(new Set(abbrs).size).toBe(abbrs.length);
  });
});
