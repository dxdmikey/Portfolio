import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { GameProvider } from "@/providers/game-provider";
import { NovaDock } from "@/components/nova/nova-dock";
import { VisitTracker } from "@/game/progress/visits";
import { silentSfx } from "@/game/audio/sfx";
import { SoundPreference } from "@/game/audio/sound-preference";
import { EventBus } from "@/game/events/bus";
import { DiscoveryTracker } from "@/game/discoveries/tracker";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { discoveryIds } from "@/content/discoveries";
import { novaGreeting, novaCopy, novaChapterLines } from "@/content/nova";
import { createMemoryStore } from "@/lib/storage";
import type { GameEvent } from "@/types/events";

// Past the boot screen (as the e2e bypass and repeat visits are): NOVA only speaks once "ready".
document.documentElement.dataset.booted = "";

/** Every media query (reduced motion, narrow screen) answers this. */
let mediaMatches = true;

beforeEach(() => {
  mediaMatches = true;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: mediaMatches,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  const store = createMemoryStore();
  const bus = new EventBus<GameEvent>();
  const services = {
    store,
    sfx: silentSfx,
    sound: new SoundPreference(store, silentSfx),
    bus,
    discoveries: new DiscoveryTracker(discoveryIds, store),
    quickView: new BooleanPreference(store, "quickView"),
    visits: new VisitTracker(["a"], store),
  };
  render(
    <GameProvider services={services}>
      <NovaDock />
    </GameProvider>,
  );
  return { bus, store };
}

const live = () => document.querySelector("aside p[aria-live='polite']")?.textContent;
const enter = (
  bus: EventBus<GameEvent>,
  chapter: Extract<GameEvent, { type: "chapter:enter" }>["chapter"],
) => act(() => bus.emit({ type: "chapter:enter", chapter }));

describe("NovaDock", () => {
  it("greets inside the first chapter line and mirrors text into a polite live region", () => {
    const { bus } = setup();
    enter(bus, "nebula");
    expect(live()).toBe(`${novaGreeting} ${novaChapterLines.nebula[0]}`);
  });

  it("follows the visitor: a new chapter replaces the previous chapter's line at once", () => {
    const { bus } = setup();
    enter(bus, "pilot");
    enter(bus, "vit");
    expect(live()).toBe(novaChapterLines.vit[0]);
    enter(bus, "transmission");
    expect(live()).toBe(novaChapterLines.transmission[0]);
  });

  it("narrates every chapter on phones too", () => {
    // matchMedia answers true for the narrow-screen query as well.
    const { bus } = setup();
    enter(bus, "pilot");
    enter(bus, "armory");
    expect(live()).toBe(novaChapterLines.armory[0]);
  });

  it("says a 'back at' line when a chapter's intros are used up", () => {
    const { bus } = setup();
    const lines = novaChapterLines.vit;
    for (let i = 0; i < lines.length; i += 1) {
      enter(bus, "vit");
      enter(bus, "pilot");
    }
    enter(bus, "vit");
    expect(live()).toMatch(/Planet VIT/);
  });

  it("says nova:say lines and can be muted (persisted)", () => {
    const { bus, store } = setup();
    act(() => bus.emit({ type: "nova:say", text: "Upstream first!" }));
    expect(screen.getAllByText("Upstream first!").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: novaCopy.mute }));
    expect(store.get("nova.muted", false)).toBe(true);
    expect(screen.getByRole("button", { name: novaCopy.wakeLabel })).toBeInTheDocument();
  });

  it("tells a tip when the robot is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: novaCopy.robotLabel }));
    expect(live()).toMatch(/rocket/);
  });

  it("stops 'talking' when hidden mid-line, even though the typewriter never finished", () => {
    mediaMatches = false; // full motion: the typewriter types
    vi.useFakeTimers();
    const { bus } = setup();
    const robot = () => screen.getByRole("button", { name: novaCopy.robotLabel }).firstElementChild;
    act(() =>
      bus.emit({ type: "nova:say", text: "A fairly long line that takes a while to type out." }),
    );
    // Talking: the idle float animation is off.
    expect(robot()).not.toHaveClass("animate-float");
    fireEvent.click(screen.getByRole("button", { name: novaCopy.hide }));
    expect(robot()).toHaveClass("animate-float");
  });
});
