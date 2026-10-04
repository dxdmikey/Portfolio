export function Highlights({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((h) => (
        <li key={h} className="flex gap-3">
          <span aria-hidden className="text-coin font-pixel text-px-xs mt-1.5 shrink-0">
            ▸
          </span>
          <span className="max-w-[70ch]">{h}</span>
        </li>
      ))}
    </ul>
  );
}
