"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { novaCopy } from "@/content/nova";
import { cn } from "@/lib/cn";
import { NovaDialogue } from "./nova-dialogue";
import { NovaRobot } from "./nova-robot";
import { useBootPhase } from "@/components/chapters/launchpad/boot-state";
import { useFieldFocus } from "./use-field-focus";
import { useNova } from "./use-nova";

const POP = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8 },
};
const POP_S = 0.18;

/**
 * NOVA, the co-pilot: a pixel robot docked bottom-left (inside the safe area) with a compact RPG
 * dialogue box beside it. Narrates chapters, discoveries and game results from the bus.
 * Appears once the launch sequence is done and steps aside while a text field has focus. Hidden in quick view; text is mirrored into a
 * polite live region for screen readers.
 */
export function NovaDock() {
  const reduced = useReducedMotion();
  const nova = useNova(reduced);
  const away = useFieldFocus();
  // NOVA waits for the boot screen and countdown: lines offered meanwhile stay queued (the
  // typewriter only starts once the box can be seen), and nothing paints under the overlay.
  const ready = useBootPhase() === "ready";
  const hidden = away || !ready;

  return (
    <aside
      aria-label={novaCopy.regionLabel}
      className={cn(
        "story-only pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] z-[45] flex items-end gap-1.5 transition-opacity duration-150 sm:bottom-5 sm:left-5 sm:gap-3",
        hidden && "invisible opacity-0",
      )}
      onPointerEnter={() => nova.setHovering(true)}
      onPointerLeave={() => nova.setHovering(false)}
      onFocus={() => nova.setHovering(true)}
      onBlur={() => nova.setHovering(false)}
    >
      <button
        type="button"
        onClick={nova.poke}
        aria-label={nova.muted ? novaCopy.wakeLabel : novaCopy.robotLabel}
        className={cn(
          "pointer-events-auto grid min-h-11 min-w-11 cursor-pointer place-items-center p-1 transition-transform duration-150 hover:-translate-y-0.5",
          nova.muted && "opacity-70",
        )}
      >
        <NovaRobot talking={nova.typing} sleeping={nova.muted} animate={!reduced} />
      </button>

      <AnimatePresence>
        {nova.open && nova.line && ready ? (
          <motion.div
            key="dialogue"
            className="pointer-events-none origin-bottom-left"
            initial={reduced ? false : POP.initial}
            animate={POP.animate}
            exit={reduced ? undefined : POP.exit}
            transition={{ duration: POP_S }}
          >
            <NovaDialogue
              line={nova.line}
              instant={reduced}
              onDone={nova.doneTyping}
              onHide={nova.hide}
              onMute={nova.mute}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p aria-live="polite" className="sr-only">
        {nova.muted || !ready ? "" : nova.line?.text}
      </p>
    </aside>
  );
}
