import type { Project } from "@/types/content";

/**
 * Projects rendered as planets on the galaxy map. `planet.x/y` are 0–1 map coordinates;
 * keep planets at least ~0.15 apart so tap targets never overlap on mobile.
 */
export const projects = [
  {
    id: "self-serve-platform",
    name: "Self-serve data platform",
    codename: "Planet Navayuga",
    status: "in-orbit",
    period: "Sep 2026 – Present",
    accent: "plasma",
    planet: { x: 0.5, y: 0.48, size: 64, ring: true },
    problem:
      "A construction engineering company runs on an ERP with 2,400+ tables, plus fuel, telematics, IoT and truck data. Reports change every day, and every change used to need an engineer.",
    approach: [
      "One Azure platform where sources are configured, not coded.",
      "Transformations users apply themselves, on governed, analytics-ready layers.",
      "A report builder on ECharts, so business teams own their dashboards.",
      "An AI agent that answers data questions with RAG and draws charts from a prompt.",
    ],
    outcome: [
      "In active development by a two-person team: my lead and me.",
      "Goal: turn report requests from engineering tickets into self-serve work.",
    ],
    stack: ["Azure", "ECharts", "RAG", "AI agents", "Python", "Next.js"],
    architecture: {
      nodes: [
        { id: "erp", label: "ERP", detail: "2,400+ tables", column: 0 },
        { id: "fuel", label: "Fuel API", detail: "Fuel management", column: 0 },
        { id: "fleet", label: "Fleet & IoT", detail: "Telematics, sensors, trucks", column: 0 },
        { id: "ingest", label: "Ingest", detail: "Config-driven connectors", column: 1 },
        { id: "lake", label: "Lakehouse", detail: "Bronze · Silver · Gold", column: 2 },
        { id: "transform", label: "Transforms", detail: "User-applied, governed", column: 2 },
        { id: "reports", label: "Reports", detail: "ECharts builder", column: 3 },
        { id: "agent", label: "AI agent", detail: "RAG Q&A · prompt-to-chart", column: 3 },
      ],
      edges: [
        ["erp", "ingest"],
        ["fuel", "ingest"],
        ["fleet", "ingest"],
        ["ingest", "lake"],
        ["lake", "transform"],
        ["transform", "reports"],
        ["lake", "agent"],
      ],
    },
  },
  {
    id: "healthcare-migration",
    name: "Healthcare data migration",
    codename: "Oracle Exodus",
    status: "completed",
    period: "Apr 2024 – Apr 2025",
    accent: "xp",
    planet: { x: 0.2, y: 0.28, size: 46, ring: false },
    problem:
      "An enterprise healthcare estate needed 400+ Oracle tables moved to Azure without losing trust in the numbers.",
    approach: [
      "45+ Synapse pipelines and 20+ reusable PySpark transformation frameworks.",
      "A Delta Lake medallion architecture for the landing, cleaning and serving layers.",
      "Automated reconciliation to prove schema and row-level consistency.",
    ],
    outcome: [
      "400+ tables migrated with 99.7% data accuracy.",
      "Processing performance improved by 35%.",
    ],
    stack: ["Azure Synapse", "Databricks", "PySpark", "Delta Lake", "Oracle"],
  },
  {
    id: "commercial-platform",
    name: "Commercial data platform",
    codename: "Station AMS",
    status: "completed",
    period: "Oct 2025 – Aug 2026",
    accent: "coin",
    planet: { x: 0.8, y: 0.25, size: 42, ring: true },
    problem:
      "25+ production pipelines pulling EDI, SFTP and retail data kept failing in the same ways.",
    approach: [
      "Root-cause analysis on recurring failures, plus proactive data-quality checks.",
      "Validation across the source, staging, curated and Synapse layers.",
      "Better logging, monitoring and alerting.",
    ],
    outcome: [
      "Recurring failures down 30%.",
      "SQL and PySpark processing 20–35% faster.",
      "Incident resolution time (MTTR) down 25%.",
    ],
    stack: ["Azure Data Factory", "Synapse", "PySpark", "SQL"],
  },
  {
    id: "healthcare-integration",
    name: "Healthcare data integration",
    codename: "Pulse Relay",
    status: "completed",
    period: "Jan 2024 – Apr 2024",
    accent: "warp",
    planet: { x: 0.18, y: 0.74, size: 38, ring: false },
    problem:
      "BI teams waited a full day for fresh healthcare and supply-chain data.",
    approach: [
      "Automated ingestion of 30K+ records a day.",
      "Incremental loading instead of full refreshes.",
      "Metadata-driven transformation design.",
    ],
    outcome: [
      "Refresh SLA cut from 24 hours to under 4.",
      "Pipeline stability improved by 30%.",
    ],
    stack: ["Azure Synapse", "PySpark", "SQL"],
  },
  {
    id: "aws-warehouse",
    name: "AWS data warehouse",
    codename: "Redshift Outpost",
    status: "side-mission",
    period: "Practice build",
    accent: "coin",
    planet: { x: 0.82, y: 0.72, size: 32, ring: false },
    problem: "Practice: a classic cloud warehouse built end to end on AWS.",
    approach: [
      "Glue + PySpark ETL from S3 into Redshift.",
      "Dimensional tables with incremental loading.",
      "Distribution and sort keys tuned for analytical queries.",
    ],
    outcome: ["A working S3-to-Redshift warehouse with tuned query performance."],
    stack: ["S3", "AWS Glue", "Redshift", "PySpark"],
  },
  {
    id: "enterprise-platform",
    name: "Enterprise data platform",
    codename: "Metadata Moon",
    status: "side-mission",
    period: "Practice build",
    accent: "xp",
    planet: { x: 0.56, y: 0.86, size: 30, ring: false },
    problem:
      "Self-learning: an enterprise-style data and analytics platform built from scratch with Claude.",
    approach: [
      "Configurable ingestion from Azure SQL, REST APIs and FTP/SFTP, run by Data Factory into ADLS Gen2 and Azure SQL.",
      "A metadata-driven FastAPI + PostgreSQL backend with RBAC and workflow engines.",
      "A Query Editor and an ECharts Dashboard Builder on top.",
    ],
    outcome: ["A working platform from source to dashboard, backed by 500+ automated backend tests."],
    stack: ["ADF", "ADLS Gen2", "Claude", "Python", "PostgreSQL", "ECharts"],
  },
] as const satisfies readonly Project[];
