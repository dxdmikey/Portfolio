import type { QuestDebrief } from "@/types/content";

/** UI copy for the mission-debrief tabs on each quest card. */
export const debriefCopy = {
  tabsAria: "Mission debrief",
  tabs: { mission: "Mission", role: "My role", moves: "Moves", loot: "Loot" },
  inProgressTag: "In progress",
  lootEmpty: "Results land here once the platform ships.",
} as const;

/** Mission debriefs keyed by quest id. Facts mirror `quests.ts`; no invented metrics. */
export const debriefs = {
  navayuga: {
    mission:
      "Give a construction engineering company a self-serve data platform, so non-technical teams can build their own reports without waiting on engineering.",
    role: "One of two engineers in Digital Intelligence & Transformation, co-building the platform with my lead.",
    moves: [
      "Connecting an enterprise ERP with 2,400+ tables, a fuel-management API, fleet telematics, IoT and truck data into one Azure platform.",
      "Building the reporting layer on ECharts so reports can be created and changed daily.",
      "Building an AI agent that answers data questions with RAG and draws charts from a plain-English prompt.",
    ],
    loot: [],
    inProgress: "The platform is still being built. No results to claim yet.",
  },
  "winwire-sde": {
    mission:
      "Keep a commercial data platform's 25+ production pipelines (EDI, SFTP and retail sources) healthy, fast and trusted.",
    role: "Data Engineer and AMS owner of the Commercial Data Platform's production pipelines.",
    moves: [
      "Hunting recurring failures down to the root cause, then adding proactive data-quality controls so they stay fixed.",
      "Tuning SQL queries and PySpark transformations to speed up production processing.",
      "Building validation frameworks across the source, staging, curated and Synapse layers.",
      "Adding logging, monitoring and alerting so incidents surface early and get resolved faster.",
      "Earlier on the same journey: proof-of-concept platforms on Microsoft Fabric, Azure Databricks and AWS.",
    ],
    loot: [
      { value: "-30%", label: "recurring pipeline failures" },
      { value: "20–35%", label: "faster SQL & PySpark processing" },
      { value: "-25%", label: "incident resolution time (MTTR)" },
      { value: "25+", label: "production pipelines owned" },
    ],
  },
  "winwire-sdt": {
    mission: "Move an enterprise healthcare estate off Oracle and keep its data fresh at scale.",
    role: "Data Engineer on the healthcare migration and integration projects.",
    moves: [
      "Migrated 400+ Oracle tables to Azure Synapse and Databricks.",
      "Built 45+ Synapse pipelines and 20+ PySpark transformation frameworks.",
      "Implemented a Delta Lake medallion architecture.",
      "Automated ingestion of 30K+ daily records with incremental loading.",
    ],
    loot: [
      { value: "50M+", label: "records processed" },
      { value: "99.7%", label: "migration data accuracy" },
      { value: "+35%", label: "processing performance" },
      { value: "24h to <4h", label: "data refresh SLA" },
    ],
  },
} as const satisfies Record<string, QuestDebrief>;
