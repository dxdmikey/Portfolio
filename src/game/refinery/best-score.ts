import type { KeyValueStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { nextBest } from "./scoring";

/** Persisted personal best (points in one on-call shift). Subscribable for useSyncExternalStore. */
export class BestScore {
  private best: number;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string = STORAGE_KEYS.refineryBest,
  ) {
    this.best = nextBest(store.get<unknown>(key, 0), 0);
  }

  /** Records a finished shift. Returns true when it set a new best. */
  record(score: number): boolean {
    const next = nextBest(this.best, score);
    if (next === this.best) return false;
    this.best = next;
    this.store.set(this.key, next);
    this.listeners.forEach((fn) => fn());
    return true;
  }

  getSnapshot = (): number => this.best;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
