"use client";

import { useEffect, useRef, useState } from "react";
import { launchpad } from "@/content/launchpad";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfx } from "@/hooks/use-sfx";
import { pentatonicRatio } from "@/game/audio/key";
import { finishCountdown, useBootPhase } from "./boot-state";

/** 4 steps × 600ms ≈ 2.4s total. */
const STEP_MS = 600;
const STEPS = launchpad.countdown;

/**
 * 3 · 2 · 1 · LIFTOFF! between PRESS START and the hero entrance. Any click or key skips
 * it; reduced motion skips it entirely. Renders nothing outside the countdown phase.
 */
export function Countdown() {
  const phase = useBootPhase();
  const reduced = useReducedMotion();
  const active = phase === "countdown";
  const [step, setStep] = useState(0);
  const skipRef = useRef<HTMLButtonElement>(null);
  const { play } = useSfx();

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      finishCountdown();
      return;
    }
    skipRef.current?.focus({ preventScroll: true });
    const timers = STEPS.map((_, i) =>
      window.setTimeout(() => {
        setStep(i);
        // 3 · 2 · 1 climb the music's scale (A, C, D), then LIFTOFF warps.
        if (i === STEPS.length - 1) play("warp");
        else play("blip", { pitch: pentatonicRatio(i) });
      }, i * STEP_MS),
    );
    timers.push(window.setTimeout(finishCountdown, STEPS.length * STEP_MS));
    const onKey = () => finishCountdown();
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", onKey);
    };
  }, [active, reduced, play]);

  if (!active || reduced) return null;
  const label = STEPS[step] ?? "";
  const last = step === STEPS.length - 1;

  return (
    <div
      onClick={finishCountdown}
      className="story-only bg-void/80 fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-10 px-4"
    >
      <p aria-live="assertive" className="sr-only">
        {label}
      </p>
      <span
        key={step}
        aria-hidden
        className={
          last
            ? "countdown-step font-pixel text-px-2xl sm:text-px-3xl text-xp text-glow uppercase"
            : "countdown-step font-pixel text-coin text-glow text-[6rem] leading-none sm:text-[9rem]"
        }
      >
        {label}
      </span>
      <button
        ref={skipRef}
        type="button"
        onClick={finishCountdown}
        className="font-pixel text-px-xs text-dust hover:text-plasma min-h-11 cursor-pointer px-4 uppercase"
      >
        {launchpad.skipCountdown}
      </button>
    </div>
  );
}
