import { describe, expect, it } from "vitest";
import { createWebStore } from "@/lib/storage";

describe("createWebStore", () => {
  it("round-trips JSON values and falls back on missing keys", () => {
    const store = createWebStore("local");
    store.set("k", { a: 1 });
    expect(store.get("k", null)).toEqual({ a: 1 });
    expect(store.get("missing", 42)).toBe(42);
  });

  it("falls back on corrupt JSON instead of throwing", () => {
    window.localStorage.setItem("portfolio.exe:bad", "{not json");
    expect(createWebStore("local").get("bad", "fallback")).toBe("fallback");
  });
});
