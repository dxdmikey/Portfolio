import { quests } from "@/content/quests";
import { debriefs } from "@/content/debriefs";
import type { QuestDebrief, QuestEntry } from "@/types/content";

export function questById(id: string): QuestEntry {
  const found = (quests as readonly QuestEntry[]).find((q) => q.id === id);
  if (!found) throw new Error(`Unknown quest: ${id}`);
  return found;
}

export function debriefById(id: string): QuestDebrief | undefined {
  return (debriefs as Record<string, QuestDebrief>)[id];
}
