"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { craters, vitCopy } from "@/content/vit";
import { useGame } from "@/providers/game-provider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CraterButton } from "./crater-button";
import { FactCards, factId } from "./fact-cards";
import { Flag, PlanetArt } from "./planet-art";

const LANDED_THRESHOLD = 0.4;

/** True once the element has scrolled into view (never flips back). */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSeen(true);
      },
      { threshold: LANDED_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/** The planet, its four craters, the fact cards and the completion banner. */
export function PlanetField() {
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [ref, seen] = useSeen<HTMLDivElement>();
  const reduced = useReducedMotion();
  const { bus } = useGame();
  const landed = reduced || seen;
  const complete = opened.size === craters.length;

  const onOpen = (key: string, point: { x: number; y: number }) => {
    if (opened.has(key)) return;
    const next = new Set(opened).add(key);
    setOpened(next);
    if (next.size === craters.length) {
      bus.emit({ type: "fx", kind: "confetti", x: point.x, y: point.y, accent: "xp" });
      bus.emit({ type: "nova:say", text: vitCopy.completeNote });
    }
  };

  return (
    <div>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div ref={ref} className="relative mx-auto aspect-square w-full max-w-md">
          <PlanetArt />
          <motion.div
            className="absolute top-[1%] left-[44%] flex items-end gap-1"
            initial={false}
            animate={landed ? { y: 0, opacity: 1 } : { y: -48, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 160, damping: 12, delay: 0.3 }
            }
          >
            <Flag />
            <span className="font-pixel text-px-xs bg-xp text-on-accent mb-1 px-1.5 py-1">
              {vitCopy.landed}
            </span>
          </motion.div>
          {craters.map((c) => (
            <CraterButton
              key={c.key}
              crater={c}
              open={opened.has(c.key)}
              factId={factId(c.key)}
              onOpen={onOpen}
            />
          ))}
        </div>
        <div>
          <p className="text-dust mb-3 text-sm">{vitCopy.hint}</p>
          <FactCards opened={opened} reduced={reduced} />
        </div>
      </div>
      <div aria-live="polite">
        {complete ? (
          <motion.p
            initial={reduced ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-pixel text-px-md border-xp bg-void text-xp mt-8 border-4 border-double px-4 py-4 text-center"
          >
            {vitCopy.complete}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
