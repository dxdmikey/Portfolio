"use client";

import { motion } from "motion/react";
import { Tag } from "@/components/ui/tag";
import { dossier, pilotCopy, type Segment } from "@/content/pilot";
import { profile } from "@/content/profile";

/** The stamp starts oversized and tilted, slams down, then the card shakes. */
const STAMP_FROM = { scale: 2.2, rotate: -16, opacity: 0 };
const STAMP_TO = { scale: 1, rotate: -3, opacity: 1 };
const STAMP_DELAY_S = 0.4;
const STAMP_S = 0.18;

/** Renders typed segments as text and <strong> highlights (no raw HTML). */
function Rich({ segments }: { segments: readonly Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.strong ? (
          <strong key={i} className="text-plasma font-semibold">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

interface Props {
  flipped: boolean;
  reduced: boolean;
  /** Called when the stamp lands (the card shakes and a sound plays). */
  onSlam: () => void;
}

/** Back of the ID card: a scannable "Pilot dossier" instead of a paragraph. */
export function CardBack({ flipped, reduced, onSlam }: Props) {
  return (
    <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <p className="font-pixel text-px-sm bg-warp text-on-accent px-2 py-2 text-center uppercase">
        {pilotCopy.backHeading}
      </p>
      <p className="font-pixel text-px-xs text-coin leading-relaxed">{dossier.headline}</p>
      <ul className="space-y-2 text-sm leading-snug">
        {dossier.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-warp">
              ▸
            </span>
            <span>
              <Rich segments={b} />
            </span>
          </li>
        ))}
      </ul>
      <p className="border-grid bg-void border-2 px-2 py-1.5 text-sm">
        <span className="font-pixel text-px-xs text-xp mr-2 uppercase">
          {pilotCopy.currentlyLabel}
        </span>
        <Rich segments={dossier.currently} />
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={pilotCopy.skillsLabel}>
        {dossier.skills.map((s) => (
          <li key={s}>
            <Tag className="border-plasma text-plasma">{s}</Tag>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="text-sm">
          <span className="font-pixel text-px-xs text-dust mr-2 uppercase">
            {pilotCopy.languagesLabel}
          </span>
          {profile.languages.join(" · ")}
        </p>
        <motion.p
          initial={false}
          animate={flipped || reduced ? STAMP_TO : STAMP_FROM}
          transition={
            flipped && !reduced
              ? { delay: STAMP_DELAY_S, duration: STAMP_S, ease: "easeIn" }
              : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (flipped && !reduced) onSlam();
          }}
          className="font-pixel text-px-xs border-xp text-xp shrink-0 border-4 border-double px-2 py-2 uppercase"
        >
          {pilotCopy.stamp}
        </motion.p>
      </div>
    </div>
  );
}
