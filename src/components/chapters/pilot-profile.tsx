import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { IdCard } from "./pilot/id-card";
import { StatsGrid } from "./pilot/stats-grid";
import { Certs, Traits } from "./pilot/pilot-extras";

/** CH1: the captain's ID card (flips), attributes, traits and certification badges. */
export function PilotProfile() {
  return (
    <Screen id="pilot">
      <ChapterHeading chapter="pilot" icon={<PixelIcon name="user" size={20} />} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
        <IdCard />
        <div className="space-y-8">
          <StatsGrid />
          <Traits />
          <Certs />
        </div>
      </div>
    </Screen>
  );
}
