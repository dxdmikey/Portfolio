"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";
import { useBusEvent } from "@/hooks/use-bus";
import { NovaDirector, type NovaLine } from "@/game/nova/director";
import { idleLine, linesForEvent } from "@/game/nova/script";
import { NOVA_MUTED_KEY } from "@/game/nova/keys";
import { NOVA_TYPE_MS_PER_CHAR } from "@/game/nova/timing";
import { BooleanPreference } from "@/game/preferences/boolean-preference";
import { novaCopy, novaScript } from "@/content/nova";
import type { GameEvent } from "@/types/events";

/** The dialogue folds back into just the robot after this long without new text. */
export const NOVA_COLLAPSE_MS = 4500;
/** Phones: less screen to spare, so every chapter is narrated but the box folds away sooner. */
export const NOVA_COLLAPSE_MOBILE_MS = 2500;
const NARROW_QUERY = "(max-width: 639px)";

const isNarrow = () => typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches;

export interface SpokenLine {
  /** Increments per line, so the typewriter remounts even when text repeats. */
  id: number;
  text: string;
}

const serverFalse = () => false;

/**
 * NOVA's brain on the React side: listens to the bus, asks the director what to say,
 * drains the queue on a timer, and manages typing / collapsed / muted state.
 * `instant` = reduced motion (no typewriter).
 */
export function useNova(instant: boolean) {
  const { store, bus } = useGame();
  const [director] = useState(() => new NovaDirector({ now: () => Date.now() }));
  const [mutePref] = useState(() => new BooleanPreference(store, NOVA_MUTED_KEY));
  const muted = useSyncExternalStore(mutePref.subscribe, mutePref.getSnapshot, serverFalse);

  const [line, setLine] = useState<SpokenLine | null>(null);
  const [typingState, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  /** Bumped when something is queued, so the drain timer is rescheduled. */
  const [queueVersion, setQueueVersion] = useState(0);
  const seq = useRef(0);
  // Typing only while the box is actually on screen: hiding or muting mid-line (which unmounts the
  // typewriter before it can report done) never leaves the robot stuck "talking".
  // With reduced motion the text appears at once, so it is never "typing".
  const typing = typingState && open && !muted && !instant;

  // Hold times include the typing time, which reduced motion skips.
  useEffect(
    () => director.setTypingSpeed(instant ? 0 : NOVA_TYPE_MS_PER_CHAR),
    [director, instant],
  );

  const present = useCallback((l: NovaLine) => {
    seq.current += 1;
    setLine({ id: seq.current, text: l.text });
    setTyping(true);
    setOpen(true);
  }, []);

  const offer = useCallback(
    (event: GameEvent) => {
      if (mutePref.getSnapshot()) return;
      linesForEvent(event, novaScript, director).forEach((candidate) => {
        const now = director.push(candidate);
        if (now) present(now);
        else setQueueVersion((v) => v + 1);
      });
    },
    [director, mutePref, present],
  );

  useBusEvent("chapter:enter", offer);
  // NOVA is lazy-loaded: if the visitor already settled on a chapter (an instant jump right after
  // load), narrate it on mount instead of staying silent until the next chapter change.
  useEffect(() => {
    const missed = bus.latest("chapter:enter");
    if (!missed) return;
    const id = window.setTimeout(() => offer(missed), 0);
    return () => window.clearTimeout(id);
    // `bus` and `offer` are stable, so this runs once on mount; later chapters arrive through
    // the subscription above.
  }, [bus, offer]);
  useBusEvent("discover", offer);
  useBusEvent("game:result", offer);
  useBusEvent("nova:say", offer);

  // Drain the queue once the current line has had its time on stage.
  useEffect(() => {
    const ms = director.msUntilNext();
    if (ms === null) return;
    const id = window.setTimeout(() => {
      const next = director.next();
      if (next) present(next);
      else setQueueVersion((v) => v + 1);
    }, ms);
    return () => window.clearTimeout(id);
  }, [director, present, line, queueVersion]);

  // Fold away after a quiet spell (not while the visitor is reading with the pointer on it).
  useEffect(() => {
    if (!open || typing || hovering) return;
    const id = window.setTimeout(
      () => setOpen(false),
      isNarrow() ? NOVA_COLLAPSE_MOBILE_MS : NOVA_COLLAPSE_MS,
    );
    return () => window.clearTimeout(id);
  }, [open, typing, hovering, line]);

  /** Robot clicked: wake up if muted, otherwise the next tip or joke. */
  const poke = useCallback(() => {
    if (mutePref.getSnapshot()) {
      mutePref.set(false);
      present(director.force({ text: novaCopy.wakeLine, priority: "direct", repeatable: true }));
      return;
    }
    const tip = idleLine(novaScript, director);
    if (tip) present(director.force(tip));
  }, [director, mutePref, present]);

  const hide = useCallback(() => {
    setOpen(false);
    setTyping(false);
  }, []);

  const mute = useCallback(() => {
    mutePref.set(true);
    hide();
  }, [mutePref, hide]);

  return {
    line,
    typing,
    open: open && !muted && line !== null,
    muted,
    poke,
    mute,
    hide,
    doneTyping: useCallback(() => setTyping(false), []),
    setHovering,
  };
}
