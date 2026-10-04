import { profile } from "@/content/profile";

const STAT_ROWS = [
  [
    { label: "Class", value: profile.className },
    { label: "Region", value: profile.region },
  ],
  [
    { label: "Guild", value: profile.guild },
    { label: "Exp", value: profile.experience },
  ],
] as const;

/**
 * Character-sheet lines under the sprite: `CLASS: … | REGION: …` (one stat per line on phones,
 * where a long value wraps whole and centred instead of hanging beside its label).
 * One <dl> per visual row so each dt/dd pair sits in a single wrapper div (valid per axe/HTML).
 */
export function HeroStats() {
  return (
    <div className="font-pixel text-px-xs sm:text-px-sm flex flex-col items-center gap-3 leading-loose">
      {STAT_ROWS.map((row) => (
        <dl
          key={row[0].label}
          className="flex flex-col items-center gap-y-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-center sm:gap-x-3"
        >
          {row.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-wrap items-baseline justify-center gap-x-2 text-center"
            >
              {i > 0 ? (
                <span aria-hidden className="text-grid hidden sm:inline">
                  |
                </span>
              ) : null}
              <dt className="text-xp uppercase">{stat.label}:</dt>
              <dd className="text-starlight">{stat.value}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}
