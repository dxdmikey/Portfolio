import { profile } from "@/content/profile";
import { Screen } from "@/components/ui/screen";
import { Constellation } from "./launchpad/constellation";
import { Countdown } from "./launchpad/countdown";
import { EntranceItem, HeroEntrance } from "./launchpad/hero-entrance";
import { HeroStats } from "./launchpad/hero-stats";
import { LaunchActions } from "./launchpad/launch-actions";
import { LaunchTower } from "./launchpad/launch-tower";
import { PokeName } from "./launchpad/poke-name";
import { ScrollHint } from "./launchpad/scroll-hint";
import { SpriteBuddy } from "./launchpad/sprite-buddy";

/**
 * CH0: the title screen. Everything on it is poke-able: the name, pixel Ravi, the rocket
 * on its tower and a hidden constellation. On wide screens (xl+) the tower and
 * constellation flank the title; below that they sit side by side under it.
 */
export function Launchpad() {
  return (
    <Screen
      id="launchpad"
      bleed
      className="flex min-h-[100svh] flex-col items-center justify-center px-4 pt-16 pb-28 text-center"
    >
      <Countdown />
      <HeroEntrance className="flex w-full max-w-5xl flex-col items-center gap-6 sm:gap-8">
        <EntranceItem>
          <p className="font-pixel text-px-xs sm:text-px-sm bg-coin text-on-accent shadow-pixel px-3 py-2 tracking-wider">
            PORTFOLIO.EXE — {profile.version}
          </p>
        </EntranceItem>
        <EntranceItem className="w-full">
          <PokeName />
          <p className="font-pixel text-px-sm sm:text-px-md text-xp mt-5 tracking-widest uppercase">
            <span aria-hidden>✦ </span>
            {profile.headline}
            <span aria-hidden> ✦</span>
          </p>
        </EntranceItem>
        <EntranceItem>
          <SpriteBuddy />
        </EntranceItem>
        <EntranceItem>
          <HeroStats />
        </EntranceItem>
        <EntranceItem className="flex flex-col items-center gap-8">
          <p className="text-dust max-w-[46ch] text-lg">{profile.tagline}</p>
          <LaunchActions />
        </EntranceItem>
      </HeroEntrance>
      <div className="mt-14 flex flex-wrap items-end justify-center gap-x-10 gap-y-12 xl:contents">
        <LaunchTower className="xl:absolute xl:right-[5%] xl:bottom-16 2xl:right-[9%]" />
        <Constellation className="xl:absolute xl:top-[30%] xl:left-[4%] 2xl:left-[8%]" />
      </div>
      <ScrollHint />
    </Screen>
  );
}
