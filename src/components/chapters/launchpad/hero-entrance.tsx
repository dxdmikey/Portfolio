"use client";

import { createContext, useContext, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useBootPhase } from "./boot-state";

/** Boot → countdown → title is the page's one orchestrated motion moment. */
const STAGGER_S = 0.14;
const LEAD_IN_S = 0.1;
const RISE_PX = 18;
const ITEM_S = 0.42;

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: STAGGER_S, delayChildren: LEAD_IN_S } },
};
const item: Variants = {
  hidden: { opacity: 0, y: RISE_PX },
  shown: { opacity: 1, y: 0, transition: { duration: ITEM_S, ease: [0.2, 0.8, 0.2, 1] } },
};
const still: Variants = {
  hidden: { opacity: 1, y: 0 },
  shown: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const VariantsContext = createContext<Variants>(item);

/** Staggers its `EntranceItem` children in once the countdown is over. */
export function HeroEntrance({ children, className }: { children: ReactNode; className?: string }) {
  const phase = useBootPhase();
  const reduced = useReducedMotion();
  return (
    <VariantsContext.Provider value={reduced ? still : item}>
      <motion.div
        initial="hidden"
        animate={phase === "ready" || reduced ? "shown" : "hidden"}
        variants={container}
        className={className}
      >
        {children}
      </motion.div>
    </VariantsContext.Provider>
  );
}

export function EntranceItem({ children, className }: { children: ReactNode; className?: string }) {
  const variants = useContext(VariantsContext);
  return (
    <motion.div data-hero-item variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
