"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Certification } from "@/types/content";
import { PixelCard } from "@/components/ui/pixel-card";
import { accentText } from "@/components/ui/accent";
import { armoryCopy } from "@/content/armory";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { IssuerLogo } from "./issuer-logo";

const SPIN_MS = 0.9;

/** A certification as a trophy, badged with its issuer's pixel logo: click to spin it and sweep a shine across. */
export function TrophyCard({ cert }: { cert: Certification }) {
  const [spins, setSpins] = useState(0);
  const reduced = useReducedMotion();
  const { trigger } = useDiscover("trophy", { accent: cert.accent, fx: "confetti", sound: "flip" });

  return (
    <PixelCard
      as="button"
      type="button"
      accent={cert.accent}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        setSpins((n) => n + 1);
        trigger(e);
      }}
      className="flex min-h-11 w-full cursor-pointer flex-col items-center p-5 text-center"
    >
      <span className="relative block overflow-hidden p-1">
        <motion.span
          className="block"
          animate={{ rotateY: reduced ? 0 : spins * 360 }}
          transition={{ duration: SPIN_MS, ease: "easeOut" }}
        >
          <IssuerLogo issuerId={cert.issuerId} />
        </motion.span>
        {spins > 0 && !reduced ? (
          <motion.span
            key={spins}
            aria-hidden
            className="bg-starlight/50 pointer-events-none absolute inset-y-0 left-0 w-3 -skew-x-12"
            initial={{ x: "-100%" }}
            animate={{ x: "400%" }}
            transition={{ duration: SPIN_MS, ease: "easeInOut" }}
          />
        ) : null}
      </span>
      <span className={cn("font-pixel text-px-md mt-4 block", accentText[cert.accent])}>
        {cert.code}
      </span>
      <span className="mt-3 block font-semibold">{cert.name}</span>
      <span className="text-dust mt-auto block pt-2 text-sm">
        {cert.issuer} · {cert.date}
      </span>
      {/* The visible text names the button (label-in-name); this only adds what pressing it does. */}
      <span className="sr-only">. {armoryCopy.trophies.polishHint}</span>
    </PixelCard>
  );
}
