import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/** Square 44px HUD button for a single pixel icon. Always pass `aria-label`. */
export function IconButton({
  className,
  type = "button",
  ...rest
}: ComponentPropsWithoutRef<"button"> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={cn(
        "border-grid text-dust hover:border-plasma hover:text-plasma grid size-11 shrink-0 cursor-pointer place-items-center border-2 transition-colors duration-150",
        "aria-pressed:border-xp aria-pressed:text-xp",
        className,
      )}
      {...rest}
    />
  );
}
