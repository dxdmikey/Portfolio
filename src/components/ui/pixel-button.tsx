import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const base =
  "font-pixel text-px-sm inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 uppercase tracking-wider transition-[transform,background-color,color,box-shadow] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "border-plasma bg-void text-plasma shadow-[4px_4px_0_0_var(--plasma)] hover:bg-plasma hover:text-on-accent",
  ghost: "border-grid bg-transparent text-starlight hover:border-plasma hover:text-plasma",
  coin: "border-coin bg-void text-coin shadow-[4px_4px_0_0_var(--coin)] hover:bg-coin hover:text-on-accent",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

type PixelButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant };

export function PixelButton({ variant = "primary", className, type = "button", ...rest }: PixelButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}
