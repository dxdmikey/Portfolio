import { abilities } from "@/content/abilities";
import { certifications, education } from "@/content/certifications";
import { inventory } from "@/content/inventory";
import { quickViewCopy } from "@/content/quick-view";
import { Tag } from "@/components/ui/tag";
import { QuickSection } from "./quick-section";

export function Skills() {
  return (
    <QuickSection id="skills" title={quickViewCopy.skills}>
      <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {abilities.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between gap-4">
            <span>{a.name}</span>
            <span className="text-dust text-sm">
              <span className="sr-only">{quickViewCopy.levelOf(a.level)}, </span>
              <span aria-hidden>LV {a.level}</span> · {a.tier.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
    </QuickSection>
  );
}

export function Tools() {
  return (
    <QuickSection id="tools" title={quickViewCopy.tools}>
      <ul className="flex flex-wrap gap-2">
        {inventory.map((i) => (
          <li key={i.id}>
            <Tag>{i.name}</Tag>
          </li>
        ))}
      </ul>
    </QuickSection>
  );
}

export function Certifications() {
  return (
    <QuickSection id="certifications" title={quickViewCopy.certifications}>
      <ul className="flex flex-col gap-2">
        {certifications.map((c) => (
          <li key={c.id}>
            <span className="text-starlight font-semibold">{c.name}</span>
            <span className="text-dust">
              {" "}
              · {c.issuer} · {c.date}
            </span>
          </li>
        ))}
      </ul>
    </QuickSection>
  );
}

export function EducationBlock() {
  return (
    <QuickSection id="education" title={quickViewCopy.education}>
      <p className="text-starlight font-semibold">{education.degree}</p>
      <p className="text-dust">
        {education.school}, {education.location} · {education.period} · {education.grade}
      </p>
    </QuickSection>
  );
}
