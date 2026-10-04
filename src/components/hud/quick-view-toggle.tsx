"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { useQuickView } from "@/hooks/use-quick-view";
import { useMounted } from "./use-mounted";
import { IconButton } from "./icon-button";

/** Toggles the recruiter-friendly quick view (no story, no animation, just facts). */
export function QuickViewToggle() {
  const { enabled, toggle } = useQuickView();
  const mounted = useMounted();
  return (
    <IconButton
      aria-label={enabled ? "Back to the voyage" : "Quick view (skip the story)"}
      aria-pressed={mounted ? enabled : undefined}
      title={enabled ? "Back to the voyage" : "Quick view"}
      onClick={toggle}
    >
      <PixelIcon name="scroll" size={16} />
    </IconButton>
  );
}
