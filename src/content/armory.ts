import type { Ability } from "@/types/content";

type AbilityId = Ability["id"];

/** Back-of-card line. Every claim here comes from `quests.ts` / `projects.ts`. */
export const abilityUsage: Record<AbilityId, string> = {
  azure:
    "Pulling an ERP, fuel API and fleet data into one Azure platform at Navayuga, and metadata-driven Data Factory and Synapse pipelines at WinWire.",
  "pyspark-sql":
    "Distributed healthcare pipelines over 50M+ records, and 20 to 35% faster SQL and PySpark on the commercial data platform.",
  lakehouse:
    "A Delta Lake medallion migration of 400+ Oracle tables, and Bronze, Silver, Gold proofs of concept on Fabric and Databricks.",
  "ai-agents":
    "The Navayuga AI agent: it answers data questions with RAG and draws charts from a plain-English prompt.",
  "full-stack":
    "Co-building the Navayuga self-serve platform end to end, and shipping this very site with Claude.",
  "data-viz":
    "The ECharts report builder at Navayuga, so teams change their own reports without waiting on engineering.",
};

export const armoryCopy = {
  abilities: {
    title: "Abilities",
    intro: "Six skills levelled up on real work. Flip a card to see where I used it.",
    flipLabel: (name: string) => `${name}. Flip card`,
    whereUsed: "Where I used it",
    spells: "Spells",
    hint: "Tap to flip",
  },
  inventory: {
    title: "Tech inventory",
    intro:
      "Every tool in my kit, grouped by what it does. Colour shows how deep I go: legendary is daily driver, common is comfortable.",
    legendLabel: "Proficiency",
  },
  trophies: {
    title: "Trophy case",
    certsHeading: "Certifications",
    /** Screen-reader tail after the card's visible text (code, name, issuer · date). */
    polishHint: "Polish trophy",
  },
} as const;
