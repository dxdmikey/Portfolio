import { certifications } from "@/content/certifications";
import { armoryCopy } from "@/content/armory";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { TrophyCard } from "./trophy-card";

export function TrophyCase() {
  const copy = armoryCopy.trophies;
  return (
    <div>
      <h3 className="font-pixel text-px-md text-plasma mb-5 flex items-center gap-3 uppercase">
        <PixelIcon name="trophy" size={24} className="text-coin" />
        {copy.title}
      </h3>
      <p className="text-dust mb-5 text-sm uppercase">{copy.certsHeading}</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {certifications.map((c) => (
          <li key={c.id} className="flex">
            <TrophyCard cert={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
