import { refineryCopy } from "@/content/refinery";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";

const { start } = refineryCopy;

/** Rules screen. The game never auto-starts. */
export function StartPanel({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <PixelCard className="flex flex-col gap-5 p-5 sm:p-6">
      <h4 className="font-pixel text-px-sm text-coin leading-relaxed uppercase">{start.heading}</h4>
      <ul className="flex max-w-[65ch] list-['›_'] flex-col gap-2 pl-4">
        {start.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li className="text-dust">{start.keyboard}</li>
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <PixelButton variant="coin" onClick={onStart} className="min-h-14">
          {start.button}
        </PixelButton>
        {best > 0 ? (
          <p className="font-pixel text-px-xs text-dust uppercase">
            {start.best} <span className="text-coin">{best}</span>
          </p>
        ) : null}
      </div>
    </PixelCard>
  );
}
