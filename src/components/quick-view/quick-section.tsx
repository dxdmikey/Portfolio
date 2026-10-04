import type { ReactNode } from "react";

/** Labelled <section> with a pixel-font h2. */
export function QuickSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`quick-${id}`} className="mb-10">
      <h2 id={`quick-${id}`} className="font-pixel text-px-md text-plasma mb-5 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="bg-plasma mt-[0.6em] size-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
