import { quests } from "@/content/quests";
import { quickViewCopy } from "@/content/quick-view";
import type { QuestEntry } from "@/types/content";
import { StatusBadge } from "@/components/ui/status-badge";
import { Bullets, QuickSection } from "./quick-section";

const roles: readonly QuestEntry[] = quests.filter((q) => q.status === "active" || q.status === "completed");

export function ExperienceList() {
  return (
    <QuickSection id="experience" title={quickViewCopy.experience}>
      <ol className="flex flex-col gap-8">
        {roles.map((q) => (
          <li key={q.id}>
            <article>
              <h3 className="text-starlight text-lg font-semibold">
                {q.title}
                {q.status === "active" ? (
                  <StatusBadge accent="plasma" className="ml-3 align-middle">
                    {quickViewCopy.current}
                  </StatusBadge>
                ) : null}
              </h3>
              <p className="text-dust mb-3">
                {q.org} · {q.location} · {q.period}
              </p>
              <Bullets items={q.highlights} />
              {q.subQuests?.map((s) => (
                <div key={s.title} className="border-grid mt-4 border-l-2 pl-4">
                  <h4 className="text-starlight font-semibold">{s.title}</h4>
                  <p className="text-dust mb-2 text-sm">{s.period}</p>
                  <Bullets items={s.highlights} />
                </div>
              ))}
            </article>
          </li>
        ))}
      </ol>
    </QuickSection>
  );
}
