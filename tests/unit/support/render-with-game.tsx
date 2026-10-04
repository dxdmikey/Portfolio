import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { GameProvider } from "@/providers/game-provider";
import { VisitTracker } from "@/game/progress/visits";
import { silentSfx } from "@/game/audio/sfx";
import { SoundPreference } from "@/game/audio/sound-preference";
import { EventBus } from "@/game/events/bus";
import { DiscoveryTracker } from "@/game/discoveries/tracker";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { discoveryIds } from "@/content/discoveries";
import { createMemoryStore } from "@/lib/storage";
import type { GameEvent } from "@/types/events";

/** Reduced motion on, so effects and typewriters settle instantly. */
export function stubReducedMotion() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: true, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }),
  });
}

/** Render with fake services and collect every bus event. */
export function renderWithGame(ui: ReactElement) {
  const store = createMemoryStore();
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
      {ui}
    </GameProvider>,
  );
  return { events, discoveries, bus, container: view.container };
}
