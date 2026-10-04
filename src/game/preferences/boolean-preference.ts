import type { KeyValueStore } from "@/lib/storage";

/** A persisted on/off setting that React can subscribe to (e.g. quick view). */
export class BooleanPreference {
  private value: boolean;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string,
    fallback = false,
  ) {
    this.value = store.get(key, fallback);
  }

  set(next: boolean): void {
    if (next === this.value) return;
    this.value = next;
    this.store.set(this.key, next);
    this.listeners.forEach((fn) => fn());
  }

  toggle(): void {
    this.set(!this.value);
  }

  getSnapshot = (): boolean => this.value;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
