import type { KeyValueStore } from "@/lib/storage";

/** Own storage key (kept here so the galaxy feature is self-contained). */
export const GALAXY_OPENED_KEY = "galaxy.opened";

export interface OpenResult {
  /** First time this briefing was opened. */
  first: boolean;
  /** Every briefing has now been opened at least once. */
  complete: boolean;
}

/**
 * Remembers which mission briefings the visitor has read (star chart read markers).
 * Subscribable for useSyncExternalStore.
 */
export class BriefingLog {
  private opened: ReadonlySet<string>;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly projectIds: readonly string[],
    private readonly store: KeyValueStore,
    private readonly key: string = GALAXY_OPENED_KEY,
  ) {
    const saved = store.get<unknown>(key, []);
    const list = Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];
    this.opened = new Set(list.filter((id) => projectIds.includes(id)));
  }

  open(id: string): OpenResult {
    const known = this.projectIds.includes(id);
    const first = known && !this.opened.has(id);
    if (first) {
      this.opened = new Set([...this.opened, id]);
      this.store.set(this.key, [...this.opened]);
      this.listeners.forEach((fn) => fn());
    }
    return { first, complete: this.complete };
  }

  has(id: string): boolean {
    return this.opened.has(id);
  }

  get complete(): boolean {
    return this.projectIds.length > 0 && this.projectIds.every((id) => this.opened.has(id));
  }

  getSnapshot = (): ReadonlySet<string> => this.opened;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
