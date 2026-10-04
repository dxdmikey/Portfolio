import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { satellites, stations } from "@/content/nebula";
import { debriefs } from "@/content/debriefs";
import { quests } from "@/content/quests";
import { resume } from "@/content/resume";
import { certifications } from "@/content/certifications";
import { issuerById, issuers } from "@/content/issuers";
import { dossier } from "@/content/pilot";
import type { QuestEntry } from "@/types/content";
import { CardBack } from "@/components/chapters/pilot/card-back";
import { IssuerLogo } from "@/components/chapters/armory/issuer-logo";

describe("nebula map content", () => {
  it("renames the stations and satellites on the map only", () => {
    expect(stations.map((s) => s.name)).toEqual(["Data Engineer Trainee", "Data Engineer"]);
    expect(satellites.map((s) => s.label)).toEqual(["Migration", "Data Integration", "Platform AMS"]);
    // The CV titles are untouched.
    expect(quests.find((q) => q.id === "winwire-sde")?.title).toBe("Data Engineer SDE");
    expect(quests.find((q) => q.id === "winwire-sdt")?.title).toBe("Data Engineer SDT");
  });

  it("points every satellite at a real sub-quest of its station", () => {
    for (const sat of satellites) {
      const station = stations.find((s) => s.id === sat.stationId);
      const quest = quests.find((q) => q.id === station?.questId) as QuestEntry | undefined;
      expect(quest?.subQuests?.[sat.subIndex], sat.id).toBeDefined();
    }
  });

  it("keeps pills apart: each station's satellites rest on different sides", () => {
    for (const st of stations) {
      const angles = satellites.filter((s) => s.stationId === st.id).map((s) => s.angle);
      expect(new Set(angles).size).toBe(angles.length);
    }
  });

  it("backs every winwire-sde loot figure with the resume", () => {
    const text = JSON.stringify(resume);
    const figures = ["30%", "20–35%", "25%", "25+"];
    const loot = debriefs["winwire-sde"].loot.map((l) => l.value.replace(/^[-+]/, ""));
    expect(loot).toEqual(figures);
    for (const f of figures) expect(text, f).toContain(f);
  });
});

describe("pilot dossier", () => {
  it("renders the highlights as elements and the stamp", () => {
    render(<CardBack flipped reduced onSlam={() => undefined} />);
    expect(screen.getByText("Pilot dossier")).toBeInTheDocument();
    expect(screen.getByText(dossier.headline)).toBeInTheDocument();
    expect(screen.getAllByText("Azure").some((el) => el.tagName === "STRONG")).toBe(true);
    expect(screen.getByText("Open to quests")).toBeInTheDocument();
    for (const skill of dossier.skills) expect(screen.getAllByText(skill).length).toBeGreaterThan(0);
  });
});

describe("issuer logos", () => {
  it("maps every certification to an issuer whose palette covers its pixels", () => {
    for (const c of certifications) {
      const issuer = issuerById(c.issuerId);
      expect(issuer?.name, c.id).toBe(c.issuer);
    }
    for (const issuer of Object.values(issuers)) {
      const chars = new Set(issuer.rows.join("").replaceAll(".", ""));
      for (const ch of chars) expect(issuer.palette, `${issuer.id}:${ch}`).toHaveProperty(ch);
      expect(new Set(issuer.rows.map((r) => r.length)).size).toBe(1);
    }
  });

  it("draws the Microsoft mark in its four brand colours, hidden from assistive tech", () => {
    const { container } = render(<IssuerLogo issuerId="microsoft" />);
    const fills = [...container.querySelectorAll("path")].map((p) => p.getAttribute("fill"));
    expect(fills.sort()).toEqual(["#00A4EF", "#7FBA00", "#F25022", "#FFB900"]);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
