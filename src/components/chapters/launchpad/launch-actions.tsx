"use client";

import { launchpad } from "@/content/launchpad";
import { buttonClasses } from "@/components/ui/pixel-button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useQuickView } from "@/hooks/use-quick-view";

/** Title-screen choices: fly the story or switch to quick view. */
export function LaunchActions() {
  const { toggle } = useQuickView();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a href="#pilot" className={buttonClasses("coin")}>
          <PixelIcon name="rocket" size={14} />
          {launchpad.ctas.start}
        </a>
        <button type="button" onClick={toggle} className={buttonClasses("primary")}>
          <PixelIcon name="scroll" size={14} />
          {launchpad.ctas.quickView}
        </button>
      </div>
    </div>
  );
}
