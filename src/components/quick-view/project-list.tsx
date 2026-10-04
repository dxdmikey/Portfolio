import { projects } from "@/content/projects";
import { quickViewCopy } from "@/content/quick-view";
import { Bullets, QuickSection } from "./quick-section";

export function ProjectList() {
  return (
    <QuickSection id="projects" title={quickViewCopy.projects}>
      <ul className="flex flex-col gap-6">
        {projects.map((p) => (
          <li key={p.id}>
            <article>
              <h3 className="text-starlight text-lg font-semibold">{p.name}</h3>
              <p className="text-dust mb-2">{p.period}</p>
              <p className="mb-2 max-w-[65ch]">
                <strong className="text-starlight">{quickViewCopy.problem}: </strong>
                {p.problem}
              </p>
              <p className="text-starlight mb-1 font-semibold">{quickViewCopy.outcome}</p>
              <Bullets items={p.outcome} />
            </article>
          </li>
        ))}
      </ul>
    </QuickSection>
  );
}
