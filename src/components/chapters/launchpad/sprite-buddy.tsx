"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { launchpad } from "@/content/launchpad";
import { PixelSprite } from "@/components/effects/pixel-sprite";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const SPRITE_SIZE = 112;
const SPRITE_SIZE_SM = 136;
const BUBBLE_MS = 4200;
const LINES = launchpad.sprite.lines;

/** Pixel Ravi: click to make him wave and say a random line in a speech bubble. */
export function SpriteBuddy() {
  const reduced = useReducedMotion();
  const [line, setLine] = useState<number | null>(null);
  const [waves, setWaves] = useState(0);
  const { trigger } = useDiscover("sprite", { accent: "coin", sound: "select" });

  useEffect(() => {
    if (line === null) return;
    const t = window.setTimeout(() => setLine(null), BUBBLE_MS);
    return () => window.clearTimeout(t);
  }, [line, waves]);

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    trigger(e);
    // Never the same line twice in a row.
    setLine((prev) => {
      const next = Math.floor(Math.random() * (LINES.length - 1));
      return prev !== null && next >= prev ? next + 1 : next;
    });
    setWaves((n) => n + 1);
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <p
        role="status"
        className={cn(
          "speech-bubble font-body bg-nebula border-coin text-starlight shadow-pixel absolute bottom-full left-1/2 z-10 mb-3 w-max max-w-[16rem] -translate-x-1/2 border-2 px-3 py-2 text-left text-sm sm:max-w-xs",
          line === null && "sr-only",
        )}
      >
        {line === null ? "" : LINES[line]}
      </p>
      <button
        type="button"
        onClick={onClick}
        aria-label={launchpad.sprite.label}
        className="min-h-11 min-w-11 cursor-pointer"
      >
        <span key={waves} className={cn("inline-block", waves > 0 && !reduced && "sprite-wave")}>
          <PixelSprite size={SPRITE_SIZE} animated={!reduced} className="sm:hidden" />
          <PixelSprite
            size={SPRITE_SIZE_SM}
            animated={!reduced}
            className="hidden sm:inline-flex"
          />
        </span>
      </button>
    </div>
  );
}
