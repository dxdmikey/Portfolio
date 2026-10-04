import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TechInventory } from "@/components/chapters/armory/tech-inventory";
import { inventory, inventoryGroups } from "@/content/inventory";

describe("inventory groups", () => {
  it("place every tool in exactly one group", () => {
    const grouped = inventoryGroups.flatMap((g) => [...g.ids]);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(inventory.map((t) => t.id).sort());
  });
});

describe("TechInventory", () => {
  it("lists every tool under its group heading", () => {
    render(<TechInventory />);
    expect(screen.getByRole("heading", { name: "Tech inventory" })).toBeInTheDocument();
    for (const group of inventoryGroups) {
      expect(screen.getByRole("heading", { name: group.title })).toBeInTheDocument();
    }
    const items = within(screen.getByRole("region", { name: "Tech inventory" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(inventory.length);
    expect(screen.getByText("Databricks")).toBeInTheDocument();
  });

  it("is plain content: nothing to click", () => {
    render(<TechInventory />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
