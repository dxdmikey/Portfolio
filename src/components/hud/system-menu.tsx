"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";
import { MusicToggle } from "./music-toggle";
import { SoundToggle } from "./sound-toggle";
import { ThemeToggle } from "./theme-toggle";

function SystemButtons() {
  return (
    <>
      <ThemeToggle />
      <SoundToggle />
      <MusicToggle />
    </>
  );
}

/**
 * Theme, sound and music. Inline from md up; on phones they fold into one
 * "System" button with a small drop-down so the chapter pips keep their room.
 */
export function SystemMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="hidden items-center gap-1.5 md:flex">
        <SystemButtons />
      </div>
      <div ref={ref} className="relative md:hidden">
        <IconButton
          aria-label="System menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <PixelIcon name="star" size={14} />
        </IconButton>
        <div
          className={cn(
            "bg-nebula border-grid shadow-pixel absolute top-full right-0 mt-2 flex gap-1.5 border-2 p-1.5",
            !open && "hidden",
          )}
        >
          <SystemButtons />
        </div>
      </div>
    </>
  );
}
