import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { abilities } from "@/content/abilities";
import { armoryCopy } from "@/content/armory";
import { AbilityFlipCard } from "./armory/ability-flip-card";
import { SubHeading } from "./armory/sub-heading";
import { TechInventory } from "./armory/tech-inventory";
import { TrophyCase } from "./armory/trophy-case";

/** CH5: flip-able ability cards, the tech inventory and the trophy case (certifications). */
export function Armory() {
  const copy = armoryCopy;
  return (
    <Screen id="armory">
      <ChapterHeading chapter="armory" icon={<PixelIcon name="chest" size={20} />} />

      <SubHeading title={copy.abilities.title} intro={copy.abilities.intro} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {abilities.map((a) => (
          <li key={a.id} className="flex">
            <AbilityFlipCard ability={a} />
          </li>
        ))}
      </ul>

      <div className="pixel-rule my-12 sm:my-16" aria-hidden />
      <TechInventory />

      <div className="pixel-rule my-12 sm:my-16" aria-hidden />
      <TrophyCase />
    </Screen>
  );
}
