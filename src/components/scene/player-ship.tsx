"use client";

import { useEffect, useRef } from "react";
import { useBusEvent } from "@/hooks/use-bus";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ShipArt, SHIP_H, SHIP_W } from "./ship-art";

const SHIP_PX = 27;
const SHIP_HEIGHT_PX = (SHIP_PX / SHIP_W) * SHIP_H;
const TOP_MARGIN = 112;
const BOTTOM_MARGIN = 140;
const TRAIL = 5;
const TRAIL_GAP_PX = 10;
const MS_PER_S = 1000;
/** deg of tilt per px/s of scroll speed, and its cap. */
const TILT_PER_SPEED = 0.012;
const MAX_TILT = 18;
const SMOOTHING = 0.18;
const THRUST_SPEED = 40;
const SETTLE_SPEED = 2;
/** Auto-show once this fraction of the launchpad has scrolled by. */
const SHOW_AFTER = 0.6;
/** The ship is only displayed at `xl` (CSS `hidden xl:block`); skip its scroll work below that. */
const SHOWN_QUERY = "(min-width: 80rem)";

/**
 * The rocket from the launchpad, flying down the right edge as you scroll: position =
 * page progress, tilt = scroll speed, flame + trail while moving. Decorative (xl+ only,
 * where the margin is wide enough not to cover content).
 */
export function PlayerShip() {
  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const trail = useRef<(HTMLSpanElement | null)[]>([]);
  const launched = useRef(false);
  const show = useRef<() => void>(() => {});
  const reduced = useReducedMotion();

  useBusEvent("discover", (e) => {
    if (e.id !== "rocket") return;
    launched.current = true;
    show.current();
  });

  useEffect(() => {
    const el = wrap.current;
    const ship = body.current;
    if (!el || !ship) return;
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = 0;
    let speed = 0;

    const travel = () => window.innerHeight - TOP_MARGIN - BOTTOM_MARGIN - SHIP_HEIGHT_PX;
    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    const updateVisibility = () => {
      const pad = document.getElementById("launchpad");
      const past = pad ? window.scrollY > pad.offsetHeight * SHOW_AFTER : false;
      el.dataset.shown = String(launched.current || past);
    };
    show.current = updateVisibility;

    const tick = (now: number) => {
      raf = 0;
      const dt = lastT ? (now - lastT) / MS_PER_S : 0;
      lastT = now;
      const y = window.scrollY;
      const instant = dt > 0 ? (y - lastY) / dt : 0;
      lastY = y;
      speed += (instant - speed) * SMOOTHING;
      const top = TOP_MARGIN + progress() * travel();
      el.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0)`;
      updateVisibility();
      if (reduced) return;
      const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, speed * TILT_PER_SPEED));
      ship.style.transform = `rotate(${(180 - tilt).toFixed(2)}deg)`;
      el.dataset.thrust = String(Math.abs(speed) > THRUST_SPEED);
      trail.current.forEach((dot, i) => {
        if (!dot) return;
        dot.style.opacity = String(Math.min(1, Math.abs(speed) / (THRUST_SPEED * (i + 2))));
        // Trail streams behind the direction of travel: above when diving, below when climbing.
        const offset = speed >= 0 ? -(i + 1) * TRAIL_GAP_PX : SHIP_HEIGHT_PX + i * TRAIL_GAP_PX;
        dot.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      if (Math.abs(speed) > SETTLE_SPEED) raf = requestAnimationFrame(tick);
    };
    const shown = window.matchMedia(SHOWN_QUERY);
    const kick = () => {
      if (!raf && shown.matches) raf = requestAnimationFrame(tick);
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    shown.addEventListener("change", kick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      shown.removeEventListener("change", kick);
    };
  }, [reduced]);

  return (
    <div
      ref={wrap}
      aria-hidden
      data-shown="false"
      className="player-ship pointer-events-none fixed top-0 right-5 z-30 hidden xl:block"
    >
      <div className="relative">
        {Array.from({ length: TRAIL }, (_, i) => (
          <span
            key={i}
            ref={(node) => {
              trail.current[i] = node;
            }}
            className="bg-coin absolute top-0 left-1/2 -ml-[3px] block size-[6px] opacity-0"
          />
        ))}
        <div ref={body} className="relative rotate-180 transition-transform duration-150 ease-out">
          <ShipArt size={SHIP_PX} />
        </div>
      </div>
    </div>
  );
}
