import type { QuestEntry } from "@/types/content";

/**
 * Career as a quest log. Facts mirror the resume (`resume.ts` derives from the same truths).
 * Navayuga bullets intentionally avoid metrics — the platform is still being built.
 */
export const quests = [
  {
    id: "navayuga",
    status: "active",
    title: "Full-stack Developer & Data Engineer",
    org: "Navayuga Engineering Company Ltd",
    location: "Hyderabad, India",
    period: "Sep 2026 – Present",
    xp: 3000,
    summary:
      "One of two engineers in Digital Intelligence & Transformation, building a self-serve data platform for a construction engineering company.",
    highlights: [
      "Co-building, with my lead, a self-serve data platform where non-technical users connect data sources, apply transformations and build their own reports.",
      "Bringing an enterprise ERP with 2,400+ tables, a fuel-management API, fleet telematics, IoT and truck data into one Azure platform.",
      "Building the reporting layer on ECharts, so teams can create and change reports daily without waiting on engineering.",
      "Building an AI agent that answers data questions with RAG and generates charts from a plain-English prompt.",
    ],
    tags: ["Azure", "ECharts", "RAG", "AI agents", "Full-stack"],
  },
  {
    id: "winwire-sde",
    status: "completed",
    title: "Data Engineer SDE",
    org: "WinWire Technologies",
    location: "Hyderabad, India",
    period: "May 2025 – Aug 2026",
    xp: 2500,
    summary: "Built proof-of-concept platforms and ran production pipelines for enterprise clients.",
    highlights: [
      "Designed proof-of-concept data platforms on Microsoft Fabric, Azure Databricks and AWS to speed up client onboarding and architecture validation.",
      "Built metadata-driven ingestion frameworks with Azure Data Factory and Synapse, cutting pipeline development effort by 40%.",
      "Implemented a Bronze–Silver–Gold medallion lakehouse, improving analytical query performance by 30%.",
    ],
    tags: ["Fabric", "Databricks", "ADF", "Synapse", "AWS"],
    subQuests: [
      {
        title: "Commercial Data Platform (AMS support)",
        period: "Oct 2025 – Aug 2026",
        highlights: [
          "Owned and optimised 25+ production pipelines processing EDI, SFTP and retail data.",
          "Cut recurring pipeline failures by 30% with root-cause analysis and proactive data-quality checks.",
          "Sped up SQL and PySpark processing by 20–35% through query and transformation tuning.",
          "Reduced incident resolution time (MTTR) by 25% with better logging, monitoring and alerting.",
        ],
      },
    ],
  },
  {
    id: "winwire-sdt",
    status: "completed",
    title: "Data Engineer SDT",
    org: "WinWire Technologies",
    location: "Hyderabad, India",
    period: "Nov 2023 – Apr 2025",
    xp: 2000,
    summary: "Delivered distributed pipelines and a large cloud migration for enterprise healthcare.",
    highlights: [
      "Built distributed pipelines processing 50M+ records across enterprise healthcare systems.",
      "Delivered scalable ETL workflows with PySpark, SQL, Azure Synapse and Databricks.",
    ],
    tags: ["PySpark", "Synapse", "Databricks", "Delta Lake", "Oracle"],
    subQuests: [
      {
        title: "Healthcare Data Migration",
        period: "Apr 2024 – Apr 2025",
        highlights: [
          "Migrated 400+ Oracle tables to Azure Synapse and Databricks with 99.7% data accuracy.",
          "Built 45+ Synapse pipelines and 20+ PySpark transformation frameworks.",
          "Implemented a Delta Lake medallion architecture, improving processing performance by 35%.",
        ],
      },
      {
        title: "Healthcare Data Integration",
        period: "Jan 2024 – Apr 2024",
        highlights: [
          "Automated ingestion of 30K+ daily healthcare and supply-chain records.",
          "Cut data refresh SLAs from 24 hours to under 4 hours with incremental loading.",
        ],
      },
    ],
  },
  {
    id: "side-aws",
    status: "side",
    title: "AWS Data Warehouse Platform",
    org: "Personal project",
    location: "S3 · Glue · Redshift",
    period: "Practice build",
    xp: 500,
    summary: "An S3-to-Redshift warehouse with Glue and PySpark ETL.",
    highlights: [
      "Built Glue + PySpark ETL from S3 into dimensional Redshift tables with incremental loads.",
      "Tuned Redshift with distribution and sort keys.",
    ],
    tags: ["AWS Glue", "Redshift", "S3", "PySpark"],
  },
  {
    id: "side-platform",
    status: "side",
    title: "Enterprise Data & Analytics Platform",
    org: "Personal project",
    location: "ADF · ADLS Gen2 · Claude · Python",
    period: "Practice build",
    xp: 500,
    summary: "A metadata-driven data and analytics platform, built from scratch with Claude.",
    highlights: [
      "Built configurable ingestion from Azure SQL, REST APIs and FTP/SFTP with Data Factory into ADLS Gen2 and Azure SQL.",
      "Added RBAC, workflow engines, a Query Editor and an ECharts Dashboard Builder, with 500+ backend tests.",
    ],
    tags: ["ADF", "ADLS Gen2", "FastAPI", "PostgreSQL", "ECharts"],
  },
  {
    id: "vit",
    status: "tutorial",
    title: "B.Tech, Computer Science (AI & ML)",
    org: "VIT Bhopal",
    location: "Bhopal, India",
    period: "Jun 2019 – Jun 2023",
    xp: 1000,
    summary: "Where it all started. Graduated with a CGPA of 8.2 / 10.",
    highlights: [],
    tags: ["AI & ML", "CS fundamentals"],
  },
] as const satisfies readonly QuestEntry[];

export const totalXp = quests.reduce((sum, q) => sum + q.xp, 0);
