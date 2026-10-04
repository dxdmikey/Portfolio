import { armoryCopy } from "@/content/armory";
import { inventory, inventoryGroups, rarityOrder } from "@/content/inventory";
import { cn } from "@/lib/cn";
import type { InventoryItem } from "@/types/content";
import { rarityBg, rarityBorder, rarityLabel, rarityText } from "./rarity";
import { SubHeading } from "./sub-heading";

const byId = new Map<string, InventoryItem>(inventory.map((tool) => [tool.id, tool]));

function ToolTile({ tool }: { tool: InventoryItem }) {
  return (
    <li className="bg-nebula border-grid flex min-w-0 items-start gap-3 border-2 p-3">
      <span
        aria-hidden
        className={cn(
          "font-pixel text-px-xs grid size-10 shrink-0 place-items-center border-2",
          rarityBorder[tool.rarity],
          rarityText[tool.rarity],
        )}
      >
        {tool.abbr}
      </span>
      <div className="min-w-0">
        <p className="text-starlight leading-snug font-semibold">
          {tool.name}
          <span className="sr-only">, {rarityLabel[tool.rarity]}</span>
        </p>
        <p className="text-dust text-sm">{tool.note}</p>
      </div>
    </li>
  );
}

/** CH5: the full tool list, grouped by what each tool does. Plain content, no game. */
export function TechInventory() {
  const copy = armoryCopy.inventory;
  return (
    <section aria-labelledby="inventory-title">
      <SubHeading id="inventory-title" title={copy.title} intro={copy.intro} />

      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2" aria-hidden>
        <span className="font-pixel text-px-xs text-dust uppercase">{copy.legendLabel}</span>
        {rarityOrder.map((rarity) => (
          <span key={rarity} className="text-dust flex items-center gap-2 text-sm">
            <span className={cn("size-3", rarityBg[rarity])} />
            {rarityLabel[rarity]}
          </span>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {inventoryGroups.map((group) => (
          <div key={group.title}>
            <h4 className="font-pixel text-px-xs text-coin mb-3 uppercase">{group.title}</h4>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.ids.map((id) => {
                const tool = byId.get(id);
                return tool ? <ToolTile key={id} tool={tool} /> : null;
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
