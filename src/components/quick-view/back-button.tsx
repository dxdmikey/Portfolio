"use client";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { quickViewCopy } from "@/content/quick-view";
import { useQuickView } from "@/hooks/use-quick-view";

/** The only client leaf in quick view. */
export function BackButton() {
  const { toggle } = useQuickView();
  return (
    <PixelButton variant="coin" onClick={toggle} aria-describedby="quick-back-hint">
      <PixelIcon name="rocket" size={16} />
      {quickViewCopy.back}
      <span id="quick-back-hint" className="sr-only">
        {quickViewCopy.backHint}
      </span>
    </PixelButton>
  );
}
