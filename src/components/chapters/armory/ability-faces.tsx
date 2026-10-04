import type { Ability } from "@/types/content";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { StatBar } from "@/components/ui/stat-bar";
import { Tag } from "@/components/ui/tag";
import { accentBorder, accentText } from "@/components/ui/accent";
import { abilityUsage, armoryCopy } from "@/content/armory";
import { cn } from "@/lib/cn";

const MAX_LEVEL = 99;
const copy = armoryCopy.abilities;

/** Front: icon, name, level bar, tier and what it means. Spans only, since it lives inside a button. */
export function AbilityFront({ ability }: { ability: Ability }) {
  const { accent } = ability;
  return (
    <span className="flex h-full flex-col gap-4">
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "bg-void flex size-10 shrink-0 items-center justify-center border-2",
            accentBorder[accent],
            accentText[accent],
          )}
        >
          <PixelIcon name="bolt" size={20} />
        </span>
        <span className={cn("text-lg leading-tight font-semibold", accentText[accent])}>
          {ability.name}
        </span>
      </span>
      <StatBar
        value={ability.level}
        max={MAX_LEVEL}
        accent={accent}
        label={`${ability.name} level`}
        segmented
      />
      <span className="font-pixel text-px-xs flex justify-between">
        <span className="text-starlight">LV {ability.level}</span>
        <span className={accentText[accent]}>{ability.tier}</span>
      </span>
      <span className="text-starlight">{ability.summary}</span>
      <span className="text-dust mt-auto text-sm">{copy.hint}</span>
    </span>
  );
}

/** Back: what it means, the spells, and where it was actually used. */
export function AbilityBack({ ability }: { ability: Ability }) {
  const { accent } = ability;
  return (
    <span className="flex h-full flex-col gap-3">
      <span className="flex flex-wrap gap-2">
        {ability.spells.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </span>
      <span className="mt-auto block">
        <span className={cn("font-pixel text-px-xs mb-1 block uppercase", accentText[accent])}>
          {copy.whereUsed}
        </span>
        <span className="text-sm">{abilityUsage[ability.id]}</span>
      </span>
    </span>
  );
}
