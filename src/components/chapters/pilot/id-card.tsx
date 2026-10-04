"use client";

import { useState, type MouseEvent } from "react";
import { motion } from "motion/react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfx } from "@/hooks/use-sfx";
import { PixelButton } from "@/components/ui/pixel-button";
import { pilotCopy } from "@/content/pilot";
import { cn } from "@/lib/cn";
import { CardBack } from "./card-back";
import { CardFront } from "./id-card-faces";
import { useIdCardMotion } from "./use-id-card-motion";

/** The stamp is a small, sharp thud: the rock-break sound, pitched up and softer. */
const STAMP_SOUND = { pitch: 1.35, volume: 0.7 } as const;

const FACE =
  "bg-nebula border-plasma shadow-pixel min-h-[26rem] border-2 [backface-visibility:hidden] [grid-area:1/1]";

/** The pilot ID card. A "click me" tag and a first-view peek hint that it flips; click (or the button) to flip. */
export function IdCard() {
  const [flipped, setFlipped] = useState(false);
  const [everFlipped, setEverFlipped] = useState(false);
  const reduced = useReducedMotion();
  const sfx = useSfx();
  const { trigger } = useDiscover("id-card", { accent: "plasma", sound: "flip" });
  const { rotate, scope, flipTo, shake } = useIdCardMotion(reduced);

  const flip = (e: MouseEvent<HTMLElement>) => {
    trigger(e);
    flipTo(!flipped);
    setFlipped(!flipped);
    setEverFlipped(true);
  };

  const onSlam = () => {
    sfx.play("crack", STAMP_SOUND);
    shake();
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div ref={scope} className="relative">
        <div onClick={flip} className="cursor-pointer [perspective:1200px]">
          <motion.div className="grid [transform-style:preserve-3d]" style={{ rotateY: rotate }}>
            <div
              className={cn(FACE, reduced && flipped && "hidden")}
              role="group"
              aria-hidden={flipped}
              aria-label={pilotCopy.frontFace}
            >
              <CardFront />
            </div>
            <div
              className={cn(
                FACE,
                "border-warp [transform:rotateY(180deg)]",
                reduced && !flipped && "hidden",
              )}
              style={reduced ? { transform: "none" } : undefined}
              role="group"
              aria-hidden={!flipped}
              aria-label={pilotCopy.backFace}
            >
              <CardBack flipped={flipped} reduced={reduced} onSlam={onSlam} />
            </div>
          </motion.div>
        </div>
        {everFlipped ? null : (
          <span
            aria-hidden
            className="font-pixel text-px-xs bg-coin text-on-accent shadow-pixel pointer-events-none absolute -top-3 right-3 z-10 animate-float px-2 py-2"
          >
            {pilotCopy.clickMe}
            <span className="font-body ml-1 text-sm">{pilotCopy.clickMeArrow}</span>
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <PixelButton type="button" variant="ghost" aria-pressed={flipped} onClick={flip}>
          {pilotCopy.flipLabel}
        </PixelButton>
        <p className="text-dust text-sm">{pilotCopy.flipHint}</p>
      </div>
    </div>
  );
}
