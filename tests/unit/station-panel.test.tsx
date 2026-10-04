import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "@/providers/game-provider";
import PowerUpPanel from "@/components/chapters/station/power-up-panel";
import { VisitTracker } from "@/game/progress/visits";
import { silentSfx } from "@/game/audio/sfx";
import { SoundPreference } from "@/game/audio/sound-preference";
import { EventBus } from "@/game/events/bus";
import { DiscoveryTracker } from "@/game/discoveries/tracker";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { CHARGE_MS } from "@/game/station/boot";
import { totalSyncMs } from "@/game/station/sync";
import { discoveryIds } from "@/content/discoveries";
import { stationDemo, stationSyncStages } from "@/content/station";
import { STORAGE_KEYS } from "@/lib/constants";
import { createMemoryStore, type KeyValueStore } from "@/lib/storage";
import type { GameEvent } from "@/types/events";

/** Tests run with reduced motion (instant charges and sync) unless a test turns it off. */
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

function setup(store: KeyValueStore = createMemoryStore()) {
  const bus = new EventBus<GameEvent>();
  const events: GameEvent[] = [];
  bus.on((e) => events.push(e));
  const discoveries = new DiscoveryTracker(discoveryIds, store);
  const view = render(
    <GameProvider
      services={{
        store,
        sfx: silentSfx,
        sound: new SoundPreference(store, silentSfx),
        bus,
        discoveries,
        quickView: new BooleanPreference(store, "quickView"),
        visits: new VisitTracker(["a"], store),
      }}
    >
      <PowerUpPanel />
    </GameProvider>,
  );
  return { events, discoveries, store, view };
}

const ORDER = [
  "ERP",
  "Fuel API",
  "Fleet & IoT",
  "Ingest",
  "Lakehouse",
  "Transforms",
  "Reports",
  "AI agent",
];
const moduleButton = (label: string, status: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label} .* ?— ${status}$`) });
const log = () => screen.getByRole("log", { name: "Station boot log" });

async function powerAll() {
  for (const label of ORDER) await userEvent.click(moduleButton(label, "ready to power"));
}

describe("Power up the station", () => {
  it("states lock reasons, shorts a wrong-order click, and hints via NOVA", async () => {
    const { events } = setup();
    expect(moduleButton("ERP", "ready to power")).toBeInTheDocument();
    const ingest = moduleButton("Ingest", "locked: power ERP, Fuel API and Fleet & IoT first");
    await userEvent.click(ingest);
    expect(events.some((e) => e.type === "nova:say")).toBe(true);
    expect(
      within(log()).getByText(/blocked: ERP, Fuel API and Fleet & IoT offline/),
    ).toBeInTheDocument();
    expect(screen.getByText("0/8 modules online")).toBeInTheDocument();
    expect(events.some((e) => e.type === "station:power")).toBe(false);
  });

  it("comes online in pipeline order, logs it, and rewards the visitor", async () => {
    const { events, discoveries } = setup();
    await powerAll();
    expect(screen.getByText("8/8 modules online")).toBeInTheDocument();
    expect(screen.getByText("Station online")).toBeInTheDocument();
    expect(moduleButton("AI agent", "online")).toBeInTheDocument();
    expect(within(log()).getByText(/RAG index warm/)).toBeInTheDocument();
    expect(discoveries.has("station-online")).toBe(true);
    expect(events).toContainEqual({ type: "game:result", game: "station", outcome: "win" });
    expect(events.filter((e) => e.type === "station:power")).toHaveLength(8);
    expect(events).toContainEqual({ type: "station:power", online: 8, total: 8 });

    await userEvent.click(screen.getByRole("button", { name: /Reset station/ }));
    expect(screen.getByText("0/8 modules online")).toBeInTheDocument();
    expect(events.at(-1)).toEqual({ type: "station:power", online: 0, total: 8 });
  });

  it("runs the first sync once the station is online (demo data, re-runnable)", async () => {
    const { events } = setup();
    expect(screen.queryByRole("button", { name: /Run first sync/ })).toBeNull();
    await powerAll();
    await userEvent.click(screen.getByRole("button", { name: /Run first sync/ }));
    expect(screen.getByText("Sync complete")).toBeInTheDocument();
    expect(screen.getAllByText(stationDemo.tag).length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent(/Demo data only/);
    expect(events.filter((e) => e.type === "station:sync")).toHaveLength(1);
    // Discovery and win fire at 8/8 only, never again for the sync.
    expect(events.filter((e) => e.type === "game:result")).toHaveLength(1);
    expect(events.filter((e) => e.type === "discover")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /Run sync again/ }));
    expect(events.filter((e) => e.type === "station:sync")).toHaveLength(2);
  });

  it("remembers progress across visits, and reset forgets it", async () => {
    const store = createMemoryStore();
    const first = setup(store);
    await powerAll();
    await userEvent.click(screen.getByRole("button", { name: /Run first sync/ }));
    first.view.unmount();

    const second = setup(store);
    expect(screen.getByText("8/8 modules online")).toBeInTheDocument();
    expect(screen.getByText("Sync complete")).toBeInTheDocument();
    expect(second.events).toContainEqual({ type: "station:power", online: 8, total: 8 });

    await userEvent.click(screen.getByRole("button", { name: /Reset station/ }));
    expect(store.get(STORAGE_KEYS.station, null)).toEqual({ powered: [], synced: false });
  });
});

describe("Power up the station (full motion)", () => {
  it("charges for a moment before coming online, and the sync takes its time", () => {
    reduceMotion = false;
    vi.useFakeTimers();
    const { events } = setup();

    fireEvent.click(moduleButton("ERP", "ready to power"));
    expect(moduleButton("ERP", "charging")).toHaveAttribute("aria-busy", "true");
    fireEvent.click(moduleButton("ERP", "charging")); // no double charge
    act(() => vi.advanceTimersByTime(CHARGE_MS));
    expect(moduleButton("ERP", "online")).toBeInTheDocument();
    expect(events.filter((e) => e.type === "station:power")).toHaveLength(1);

    for (const label of ORDER.slice(1)) {
      fireEvent.click(moduleButton(label, "ready to power"));
      act(() => vi.advanceTimersByTime(CHARGE_MS));
    }
    expect(screen.getByText("8/8 modules online")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Run first sync/ }));
    expect(screen.getByRole("button", { name: /Batch in: sources/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    act(() => vi.advanceTimersByTime(stationSyncStages[0]?.ms ?? 0));
    expect(screen.getByRole("button", { name: /Batch in: ingest/ })).toBeInTheDocument();
    expect(screen.queryByText("Sync complete")).toBeNull();
    act(() => vi.advanceTimersByTime(totalSyncMs(stationSyncStages)));
    expect(screen.getByText("Sync complete")).toBeInTheDocument();
    expect(events.filter((e) => e.type === "station:sync")).toHaveLength(1);
  });
});
