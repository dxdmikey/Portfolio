import Image from "next/image";
import { profile } from "@/content/profile";
import { HP, MP, pilotCopy } from "@/content/pilot";
import { StatBar } from "@/components/ui/stat-bar";
import type { Accent } from "@/types/content";
import { Barcode } from "./barcode";

function Meter({
  label,
  value,
  max,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  accent: Accent;
}) {
  return (
    <div>
      <div className="font-pixel text-px-xs text-dust mb-1 flex justify-between">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <StatBar value={value} max={max} accent={accent} label={label} />
    </div>
  );
}

export function CardFront() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
      <p className="font-pixel text-px-sm bg-plasma text-on-accent px-2 py-2 text-center uppercase">
        {pilotCopy.idHeader}
      </p>
      <div className="flex gap-4">
        <Image
          src="/images/ravi@2x.webp"
          alt={profile.photo.alt}
          width={profile.photo.width}
          height={profile.photo.height}
          sizes="144px"
          priority={false}
          className="border-plasma h-auto w-28 shrink-0 self-start border-2 sm:w-36"
        />
        <div className="min-w-0">
          <h3 className="font-pixel text-px-md text-plasma leading-relaxed">{profile.name}</h3>
          <p className="font-pixel text-px-xs text-xp mt-2 leading-relaxed">LVL {profile.level}</p>
          <p className="mt-2 text-sm">{profile.className}</p>
          <p className="text-dust text-sm">{profile.region}</p>
        </div>
      </div>
      <div className="space-y-3">
        <Meter label="HP" value={HP.value} max={HP.max} accent="xp" />
        <Meter label="MP" value={MP.value} max={MP.max} accent="plasma" />
      </div>
      <div className="mt-auto">
        <Barcode />
      </div>
    </div>
  );
}
