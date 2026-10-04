"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { useDiscoveryCount } from "@/hooks/use-discover";

/** "◆ 4/26" — how many clickable secrets the visitor has found. */
export function DiscoveryCounter() {
  const { found, total } = useDiscoveryCount();
  return (
    <p
      className="font-pixel text-px-xs text-warp story-only flex shrink-0 items-center gap-1.5"
      title="Discoveries: click things to find them"
    >
      <PixelIcon name="star" size={10} />
      <span aria-hidden>
        {found}/{total}
      </span>
      <span className="sr-only">{`${found} of ${total} discoveries found`}</span>
    </p>
  );
}
