"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { useUi } from "@/providers/ui-provider";
import { IconButton } from "./icon-button";
import { ChapterTracker } from "./chapter-tracker";
import { QuickViewToggle } from "./quick-view-toggle";
import { SystemMenu } from "./system-menu";
import { XpBar } from "./xp-bar";
import { DiscoveryCounter } from "./discovery-counter";

/** Sticky heads-up display: EXP bar, discoveries, chapter tracker and system toggles. */
export function Hud() {
  const { open } = useUi();
  return (
    // Phones: solid, no backdrop blur (re-blurring the 60fps sky costs every scroll frame).
    <header className="bg-void sm:bg-void/90 sticky top-0 z-40 sm:backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-3 pt-2.5 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <XpBar />
          </div>
          <DiscoveryCounter />
        </div>
        <div className="mt-1 flex items-center gap-1 sm:gap-2">
          <ChapterTracker />
          <div className="flex shrink-0 items-center gap-1 py-1 sm:gap-1.5">
            <IconButton
              aria-label="Open star chart"
              className="story-only"
              onClick={() => open("star-chart")}
            >
              <PixelIcon name="planet" size={16} />
            </IconButton>
            <QuickViewToggle />
            <SystemMenu />
          </div>
        </div>
      </div>
      <div aria-hidden className="pixel-rule" />
    </header>
  );
}
