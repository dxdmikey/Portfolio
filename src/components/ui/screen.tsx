"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useGame } from "@/providers/game-provider";
import { VISIT_ROOT_MARGIN } from "@/lib/constants";

interface ScreenProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Full-bleed sections (galaxy map) skip the centred content column. */
  bleed?: boolean;
}

/**
 * One page "screen". Registers a visit when it scrolls into view, which feeds the
 * XP bar.
 */
export function Screen({ id, children, className, bleed = false }: ScreenProps) {
  const ref = useRef<HTMLElement>(null);
  const { visits } = useGame();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        visits.visit(id);
      },
      { rootMargin: VISIT_ROOT_MARGIN, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, visits]);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative py-12 sm:py-16",
        !bleed && "mx-auto w-full max-w-6xl px-4 sm:px-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
