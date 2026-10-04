import { certifications } from "@/content/certifications";
import { pilotCopy, traitEmotes } from "@/content/pilot";
import { CertBadge } from "./cert-badge";
import { TraitChip } from "./trait-chip";

function Heading({ children, hint }: { children: string; hint: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
      <h3 className="font-pixel text-px-sm text-dust uppercase">{children}</h3>
      <p className="text-dust text-sm">{hint}</p>
    </div>
  );
}

export function Traits() {
  return (
    <div>
      <Heading hint={pilotCopy.traitsHint}>{pilotCopy.traitsHeading}</Heading>
      <ul className="flex flex-wrap gap-x-4 gap-y-8 pt-8" aria-label={pilotCopy.traitsHeading}>
        {traitEmotes.map((t) => (
          <li key={t.name}>
            <TraitChip trait={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Certs() {
  return (
    <div>
      <Heading hint={pilotCopy.certsHint}>{pilotCopy.certsHeading}</Heading>
      <ul className="grid gap-3 [perspective:800px] sm:grid-cols-2">
        {certifications.map((c) => (
          <li key={c.id}>
            <CertBadge cert={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
