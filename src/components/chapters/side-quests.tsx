import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { sideQuestsCopy } from "@/content/side-quests";
import { AsteroidBelt } from "./side-quests/asteroid-belt";
import { RefineryEmbed } from "./side-quests/refinery-embed";

/** CH6: practice builds as crackable asteroids, the Refinery game, and a teaser. */
export function SideQuests() {
  return (
    <Screen id="side-quests">
      <ChapterHeading chapter="side-quests" icon={<PixelIcon name="flask" size={20} />} />
      <AsteroidBelt />
      <div className="pixel-rule my-12 sm:my-16" aria-hidden />
      <section aria-labelledby="refinery-title">
        <h3 id="refinery-title" className="font-pixel text-px-md text-plasma mb-3 uppercase">
          {sideQuestsCopy.refinery.heading}
        </h3>
        <p className="text-dust mb-8 max-w-[62ch]">{sideQuestsCopy.refinery.intro}</p>
        <RefineryEmbed />
      </section>
      <p className="text-dust border-grid mt-14 border-2 border-dashed p-4 text-center text-sm">
        {sideQuestsCopy.soon}
      </p>
    </Screen>
  );
}
