import type { Rarity } from "@/types/content";

export const rarityText: Record<Rarity, string> = {
  legendary: "text-coin",
  epic: "text-warp",
  rare: "text-plasma",
  common: "text-dust",
};

export const rarityBg: Record<Rarity, string> = {
  legendary: "bg-coin",
  epic: "bg-warp",
  rare: "bg-plasma",
  common: "bg-dust",
};

export const rarityBorder: Record<Rarity, string> = {
  legendary: "border-coin",
  epic: "border-warp",
  rare: "border-plasma",
  common: "border-dust",
};

export const rarityLabel: Record<Rarity, string> = {
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
  common: "Common",
};
