import type { KeyValueStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import type { SfxPlayer } from "./sfx";

/** Sound is on unless the visitor turned it off (audio still waits for their first gesture). */
export const SOUND_DEFAULT = true;

/**
 * Persisted master on/off for all audio (effects and music), kept in sync with the
 * SfxPlayer (which forwards it to the shared engine). Subscribable for useSyncExternalStore.
 */
export class SoundPreference {
  private on: boolean;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly sfx: SfxPlayer,
  ) {
    this.on = store.get(STORAGE_KEYS.sound, SOUND_DEFAULT);
    sfx.setEnabled(this.on);
  }

  set(on: boolean): void {
    if (on === this.on) return;
    this.on = on;
    this.sfx.setEnabled(on);
    this.store.set(STORAGE_KEYS.sound, on);
    this.listeners.forEach((fn) => fn());
  }

  getSnapshot = (): boolean => this.on;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
