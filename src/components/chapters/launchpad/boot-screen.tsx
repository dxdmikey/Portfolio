"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useSfx } from "@/hooks/use-sfx";
import { BootLines, PRESS_START_DELAY_MS, delayStyle } from "./boot-lines";
import { markBooted, useBooted } from "./boot-state";

/** Matches the `.boot-overlay.is-leaving` transition in globals.css. */
const FADE_OUT_MS = 280;
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"]);

/**
 * Title-card overlay shown once per browser session. Rendered on the server so the hero
 * never flashes first; `html[data-booted]` (set by the layout's inline script) hides it
 * before paint on repeat visits. Any key, click or tap presses START.
 */
export function BootScreen() {
  const booted = useBooted();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The button's click bubbles to the overlay's click; only the first counts.
  const pressed = useRef(false);
  const { play } = useSfx();

  const dismiss = useCallback(() => {
    if (booted || pressed.current) return;
    pressed.current = true;
    setLeaving(true);
    // Charge up for the countdown; LIFTOFF itself warps.
    play("power-up");
    markBooted();
    window.setTimeout(() => setGone(true), FADE_OUT_MS);
  }, [booted, play]);

  const active = !booted && !leaving;

  useEffect(() => {
    if (!active) return;
    buttonRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(e.key)) return;
      if (e.key === "Enter" || e.key === " ") e.preventDefault();
      dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, dismiss]);

  if (gone || (booted && !leaving)) return null;

  return (
    // Pinned to the dark palette: the title card is always a night sky, even in day mode.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boot screen"
      data-theme="dark"
      onClick={dismiss}
      className={cn(
        "boot-overlay boot-space fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-auto px-4 py-10",
        leaving && "is-leaving pointer-events-none",
      )}
    >
      <span aria-hidden className="boot-shooting-star" />
      <div className="relative flex w-full max-w-xl flex-col items-center">
        <BootLines />
        <div
          className="boot-line mt-14 flex flex-col items-center gap-5 text-center"
          style={delayStyle(PRESS_START_DELAY_MS)}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={dismiss}
            className="font-pixel text-px-xl sm:text-px-2xl text-coin text-glow min-h-11 cursor-pointer px-4 py-3 uppercase"
          >
            <span className="animate-blink inline-block">Press start</span>
          </button>
          <p className="text-dust text-sm">press any key · tap · click</p>
        </div>
      </div>
    </div>
  );
}
