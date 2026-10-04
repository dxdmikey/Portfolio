"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { useMusic } from "@/hooks/use-music";
import { IconButton } from "./icon-button";

/** Background music on/off (on by default, remembered; silent while sound is muted). */
export function MusicToggle() {
  const { audible, toggle } = useMusic();
  return (
    <IconButton aria-label="Background music" aria-pressed={audible} onClick={toggle}>
      <PixelIcon name={audible ? "music" : "music-off"} size={16} />
    </IconButton>
  );
}
