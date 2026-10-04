"use client";

import { useSyncExternalStore } from "react";
import { createWebStore, type KeyValueStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Launch sequence phase, shared by the boot overlay, the countdown and the hero entrance:
 *   boot      → BIOS screen waiting for PRESS START
 *   countdown → 3 · 2 · 1 · LIFTOFF! (only right after pressing START)
 *   ready     → hero entrance plays (or is already shown)
 * Repeat visits in a session (and quick view, and the e2e bypass) start at "ready": the
 * layout's inline script sets `html[data-booted]` from the same sessionStorage key.
 */
export type BootPhase = "boot" | "countdown" | "ready";

let store: KeyValueStore | null = null;
let phase: BootPhase | null = null;
const listeners = new Set<() => void>();

function session(): KeyValueStore {
  store ??= createWebStore("session");
  return store;
}

function getSnapshot(): BootPhase {
  if (phase === null) {
    const already =
      document.documentElement.dataset.booted !== undefined ||
      session().get<boolean>(STORAGE_KEYS.booted, false) === true;
    phase = already ? "ready" : "boot";
  }
  return phase;
}

const getServerSnapshot = (): BootPhase => "boot";

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(next: BootPhase): void {
  phase = next;
  listeners.forEach((fn) => fn());
}

/** PRESS START: persist for the session and begin the countdown. */
export function markBooted(): void {
  if (getSnapshot() !== "boot") return;
  session().set(STORAGE_KEYS.booted, true);
  set("countdown");
}

/** Countdown finished or skipped. */
export function finishCountdown(): void {
  if (getSnapshot() === "countdown") set("ready");
}

export function useBootPhase(): BootPhase {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** False on the server and until START is pressed in this session. */
export function useBooted(): boolean {
  return useBootPhase() !== "boot";
}
