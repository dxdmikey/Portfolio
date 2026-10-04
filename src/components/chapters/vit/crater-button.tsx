"use client";

import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { accentBorder, accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";
import type { Crater } from "@/content/vit";

const CRACK_S = 0.5;

/** Zig-zag crack that draws itself across an opened crater. */
function Crack({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute inset-0 size-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <motion.path
        d="M12 2 L10 8 L14 11 L9 15 L13 18 L11 23"
        fill="none"
        strokeWidth={2}
        className="stroke-starlight"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: CRACK_S }}
      />
    </svg>
  );
}

interface Props {
  crater: Crater;
  open: boolean;
  factId: string;
  onOpen: (key: string, point: { x: number; y: number }) => void;
}

/** Craters crack open: the rock-break sound, a little higher and lighter than an asteroid. */
const CRATER_SOUND = { pitch: 1.2, volume: 0.8 } as const;

/** A crater on the planet surface. Opening it cracks it and reveals a fact. */
export function CraterButton({ crater, open, factId, onOpen }: Props) {
  const { trigger } = useDiscover(crater.discovery, {
    accent: crater.accent,
    sound: "crack",
    soundOptions: CRATER_SOUND,
  });
  const reduced = useReducedMotion();

  const onClick = (e: MouseEvent<HTMLElement>) => {
    trigger(e);
    const r = e.currentTarget.getBoundingClientRect();
    onOpen(crater.key, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={factId}
      aria-label={`${crater.label} crater`}
      whileTap={reduced ? undefined : { scale: 0.9 }}
      style={{ left: `${crater.pos.x}%`, top: `${crater.pos.y}%` }}
      className={cn(
        "absolute -mt-6 -ml-6 grid size-12 cursor-pointer place-items-center overflow-hidden border-2 transition-colors",
        open
          ? cn("bg-nebula", accentBorder[crater.accent])
          : "bg-void border-grid hover:border-starlight",
      )}
    >
      {open ? (
        <Crack reduced={reduced} />
      ) : (
        <span aria-hidden className={cn("font-pixel text-px-sm", accentText[crater.accent])}>
          ?
        </span>
      )}
    </motion.button>
  );
}
