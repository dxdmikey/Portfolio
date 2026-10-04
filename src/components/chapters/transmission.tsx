import { Screen } from "@/components/ui/screen";
import { ChapterHeading } from "@/components/ui/chapter-heading";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { profile } from "@/content/profile";
import { transmission } from "@/content/transmission";
import { SignalStation } from "./transmission/signal-station";

/** CH7: send a signal from the radio dish, open the contact frequencies. */
export function Transmission() {
  return (
    <Screen id="transmission" className="pb-24">
      <ChapterHeading
        chapter="transmission"
        align="center"
        icon={<PixelIcon name="sound" size={20} />}
      />
      <p className="mx-auto -mt-4 mb-10 max-w-[52ch] text-center text-lg">{transmission.intro}</p>
      <SignalStation />
      <footer className="mt-16 text-center">
        <p className="font-pixel text-px-xs text-dust leading-relaxed">
          {profile.name} {transmission.footer}
        </p>
      </footer>
    </Screen>
  );
}
