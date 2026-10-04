"use client";

import { useEffect, useRef, useState } from "react";
import { activeChapterIndex, ChapterSettler, SPY_SETTLE_MS } from "@/game/scene/chapter-spy";

/** Document-relative top of each section; a missing one reuses the previous top. */
function measureTops(ids: readonly string[]): number[] {
  let prev = 0;
  return ids.map((id) => {
    const el = document.getElementById(id);
    if (el) prev = el.getBoundingClientRect().top + window.scrollY;
    return prev;
  });
}

/**
 * Scroll-position spy. Returns the section under the viewport centre, updated live (at most once
 * per frame, and React state only changes when the section does). `onSettle` fires once scrolling
 * has been quiet for `SPY_SETTLE_MS` and the section differs from the last one announced
 * (also once on load for the section in view).
 */
export function useScrollSpy<T extends string>(
  ids: readonly T[],
  onSettle: (id: T) => void,
): T | undefined {
  const [index, setIndex] = useState(0);
  const settled = useRef(onSettle);

  useEffect(() => {
    settled.current = onSettle;
  });

  useEffect(() => {
    const settler = new ChapterSettler(SPY_SETTLE_MS);
    let tops: number[] = [];
    let docHeight = 0;
    let stale = true;
    let shown = -1;
    let raf = 0;
    let timer = 0;

    const flush = () => {
      timer = 0;
      const now = performance.now();
      const wait = settler.msUntilSettled(now);
      if (wait === null) return;
      if (wait > 0) {
        timer = window.setTimeout(flush, wait);
        return;
      }
      const i = settler.settle(now);
      const id = i === null ? undefined : ids[i];
      if (id !== undefined) settled.current(id);
    };
    const sample = () => {
      raf = 0;
      // Layout is read only after a resize (stale), never on a plain scroll frame.
      if (stale) {
        tops = measureTops(ids);
        docHeight = document.documentElement.scrollHeight;
        stale = false;
      }
      const i = activeChapterIndex(window.scrollY, window.innerHeight, tops, docHeight);
      if (i !== shown) {
        shown = i;
        setIndex(i);
      }
      settler.observe(i, performance.now());
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, SPY_SETTLE_MS);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sample);
    };
    const onLayout = () => {
      stale = true;
      onScroll();
    };

    const sizes = new ResizeObserver(onLayout);
    sizes.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onLayout);
    onLayout();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      sizes.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onLayout);
    };
  }, [ids]);

  return ids[index];
}
