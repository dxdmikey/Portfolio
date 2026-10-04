"use client";

import { useEffect, useRef, useState } from "react";
import { NOVA_TYPE_MS_PER_CHAR } from "@/game/nova/timing";
import { useGame } from "@/providers/game-provider";

const SPACE = /\s/;

interface TypewriterProps {
  text: string;
  /** Show everything at once (reduced motion). */
  instant: boolean;
  onDone: () => void;
}

/**
 * Types `text` out one character at a time. Remount it (via `key`) for each new line.
 * Visual only: the parent mirrors the full text into an aria-live region.
 * If it unmounts mid-line (hidden, muted) the parent treats typing as over (see `useNova`).
 */
export function Typewriter({ text, instant, onDone }: TypewriterProps) {
  // Code points, so emoji never render as half a surrogate pair.
  const [chars] = useState(() => Array.from(text));
  const [count, setCount] = useState(instant ? chars.length : 0);
  const done = useRef(onDone);
  const { sfx } = useGame();

  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    // Reduced motion: nothing to type; the parent never counts it as typing.
    if (instant) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setCount(n);
      // A very quiet tick per letter (the player throttles it to one per 40ms).
      if (!SPACE.test(chars[n - 1] ?? " ")) sfx.play("type");
      if (n >= chars.length) {
        window.clearInterval(id);
        done.current();
      }
    }, NOVA_TYPE_MS_PER_CHAR);
    return () => window.clearInterval(id);
  }, [chars, instant, sfx]);

  const shown = instant ? chars.length : count;
  const typing = shown < chars.length;
  return (
    <>
      {chars.slice(0, shown).join("")}
      {typing ? (
        <span className="bg-plasma animate-blink ml-0.5 inline-block h-[1em] w-[0.5em] align-[-0.15em]" />
      ) : null}
    </>
  );
}
