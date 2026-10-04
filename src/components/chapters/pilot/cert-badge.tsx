"use client";

import { useAnimate } from "motion/react";
import type { MouseEvent } from "react";
import { useDiscover } from "@/hooks/use-discover";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { accentBorder, accentText } from "@/components/ui/accent";
import { cn } from "@/lib/cn";
import type { Certification } from "@/types/content";

const SPIN_S = 0.8;
const SHINE_S = 0.7;

/** Certification badge: click to spin 360 degrees and catch the light. */
export function CertBadge({ cert }: { cert: Certification }) {
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const reduced = useReducedMotion();
  const { trigger } = useDiscover("certs", { accent: cert.accent, sound: "flip" });

  const onClick = (e: MouseEvent<HTMLElement>) => {
    trigger(e);
    if (reduced || !scope.current) return;
    void animate(scope.current, { rotateY: [0, 360] }, { duration: SPIN_S, ease: "easeInOut" });
    void animate(
      ".cert-shine",
      { x: ["-120%", "320%"], opacity: [0, 1, 0] },
      { duration: SHINE_S, delay: 0.1 },
    );
  };

  return (
    <button
      ref={scope}
      type="button"
      onClick={onClick}
      className={cn(
        "bg-nebula shadow-pixel relative min-h-11 w-full cursor-pointer overflow-hidden border-2 p-3 text-left [transform-style:preserve-3d]",
        accentBorder[cert.accent],
      )}
    >
      <span className={cn("font-pixel text-px-sm block", accentText[cert.accent])}>
        {cert.code}
      </span>
      <span className="mt-2 block text-sm leading-snug">{cert.name}</span>
      <span className="text-dust mt-1 block text-xs">
        {cert.issuer} · {cert.date}
      </span>
      <span
        aria-hidden
        className="cert-shine bg-starlight/40 pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 opacity-0"
      />
    </button>
  );
}
