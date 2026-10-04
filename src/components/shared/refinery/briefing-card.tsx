import { useId, type RefObject } from "react";
import { refineryCopy } from "@/content/refinery";
import { buttonClasses } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { levelAt, newRules, stageId } from "@/game/refinery/levels";

const { briefing, stages, rules } = refineryCopy;
const MS_PER_S = 1000;

interface BriefingCardProps {
  stage: number;
  relaxed: boolean;
  beginRef: RefObject<HTMLButtonElement | null>;
  onBegin: () => void;
}

/** The rule card that opens each level (what to quarantine) and the incident round. */
export function BriefingCard({ stage, relaxed, beginRef, onBegin }: BriefingCardProps) {
  const bodyId = useId();
  const level = levelAt(stage);
  const copy = stages[stageId(stage)];
  const fresh = new Set(newRules(stage));
  return (
    <PixelCard accent={level ? "plasma" : "warp"} className="flex flex-col gap-4 p-5 sm:p-6">
      <p className="font-pixel text-px-xs text-dust uppercase">{copy.tag}</p>
      <h4 className="font-pixel text-px-sm text-coin leading-relaxed uppercase">{copy.name}</h4>
      <div id={bodyId} className="flex max-w-[65ch] flex-col gap-3">
        <p>{copy.body}</p>
        {level ? (
          <>
            <p className="text-dust">{briefing.quarantine}:</p>
            <ul className="flex flex-col gap-1.5">
              {level.defects.map((d) => (
                <li key={d} className="flex items-baseline gap-2">
                  <span aria-hidden className="text-danger">
                    ■
                  </span>
                  <span>{rules[d]}</span>
                  {fresh.has(d) ? (
                    <span className="font-pixel text-px-xs border-xp text-xp border px-1 uppercase">{briefing.isNew}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="font-pixel text-px-xs text-dust uppercase">
              {relaxed ? briefing.relaxedSpeed : briefing.speed(level.travelMs / MS_PER_S)}
            </p>
          </>
        ) : null}
      </div>
      <div>
        <button
          ref={beginRef}
          type="button"
          aria-describedby={bodyId}
          onClick={onBegin}
          className={buttonClasses("coin", "min-h-14")}
        >
          {level ? briefing.beginLevel : briefing.beginIncidents}
        </button>
      </div>
    </PixelCard>
  );
}
