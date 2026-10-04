/** Armory section title with an optional intro line. */
export function SubHeading({ title, intro, id }: { title: string; intro?: string; id?: string }) {
  return (
    <div className="mb-6">
      <h3 id={id} className="font-pixel text-px-md text-plasma uppercase">
        {title}
      </h3>
      {intro ? <p className="text-dust mt-3 max-w-[62ch]">{intro}</p> : null}
    </div>
  );
}
