import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("keeps pixel font sizes alongside text colours", () => {
    expect(cn("text-px-sm text-plasma")).toBe("text-px-sm text-plasma");
  });

  it("lets a later pixel size override an earlier one", () => {
    expect(cn("text-px-sm", "text-px-lg")).toBe("text-px-lg");
  });

  it("keeps pixel shadows alongside shadow colours", () => {
    expect(cn("shadow-pixel", "shadow-coin")).toContain("shadow-pixel");
  });
});
