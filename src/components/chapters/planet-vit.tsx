import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { PlanetField } from "./vit/planet-field";
import { TutorialLog } from "./vit/tutorial-log";

/** CH2: the tutorial zone. Crack four craters to read the education. */
export function PlanetVit() {
  return (
    <Screen id="vit">
      <ChapterHeading chapter="vit" icon={<PixelIcon name="planet" size={20} />} />
      <PlanetField />
      <TutorialLog />
    </Screen>
  );
}
