import type { KeyValueStore } from "@/lib/storage";

const STORAGE_KEY = "discoveries";

/**
 * Remembers which clickable things the visitor has found. Same subscribe/snapshot
 * contract as the other trackers, so React reads it with useSyncExternalStore.
 */
export class DiscoveryTracker {
  private found: ReadonlySet<string>;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly ids: readonly string[],
    private readonly store: KeyValueStore,
  ) {
    const saved = store.get<string[]>(STORAGE_KEY, []);
    this.found = new Set(saved.filter((id) => ids.includes(id)));
  }

  /** Returns true only the first time an id is discovered. */
  discover(id: string): boolean {
    if (!this.ids.includes(id) || this.found.has(id)) return false;
    this.found = new Set([...this.found, id]);
    this.store.set(STORAGE_KEY, [...this.found]);
    this.listeners.forEach((fn) => fn());
    return true;
  }

  has(id: string): boolean {
    return this.found.has(id);
  }

  get total(): number {
    return this.ids.length;
  }

  get complete(): boolean {
    return this.found.size === this.ids.length;
  }

  getSnapshot = (): ReadonlySet<string> => this.found;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
