"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useGame } from "@/providers/game-provider";
import { CONTROLLER_ROWS, type TraitEmote } from "@/content/pilot";
import { accentBg, accentBorder, accentText } from "@/components/ui/accent";
import { pixelPath } from "@/lib/pixel-path";
import { cn } from "@/lib/cn";

const EMOTE_MS = 1400;
const LEAVES = [
  { x: -22, drift: -10, delay: 0 },
  { x: -6, drift: 8, delay: 0.1 },
  { x: 10, drift: -6, delay: 0.2 },
  { x: 24, drift: 12, delay: 0.05 },
  { x: 0, drift: -14, delay: 0.3 },
] as const;
const BODY = pixelPath(CONTROLLER_ROWS, (c) => c === "#");
const BUTTONS = pixelPath(CONTROLLER_ROWS, (c) => c === "o");

function Leaves({ accent }: { accent: TraitEmote["accent"] }) {
  return (
    <>
      {LEAVES.map((l, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 size-2",
            accentBg[accent],
          )}
          initial={{ x: l.x, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: l.x + l.drift, y: -56, opacity: 0, rotate: 180 }}
          transition={{ duration: 1.1, delay: l.delay, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

function Controller({ caption, accent }: { caption: string; accent: TraitEmote["accent"] }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 -ml-8 flex flex-col items-center",
        accentText[accent],
      )}
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: -6, opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <svg
        viewBox="0 0 12 7"
        width={36}
        height={21}
        fill="currentColor"
        shapeRendering="crispEdges"
        className="pixelated"
      >
        <path d={BODY} />
        <path d={BUTTONS} className="fill-void" />
      </svg>
      <span className="font-pixel text-px-xs mt-1">{caption}</span>
    </motion.span>
  );
}

/** A trait chip that plays a little emote when clicked. */
export function TraitChip({ trait }: { trait: TraitEmote }) {
  const { trigger } = useDiscover(trait.discovery, {
    accent: trait.accent,
    sound: "toggle",
    fx: trait.emote === "sparkle" ? "confetti" : "burst",
  });
  const reduced = useReducedMotion();
  const { bus } = useGame();
  const [playing, setPlaying] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = (e: MouseEvent<HTMLElement>) => {
    trigger(e);
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (trait.emote === "sparkle") {
      bus.emit({
        type: "fx",
        kind: "ripple",
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        accent: trait.accent,
      });
    }
    setPlaying((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(0), EMOTE_MS);
  };

  const on = playing > 0;
  return (
    <span className="relative inline-block">
      <motion.button
        type="button"
        onClick={onClick}
        animate={
          on && trait.emote === "sparkle"
            ? { scale: [1, 1.18, 1], rotate: [0, -3, 3, 0] }
            : { scale: 1 }
        }
        transition={{ duration: 0.5 }}
        className={cn(
          "font-pixel text-px-sm bg-void min-h-11 cursor-pointer border-2 px-4 py-2 uppercase transition-shadow",
          accentBorder[trait.accent],
          accentText[trait.accent],
          on &&
            trait.emote === "sparkle" &&
            "shadow-[0_0_0_3px_var(--warp),0_0_18px_4px_var(--warp)]",
        )}
      >
        {trait.name}
      </motion.button>
      {on && trait.emote === "leaf" ? <Leaves key={playing} accent={trait.accent} /> : null}
      <AnimatePresence>
        {on && trait.emote === "controller" ? (
          <Controller caption={trait.caption} accent={trait.accent} />
        ) : null}
      </AnimatePresence>
      {on && trait.emote === "sparkle" ? (
        <span
          aria-hidden
          className="font-pixel text-px-xs text-warp pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2"
        >
          {trait.caption}
        </span>
      ) : null}
    </span>
  );
}
