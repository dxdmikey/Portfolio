import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { describeFlow } from "@/game/galaxy/architecture";
import { stationCopy, stationGraph, stationModules } from "@/content/station";
import { StationBrief } from "./station/station-brief";
import { PowerUpLazy } from "./station/power-up-lazy";

/** CH4: the current mission (still under construction) and the "power up the station" game. */
export function NavayugaStation() {
  return (
    <Screen id="station">
      <ChapterHeading chapter="station" icon={<PixelIcon name="rocket" size={20} />} />
      <div className="flex flex-col gap-12">
        <StationBrief />
        <section aria-labelledby="station-power-title" className="flex flex-col gap-4">
          <h3 id="station-power-title" className="font-pixel text-px-sm text-coin sm:text-px-md flex items-center gap-3 uppercase">
            <PixelIcon name="bolt" size={16} className="text-warp" />
            {stationCopy.powerTitle}
          </h3>
          <p className="text-dust max-w-[65ch]">{stationCopy.powerIntro}</p>
          <PowerUpLazy />
          {/* Text alternative for the interactive diagram. */}
          <p className="text-dust text-sm">
            <span className="font-pixel text-px-xs text-coin mr-2 uppercase">{stationCopy.flowCaption}</span>
            {describeFlow(stationModules, stationGraph.edges)}
          </p>
        </section>
      </div>
    </Screen>
  );
}
