"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useGame } from "@/providers/game-provider";

const serverSnapshot = () => false;
const ATTR = "quick";

/**
 * Quick view on/off. CSS hides story layers via <html data-quick>. The inline script in
 * layout sets the attribute before first paint; after that only `toggle` writes it.
 * (Mirroring in an effect would briefly clear it during hydration and flash the story.)
 */
export function useQuickView() {
  const { quickView, sfx } = useGame();
  const enabled = useSyncExternalStore(quickView.subscribe, quickView.getSnapshot, serverSnapshot);

  const toggle = useCallback(() => {
    quickView.toggle();
    sfx.play("toggle");
    if (quickView.getSnapshot()) document.documentElement.dataset[ATTR] = "1";
    else delete document.documentElement.dataset[ATTR];
    window.scrollTo({ top: 0 });
  }, [quickView, sfx]);

  return { enabled, toggle };
}
