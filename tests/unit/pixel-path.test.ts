import { describe, expect, it } from "vitest";
import { pixelPath, pixelPathsByChar } from "@/lib/pixel-path";

describe("pixelPath", () => {
  it("merges horizontal runs into single rectangles", () => {
    expect(pixelPath([".##.", "#..#"], (c) => c === "#")).toBe("M1 0h2v1h-2zM0 1h1v1h-1zM3 1h1v1h-1z");
  });

  it("returns an empty path when nothing matches", () => {
    expect(pixelPath(["...."], (c) => c === "#")).toBe("");
  });

  it("groups by character", () => {
    const paths = pixelPathsByChar(["ab", "b."]);
    expect([...paths.keys()].sort()).toEqual(["a", "b"]);
    expect(paths.get("b")).toBe("M1 0h1v1h-1zM0 1h1v1h-1z");
  });
});
