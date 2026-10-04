"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { profile } from "@/content/profile";
import { launchpad } from "@/content/launchpad";
import { useDiscover } from "@/hooks/use-discover";
import { accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";
import type { Accent } from "@/types/content";

const CYCLE: readonly Accent[] = ["plasma", "coin", "xp", "warp"];
const WAVE_CHANCE = 0.5;

type Poke = { kind: "wave" } | { kind: "bounce"; index: number };

const WORDS = profile.name.split(" ");
const LETTER_COUNT = WORDS.join("").length;
/** Index of each word's first letter in the whole name (for the wave delay and colours). */
const WORD_STARTS = WORDS.map((_, w) => WORDS.slice(0, w).join("").length);

/**
 * The captain's name as individually animated letters. One overlay button (one tab
 * stop) pokes it: a wave through every letter or a single bouncing letter, and the
 * colours shift one accent along each time. Letters wobble on hover (desktop).
 */
export function PokeName() {
  const [pokes, setPokes] = useState(0);
  const [poke, setPoke] = useState<Poke>({ kind: "wave" });
  const { trigger } = useDiscover("name", { accent: "warp", sound: "promote" });

  const onPoke = (e: MouseEvent<HTMLButtonElement>) => {
    trigger(e);
    setPoke(
      Math.random() < WAVE_CHANCE
        ? { kind: "wave" }
        : { kind: "bounce", index: Math.floor(Math.random() * LETTER_COUNT) },
    );
    setPokes((n) => n + 1);
  };

  return (
    <div className="name-wrap relative">
      <h1
        id="launchpad-title"
        className="font-pixel text-px-2xl lg:text-px-3xl text-glow leading-[1.35] uppercase"
      >
        <span className="sr-only">{profile.name}</span>
        {WORDS.map((word, w) => (
          <span key={word} aria-hidden className="block md:inline">
            {word.split("").map((ch, c) => {
              const i = WORD_STARTS[w]! + c;
              const animate = pokes > 0 && (poke.kind === "wave" || poke.index === i);
              return (
                <span
                  key={`${pokes}-${i}`}
                  style={{ "--i": i } as CSSProperties}
                  className={cn(
                    "name-letter inline-block",
                    accentText[pokes === 0 ? "plasma" : CYCLE[(i + pokes) % CYCLE.length]!],
                    animate && (poke.kind === "wave" ? "is-wave" : "is-bounce"),
                  )}
                >
                  {ch}
                </span>
              );
            })}
            {w < WORDS.length - 1 ? <span className="hidden md:inline"> </span> : null}
          </span>
        ))}
      </h1>
      <button
        type="button"
        onClick={onPoke}
        aria-label={launchpad.pokeName}
        className="absolute inset-0 min-h-11 w-full cursor-pointer"
      />
    </div>
  );
}
