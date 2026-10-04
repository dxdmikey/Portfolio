import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { NebulaExplorer } from "./nebula/nebula-explorer";

/** CH3: WinWire as two derelict stations with orbiting sub-missions and mission debriefs. */
export function WinwireNebula() {
  return (
    <Screen id="nebula">
      <ChapterHeading chapter="nebula" icon={<PixelIcon name="star" size={20} />} />
      <NebulaExplorer />
    </Screen>
  );
}
