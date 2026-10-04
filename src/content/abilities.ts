import type { Ability } from "@/types/content";

/** The Top 6 — ordered by level. Levels are out of 99. */
export const abilities = [
  {
    id: "azure",
    name: "Azure data platform",
    level: 90,
    tier: "MASTER",
    accent: "plasma",
    summary: "End-to-end Azure data estates, from ingestion to serving.",
    spells: ["Data Factory", "Synapse", "ADLS Gen2", "Azure SQL", "Monitoring & alerting"],
  },
  {
    id: "pyspark-sql",
    name: "PySpark & SQL",
    level: 90,
    tier: "MASTER",
    accent: "xp",
    summary: "Fast, correct transformations at tens of millions of rows.",
    spells: ["Spark SQL", "Query tuning", "Partitioning", "Incremental loads"],
  },
  {
    id: "lakehouse",
    name: "Lakehouse",
    level: 88,
    tier: "MASTER",
    accent: "coin",
    summary: "Medallion lakehouses on Databricks, Fabric and Delta Lake.",
    spells: ["Databricks", "Microsoft Fabric", "Delta Lake", "Bronze · Silver · Gold"],
  },
  {
    id: "ai-agents",
    name: "AI agents & RAG",
    level: 80,
    tier: "ADVANCED",
    accent: "warp",
    summary: "Agents that answer questions about your data and build charts from a prompt.",
    spells: ["Azure OpenAI", "RAG pipelines", "Prompt-to-chart", "AI-102 certified"],
  },
  {
    id: "full-stack",
    name: "Full-stack, AI-native",
    level: 75,
    tier: "ADVANCED",
    accent: "plasma",
    summary:
      "Ships full-stack apps end to end with Claude, owning architecture, data flow and deployment.",
    spells: ["Next.js", "APIs", "Claude Code", "Vercel & Azure deploys"],
  },
  {
    id: "data-viz",
    name: "Data viz",
    level: 70,
    tier: "SKILLED",
    accent: "xp",
    summary: "Reports and dashboards that non-technical teams can read at a glance.",
    spells: ["ECharts", "Power BI", "Self-serve reporting"],
  },
] as const satisfies readonly Ability[];
