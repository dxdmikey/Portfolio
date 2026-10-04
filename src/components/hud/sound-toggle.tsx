"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { useSfx } from "@/hooks/use-sfx";
import { IconButton } from "./icon-button";

/** Master sound on/off: effects and music (on by default, remembered). */
export function SoundToggle() {
  const { enabled, setEnabled } = useSfx();
  return (
    <IconButton aria-label="Sound" aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
      <PixelIcon name={enabled ? "sound" : "mute"} size={16} />
    </IconButton>
  );
}
