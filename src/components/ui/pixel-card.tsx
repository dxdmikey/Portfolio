import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";
import type { Accent } from "@/types/content";
import { accentBorder } from "./accent";

type PixelCardProps<T extends ElementType> = {
  as?: T;
  accent?: Accent | "muted";
  /** Thick left rail instead of a full border (quest-log style). */
  rail?: boolean;
} & ComponentPropsWithoutRef<T>;

/** The base panel: square corners, 2px border, hard pixel shadow. */
export function PixelCard<T extends ElementType = "div">({
  as,
  accent = "muted",
  rail = false,
  className,
  ...rest
}: PixelCardProps<T>) {
  const Tag = as ?? "div";
  const border = accent === "muted" ? "border-grid" : accentBorder[accent];
  return (
    <Tag
      className={cn(
        "bg-nebula shadow-pixel relative",
        rail ? cn("border-l-4", border) : cn("border-2", border),
        className,
      )}
      {...rest}
    />
  );
}
