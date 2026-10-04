import { describe, expect, it } from "vitest";
import type { MouseEvent } from "react";
import { pointOf } from "@/hooks/use-discover";

function box(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement("button");
  el.getBoundingClientRect = () => ({ left, top, width, height }) as DOMRect;
  return el;
}

const click = (el: HTMLElement, clientX: number, clientY: number) =>
  ({ currentTarget: el, clientX, clientY }) as unknown as MouseEvent<HTMLElement>;

describe("pointOf (where discovery effects spawn)", () => {
  it("uses the pointer position of a real click", () => {
    expect(pointOf(click(box(0, 0, 10, 10), 120, 45))).toEqual({ x: 120, y: 45 });
  });

  it("falls back to the element centre for keyboard clicks (0,0)", () => {
    expect(pointOf(click(box(100, 200, 40, 20), 0, 0))).toEqual({ x: 120, y: 210 });
  });

  it("accepts an element (centre) or a screen point", () => {
    expect(pointOf(box(10, 10, 20, 40))).toEqual({ x: 20, y: 30 });
    expect(pointOf({ x: 7, y: 9 })).toEqual({ x: 7, y: 9 });
    expect(pointOf()).toEqual({ x: 0, y: 0 });
  });
});
