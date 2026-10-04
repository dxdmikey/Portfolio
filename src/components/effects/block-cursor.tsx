"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const FINE_POINTER = "(pointer: fine)";
/** Fraction of the remaining distance covered per frame — the trailing "lag". */
const EASE = 0.22;
/** Stop the loop once the block is this close (px) to the pointer. */
const SETTLE_PX = 0.3;
/** Sit just below-right of the arrow tip, like a text caret following the mouse. */
const OFFSET_X = 14;
const OFFSET_Y = 16;
const INTERACTIVE = "a, button, [role='button'], summary, input, select, textarea, label";

function subscribeFine(fn: () => void) {
  const mql = window.matchMedia(FINE_POINTER);
  mql.addEventListener("change", fn);
  return () => mql.removeEventListener("change", fn);
}

/** Decorative blinking block that trails the mouse. Never replaces the native cursor. */
export function BlockCursor() {
  const fine = useSyncExternalStore(subscribeFine, () => window.matchMedia(FINE_POINTER).matches, () => false);
  const reduced = useReducedMotion();
  if (!fine || reduced) return null;
  return <TrailingBlock />;
}

function TrailingBlock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let seen = false;

    const step = () => {
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const settled = Math.abs(target.x - pos.x) < SETTLE_PX && Math.abs(target.y - pos.y) < SETTLE_PX;
      raf = settled ? 0 : requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX + OFFSET_X;
      target.y = e.clientY + OFFSET_Y;
      if (!seen) {
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      el.dataset.visible = "true";
      const hit = e.target instanceof Element && e.target.closest(INTERACTIVE) !== null;
      el.dataset.active = String(hit);
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget === null) el.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-visible="false"
      data-active="false"
      className="group pointer-events-none fixed top-0 left-0 z-[70] opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100"
    >
      <span
        className={cn(
          "animate-blink bg-xp block h-4 w-2.5 origin-top-left transition-[scale,background-color] duration-150",
          "group-data-[active=true]:bg-plasma group-data-[active=true]:scale-150",
        )}
      />
    </div>
  );
}
