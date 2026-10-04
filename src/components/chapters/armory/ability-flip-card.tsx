"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Ability, Accent } from "@/types/content";
import { PixelCard } from "@/components/ui/pixel-card";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { AbilityBack, AbilityFront } from "./ability-faces";

const TILT_DEG = 7;
const PERSPECTIVE = "perspective(900px)";

const shadow: Record<Accent, string> = {
  plasma: "shadow-[4px_4px_0_0_var(--plasma)]",
  xp: "shadow-[4px_4px_0_0_var(--xp)]",
  coin: "shadow-[4px_4px_0_0_var(--coin)]",
  warp: "shadow-[4px_4px_0_0_var(--warp)]",
};

const faceBase = "col-start-1 row-start-1 block p-5";

/** A card that flips on click. Hover tilt (mouse only) is a pure transform written straight to the DOM. */
export function AbilityFlipCard({ ability }: { ability: Ability }) {
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { trigger } = useDiscover("ability-flip", { accent: ability.accent, sound: "flip" });

  const tilt = (e: PointerEvent<HTMLElement>) => {
    const el = tiltRef.current;
    if (!el || reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `${PERSPECTIVE} rotateX(${-py * TILT_DEG}deg) rotateY(${px * TILT_DEG}deg)`;
  };
  const resetTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        setFlipped((f) => !f);
        trigger(e);
      }}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      className="block w-full cursor-pointer text-left"
    >
      <span
        ref={tiltRef}
        className="block transition-transform duration-150 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        <span
          className={cn("grid", !reduced && "transition-transform duration-500")}
          style={{
            transformStyle: "preserve-3d",
            transform: !reduced && flipped ? `${PERSPECTIVE} rotateY(180deg)` : undefined,
          }}
        >
          <PixelCard
            as="span"
            accent={ability.accent}
            aria-hidden={flipped}
            className={cn(faceBase, shadow[ability.accent], reduced && flipped && "invisible")}
            style={{ backfaceVisibility: "hidden" }}
          >
            <AbilityFront ability={ability} />
          </PixelCard>
          <PixelCard
            as="span"
            accent={ability.accent}
            aria-hidden={!flipped}
            className={cn(faceBase, shadow[ability.accent], reduced && !flipped && "invisible")}
            style={{
              backfaceVisibility: "hidden",
              transform: reduced ? undefined : "rotateY(180deg)",
            }}
          >
            <AbilityBack ability={ability} />
          </PixelCard>
        </span>
      </span>
    </button>
  );
}
