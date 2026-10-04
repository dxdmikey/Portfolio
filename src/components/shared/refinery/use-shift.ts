"use client";

import { useState, useSyncExternalStore, type RefObject } from "react";
import { useGame } from "@/providers/game-provider";
import { useSfx } from "@/hooks/use-sfx";
import { refineryIncidents } from "@/content/refinery-incidents";
import { BestScore } from "@/game/refinery/best-score";
import { cuesFor, type CueAnchor } from "@/game/refinery/cues";
import { ShiftStore } from "@/game/refinery/shift-store";
import { FIRST_SHIFT_SEED, type ShiftAction, type ShiftEffect } from "@/game/refinery/shift";
import type { Choice } from "@/game/refinery/types";

/** Large odd multiplier to spread consecutive seeds apart. */
const SEED_MIX = 2_654_435_761;
const HALF = 2;

const serverBest = () => 0;

function centreOf(el: HTMLElement | null): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / HALF, y: window.innerHeight / HALF };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / HALF, y: r.top + r.height / HALF };
}

interface ShiftRefs {
  /** The whole game panel (report confetti, level bonus). */
  rootRef: RefObject<HTMLElement | null>;
  /** The record or incident in play (score pops, breach shake); the first one still on the page wins. */
  focusRefs: readonly RefObject<HTMLElement | null>[];
}

/** The on-call shift: pure store + side effects (sound, FX, best score, NOVA's game:result). */
export function useShift({ rootRef, focusRefs }: ShiftRefs) {
  const { store, bus } = useGame();
  const { play } = useSfx();
  const [shift] = useState(() => new ShiftStore(FIRST_SHIFT_SEED, refineryIncidents));
  const state = useSyncExternalStore(shift.subscribe, shift.getSnapshot, shift.getSnapshot);
  const [bestScore] = useState(() => new BestScore(store));
  const best = useSyncExternalStore(bestScore.subscribe, bestScore.getSnapshot, serverBest);
  const [newBest, setNewBest] = useState(false);

  const react = (effects: readonly ShiftEffect[], anchors: Record<CueAnchor, { x: number; y: number }>) => {
    for (const effect of effects) {
      for (const cue of cuesFor(effect)) {
        if (cue.sfx) play(cue.sfx.name, cue.sfx.pitch === undefined ? undefined : { pitch: cue.sfx.pitch });
        if (cue.fx) {
          const { kind, accent, label, at } = cue.fx;
          bus.emit({ type: "fx", kind, accent, ...anchors[at], ...(label ? { label } : {}) });
        }
      }
      if (effect.kind === "shift-start") setNewBest(false);
      if (effect.kind === "shift-end") {
        setNewBest(bestScore.record(effect.result.score));
        bus.emit({ type: "game:result", game: "refinery", outcome: effect.result.outcome });
      }
    }
  };

  /** Measure anchors before dispatching: the record in play is replaced on the next render. */
  const dispatch = (action: ShiftAction) => {
    const inPlay = focusRefs.map((ref) => ref.current).find((el) => el?.isConnected) ?? rootRef.current;
    const anchors = { focus: centreOf(inPlay), root: centreOf(rootRef.current) };
    react(shift.dispatch(action), anchors);
  };

  return {
    state,
    best,
    newBest,
    start: () => dispatch({ type: "start" }),
    begin: () => dispatch({ type: "begin" }),
    decide: (choice: Choice) => dispatch({ type: "decide", choice }),
    slip: () => dispatch({ type: "slip" }),
    resolve: (option: number | null) => dispatch({ type: "resolve", option }),
    nextIncident: () => dispatch({ type: "next-incident" }),
    retry: () => dispatch({ type: "retry" }),
    // Handler-only randomness: Date.now() never runs during render.
    newShift: () => dispatch({ type: "new-shift", seed: (Date.now() ^ Math.imul(state.seed, SEED_MIX)) >>> 0 }),
  };
}

export type ShiftControls = ReturnType<typeof useShift>;
