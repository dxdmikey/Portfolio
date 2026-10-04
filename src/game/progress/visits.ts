import type { KeyValueStore } from "@/lib/storage";
import { CHAPTER_XP, DISCOVERY_XP, STORAGE_KEYS } from "@/lib/constants";

/**
 * Tracks which page sections the visitor has seen. Persisted per browser so the
 * XP bar remembers progress across visits.
 */
export class VisitTracker {
  private visited: ReadonlySet<string>;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly sectionIds: readonly string[],
    private readonly store: KeyValueStore,
  ) {
    const saved = store.get<string[]>(STORAGE_KEYS.visited, []);
    this.visited = new Set(saved.filter((id) => sectionIds.includes(id)));
  }

  /** Marks a section visited. Returns true when this was a new visit. */
  visit(id: string): boolean {
    if (!this.sectionIds.includes(id) || this.visited.has(id)) return false;
    this.visited = new Set([...this.visited, id]);
    this.store.set(STORAGE_KEYS.visited, [...this.visited]);
    this.listeners.forEach((fn) => fn());
    return true;
  }

  get complete(): boolean {
    return this.visited.size === this.sectionIds.length;
  }

  /** Fraction 0–1 of sections seen. */
  get ratio(): number {
    return this.sectionIds.length === 0 ? 0 : this.visited.size / this.sectionIds.length;
  }

  getSnapshot = (): ReadonlySet<string> => this.visited;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}

/** XP shown in the HUD: chapters visited x CHAPTER_XP + discoveries found x DISCOVERY_XP. */
export function computeXp(input: {
  chaptersVisited: number;
  chaptersTotal: number;
  discoveriesFound: number;
  discoveriesTotal: number;
}): { current: number; max: number } {
  return {
    current: input.chaptersVisited * CHAPTER_XP + input.discoveriesFound * DISCOVERY_XP,
    max: input.chaptersTotal * CHAPTER_XP + input.discoveriesTotal * DISCOVERY_XP,
  };
}
