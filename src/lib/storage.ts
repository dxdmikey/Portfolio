/**
 * Key-value persistence abstraction. Browser storage can be missing or throw
 * (private mode, blocked cookies, SSR), so every implementation must fail soft.
 */
export interface KeyValueStore {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

const PREFIX = "portfolio.exe:";

function resolve(kind: "local" | "session"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function createWebStore(kind: "local" | "session" = "local"): KeyValueStore {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = resolve(kind)?.getItem(PREFIX + key);
        return raw == null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T): void {
      try {
        resolve(kind)?.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        /* storage unavailable — progress simply won't persist */
      }
    },
  };
}

/** In-memory store for tests and as a no-persistence fallback. */
export function createMemoryStore(seed: Record<string, unknown> = {}): KeyValueStore {
  const data = new Map<string, unknown>(Object.entries(seed));
  return {
    get: <T,>(key: string, fallback: T) => (data.has(key) ? (data.get(key) as T) : fallback),
    set: <T,>(key: string, value: T) => void data.set(key, value),
  };
}
