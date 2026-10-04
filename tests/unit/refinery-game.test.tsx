import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { RefineryGame } from "@/components/shared/refinery/refinery-game";
import { refineryIncidents } from "@/content/refinery-incidents";
import { refineryCopy } from "@/content/refinery";
import { rightFixIndex } from "@/game/refinery/incidents";
import { LEVELS } from "@/game/refinery/levels";
import { FIRST_SHIFT_SEED, createShift, currentIncident, currentRecord, step, type ShiftState } from "@/game/refinery/shift";
import { renderWithGame } from "./support/render-with-game";

let reduceMotion = true;

beforeEach(() => {
  reduceMotion = true;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: reduceMotion,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Mirror of the first shift, so the test knows the right call for every record and incident. */
function mirror(): ShiftState {
  return step(createShift(FIRST_SHIFT_SEED, refineryIncidents), { type: "start" }).state;
}

const press = (key: string) => {
  const target = document.activeElement ?? document.body;
  fireEvent.keyDown(target, { key });
};

function playLevelsByKeyboard(model: ShiftState, wrong = false): ShiftState {
  let m = model;
  while (m.phase === "briefing" && m.stage < LEVELS.length) {
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.briefing.beginLevel }));
    m = step(m, { type: "begin" }).state;
    while (m.phase === "running") {
      const good = currentRecord(m)?.isValid ?? true;
      const promote = wrong ? true : good;
      press(promote ? "p" : "q");
      m = step(m, { type: "decide", choice: promote ? "promote" : "quarantine" }).state;
    }
  }
  return m;
}

describe("RefineryGame", () => {
  it("defaults to relaxed mode under reduced motion and plays a perfect shift by keyboard", () => {
    const { events } = renderWithGame(<RefineryGame />);
    const toggle = screen.getByRole("button", { name: new RegExp(refineryCopy.relaxed.label, "i") });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: refineryCopy.start.button }));
    expect(document.activeElement).toHaveTextContent(refineryCopy.briefing.beginLevel);

    let m = playLevelsByKeyboard(mirror());
    expect(m.stage).toBe(LEVELS.length);
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.briefing.beginIncidents }));
    m = step(m, { type: "begin" }).state;
    while (m.phase === "incident") {
      const incident = currentIncident(m);
      if (!incident) break;
      const right = rightFixIndex(incident);
      press(String(right + 1));
      expect(screen.getByText(refineryCopy.incident.resolved)).toBeInTheDocument();
      fireEvent.click(document.activeElement ?? document.body);
      m = step(step(m, { type: "resolve", option: right }).state, { type: "next-incident" }).state;
    }

    expect(screen.getByRole("heading", { name: refineryCopy.report.complete })).toHaveFocus();
    expect(screen.getByText(refineryCopy.report.ranks.hero)).toBeInTheDocument();
    expect(events).toContainEqual({ type: "game:result", game: "refinery", outcome: "win" });
  });

  it("pages you at 3am after three SLA breaches", () => {
    const { events } = renderWithGame(<RefineryGame />);
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.start.button }));
    playLevelsByKeyboard(mirror(), true);
    expect(screen.getByRole("heading", { name: refineryCopy.report.paged })).toBeInTheDocument();
    expect(events).toContainEqual({ type: "game:result", game: "refinery", outcome: "lose" });
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.report.retry }));
    expect(screen.getByRole("button", { name: refineryCopy.briefing.beginLevel })).toBeInTheDocument();
  });

  it("lets a record slip off the belt in timed mode", () => {
    reduceMotion = false;
    vi.useFakeTimers();
    renderWithGame(<RefineryGame />);
    const toggle = screen.getByRole("button", { name: new RegExp(refineryCopy.relaxed.label, "i") });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.start.button }));
    fireEvent.click(screen.getByRole("button", { name: refineryCopy.briefing.beginLevel }));
    expect(screen.getByText(refineryCopy.verdict.prompt)).toBeInTheDocument();

    const travel = LEVELS[0]?.travelMs ?? 0;
    const frame = 16;
    act(() => {
      vi.advanceTimersByTime(travel + frame * 4);
    });
    expect(screen.getByRole("status")).toHaveTextContent(/slipped past the gate/i);
  });
});
