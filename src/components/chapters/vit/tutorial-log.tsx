import { craters, vitCopy } from "@/content/vit";

/** Always-visible facts, so nobody has to play to read the education. */
export function TutorialLog() {
  return (
    <section aria-labelledby="vit-log-title" className="bg-void border-grid mt-8 border-2 p-4">
      <h3 id="vit-log-title" className="font-pixel text-px-sm text-coin uppercase">
        {vitCopy.logHeading}
      </h3>
      <p className="text-dust mt-1 text-sm">{vitCopy.logIntro}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
        {craters.map((c) => (
          <div key={c.key} className="contents">
            <dt className="font-pixel text-px-xs text-dust pt-1 uppercase">{c.label}</dt>
            <dd>{c.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
