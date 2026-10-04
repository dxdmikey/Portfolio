import { BootScreen } from "@/components/chapters/launchpad/boot-screen";
import { Launchpad } from "@/components/chapters/launchpad";
import { PilotProfile } from "@/components/chapters/pilot-profile";
import { PlanetVit } from "@/components/chapters/planet-vit";
import { WinwireNebula } from "@/components/chapters/winwire-nebula";
import { NavayugaStation } from "@/components/chapters/navayuga-station";
import { Armory } from "@/components/chapters/armory";
import { SideQuests } from "@/components/chapters/side-quests";
import { Transmission } from "@/components/chapters/transmission";
import { QuickView } from "@/components/quick-view/quick-view";
import { Hud } from "@/components/hud/hud";
import { StarChartOverlay } from "@/components/hud/star-chart-overlay";
import { SpaceScene } from "@/components/scene/space-scene";
import { DeferredLayers } from "@/components/scene/deferred-layers";

/**
 * The Voyage: chapters in flight order (must match `content/story.ts`).
 * `.story-only` layers disappear in quick view; `.quick-only` appears instead.
 */
export default function Home() {
  return (
    <>
      {/* overflow-x-clip: decorative overflow (FX, shards) never widens the phone layout viewport. */}
      <div className="story-only overflow-x-clip">
        <SpaceScene />
        <BootScreen />
        <Launchpad />
      </div>
      <Hud />
      {/* The clip sits outside #main because the "shake" FX translates #main itself. */}
      <div className="overflow-x-clip">
        <main id="main">
          <div className="story-only">
            <PilotProfile />
            <PlanetVit />
            <WinwireNebula />
            <NavayugaStation />
            <Armory />
            <SideQuests />
            <Transmission />
          </div>
          <div className="quick-only">
            <QuickView />
          </div>
        </main>
      </div>
      <DeferredLayers />
      <StarChartOverlay />
    </>
  );
}
