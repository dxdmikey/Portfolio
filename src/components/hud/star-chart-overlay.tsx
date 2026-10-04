"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/modal";
import { useBusEvent } from "@/hooks/use-bus";
import { useSfx } from "@/hooks/use-sfx";
import { useUi } from "@/providers/ui-provider";
import { starChartCopy } from "./star-chart/copy";

function Plotting() {
  return (
    <p className="font-pixel text-px-xs text-dust grid min-h-[50dvh] place-items-center uppercase">
      {starChartCopy.loading}
    </p>
  );
}

// Code-split: the map, planets and ship cost nothing until the chart is first opened.
const StarChartPanel = dynamic(() => import("./star-chart/star-chart-panel"), {
  ssr: false,
  loading: Plotting,
});

/** Bring a chapter into view and move keyboard focus to its heading. */
function warpTo(chapterId: string) {
  const heading = document.getElementById(`${chapterId}-title`);
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  document.getElementById(chapterId)?.scrollIntoView({ block: "start" });
}

/**
 * HUD star chart: chapters and projects as planets. Picking a chapter warps the page there;
 * picking a project opens its mission briefing. Esc closes (native <dialog>), focus returns.
 */
export function StarChartOverlay() {
  const { overlay, close } = useUi();
  const { play } = useSfx();
  const open = overlay === "star-chart";
  const [current, setCurrent] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const warpTarget = useRef<string | null>(null);
  const wasOpen = useRef(false);

  useBusEvent("chapter:enter", (e) => setCurrent(e.chapter));

  // Runs before the dialog's own effect calls showModal(), so this is the opener.
  useLayoutEffect(() => {
    if (open)
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);

  // Opening whooshes; closing without a warp gets a soft blip (a warp plays its own sound).
  useEffect(() => {
    if (open && !wasOpen.current) play("whoosh");
    else if (!open && wasOpen.current && !warpTarget.current) play("blip");
    wasOpen.current = open;
  }, [open, play]);

  // After the dialog has closed: warp to the picked chapter, or hand focus back to the opener.
  useEffect(() => {
    if (open) return;
    const target = warpTarget.current;
    warpTarget.current = null;
    if (target) warpTo(target);
    else if (returnFocus.current && document.activeElement === document.body)
      returnFocus.current.focus();
    returnFocus.current = null;
  }, [open]);

  const onWarp = useCallback(
    (chapterId: string) => {
      play("warp");
      warpTarget.current = chapterId;
      close();
    },
    [play, close],
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title={starChartCopy.title}
      className="story-only w-[min(72rem,calc(100vw-1rem))]"
    >
      <StarChartPanel current={current} onWarp={onWarp} />
    </Modal>
  );
}
