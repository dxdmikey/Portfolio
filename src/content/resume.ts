import { certifications, education } from "./certifications";
import { profile } from "./profile";

/** "https://www.example.com/path" -> "example.com/path", for the printed resume header. */
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");
const linkHref = (id: "linkedin" | "github") => profile.links.find((l) => l.id === id)?.href ?? "";

/**
 * Resume content — mirrors the section order and structure of the original CV
 * (Summary → Experience → Education → Certifications → Skills → Practice Projects → Languages).
 * Rendered at `/resume` and printed to `public/Kadwasra_Ravi_Kumar_Resume.pdf`.
 * Deliberately has no phone number.
 */

export interface ResumeProject {
  title: string;
  bullets: readonly string[];
}

export interface ResumeRole {
  title: string;
  period: string;
  bullets: readonly string[];
  projects: readonly ResumeProject[];
}

export interface ResumeCompany {
  name: string;
  location: string;
  roles: readonly ResumeRole[];
}

export interface ResumeSkillGroup {
  label: string;
  items: string;
}

export const resume = {
  name: profile.name,
  role: profile.headline,
  email: profile.email,
  linkedin: bare(linkHref("linkedin")),
  linkedinHref: linkHref("linkedin"),
  github: bare(linkHref("github")),
  githubHref: linkHref("github"),
  portfolio: bare(profile.siteUrl),
  portfolioHref: profile.siteUrl,
  summary:
    "Data & AI Engineer with 3+ years of experience designing scalable data platforms, lakehouse architectures, " +
    "and enterprise ETL solutions on Azure. Currently building a self-serve data platform with an integrated AI " +
    "agent for a construction engineering enterprise. Experienced in Azure Databricks, Synapse Analytics, " +
    "Microsoft Fabric, PySpark, and SQL, and in building RAG-based AI agents on Azure. Proven track record of " +
    "migrating large-scale data platforms, optimizing processing performance by up to 35%, and delivering " +
    "reliable analytics-ready datasets. Ships full-stack applications end to end with AI-assisted development.",
  experience: [
    {
      name: "Navayuga Engineering Company Ltd",
      location: "Hyderabad, India",
      roles: [
        {
          title: "Full-stack Developer & Data Engineer",
          period: "Sep 2026 – Present",
          bullets: [
            "Co-building, in a two-person Digital Intelligence & Transformation team, a self-serve data platform that lets non-technical users configure data sources, apply transformations, and build reports.",
            "Integrating an enterprise ERP with 2,400+ tables, a fuel-management API, fleet telematics, IoT, and truck data into a unified Azure data platform.",
            "Developing the reporting layer on Apache ECharts, enabling business teams to create and change reports without engineering support.",
            "Building an AI agent that answers data questions using retrieval-augmented generation (RAG) and generates charts from natural-language prompts.",
          ],
          projects: [],
        },
      ],
    },
    {
      name: "WinWire Technologies",
      location: "Hyderabad, India",
      roles: [
        {
          title: "Data Engineer SDE",
          period: "May 2025 – Aug 2026",
          bullets: [
            "Designed proof-of-concept data platforms using Microsoft Fabric, Azure Databricks, and AWS, accelerating client onboarding and architecture validation.",
            "Developed metadata-driven ingestion frameworks using Azure Data Factory and Synapse, reducing pipeline development effort by 40%.",
            "Implemented Medallion lakehouse architecture (Bronze–Silver–Gold), improving analytical query performance by 30%.",
            "Enhanced production monitoring, alerting, and deployment processes, improving platform reliability and reducing operational overhead.",
          ],
          projects: [
            {
              title: "Commercial Data Platform (AMS Support) | Oct 2025 – Aug 2026",
              bullets: [
                "Managed and optimized 25+ production pipelines processing multi-source commercial data from EDI, SFTP, and retail systems.",
                "Reduced recurring pipeline failures by 30% through root-cause analysis and proactive data quality controls.",
                "Improved SQL and PySpark processing performance by 20–35% through query tuning and transformation optimization.",
                "Built validation frameworks across source, staging, curated, and Synapse layers, ensuring data accuracy and consistency.",
                "Reduced incident resolution time (MTTR) by 25% through enhanced logging, monitoring, and alerting strategies.",
              ],
            },
          ],
        },
        {
          title: "Data Engineer SDT",
          period: "Nov 2023 – Apr 2025",
          bullets: [
            "Developed distributed data pipelines processing 50M+ records across enterprise healthcare systems.",
            "Delivered scalable ETL workflows using PySpark, SQL, Azure Synapse, and Databricks for large-scale analytical workloads.",
            "Supported cloud migration and data integration initiatives focused on performance, reliability, and data quality.",
          ],
          projects: [
            {
              title: "Healthcare Data Migration (Apr 2024 – Apr 2025)",
              bullets: [
                "Migrated 400+ Oracle tables to Azure Synapse and Databricks with 99.7% data accuracy.",
                "Developed 45+ Synapse pipelines and 20+ PySpark transformation frameworks supporting enterprise-scale migration.",
                "Implemented Delta Lake-based Medallion architecture, improving processing performance by 35%.",
                "Designed automated reconciliation and validation frameworks to ensure schema consistency and data integrity.",
                "Automated orchestration and alerting processes, significantly reducing manual operational effort.",
              ],
            },
            {
              title: "Healthcare Data Integration (Jan 2024 – Apr 2024)",
              bullets: [
                "Engineered automated ingestion pipelines processing 30K+ daily healthcare and supply-chain records.",
                "Implemented incremental loading frameworks, reducing data refresh SLAs from 24 hours to under 4 hours.",
                "Improved pipeline stability by 30% through metadata-driven transformation design.",
                "Delivered analytics-ready datasets consumed by BI and reporting teams.",
              ],
            },
          ],
        },
      ],
    },
  ] satisfies readonly ResumeCompany[],
  education,
  certifications: certifications.map(
    (c) => `${c.officialCode ? `${c.code}: ` : ""}${c.name} – ${c.date}`,
  ),
  skills: [
    { label: "Programming & Processing", items: "Python, PySpark, SQL (Advanced), Spark SQL" },
    { label: "Data Platforms", items: "Azure Databricks, Azure Synapse, Microsoft Fabric, Delta Lake" },
    {
      label: "Data Engineering",
      items:
        "ETL/ELT Pipelines, Medallion Architecture, Incremental Processing, Data Modeling (Star, Snowflake, SCD Type 2)",
    },
    {
      label: "Cloud & Storage",
      items: "Azure Data Factory, ADLS Gen2, Azure SQL, AWS (S3, Glue, Redshift)",
    },
    {
      label: "AI & Agents",
      items: "Retrieval-Augmented Generation (RAG), AI Agents, Azure OpenAI, Prompt Engineering",
    },
    {
      label: "Full-stack (AI-assisted)",
      items: "Next.js, React, REST APIs, Claude Code, Vercel",
    },
    {
      label: "Orchestration & Optimization",
      items: "Airflow, Pipeline Automation, Partitioning, Performance Tuning, Monitoring & Alerting",
    },
    { label: "Analytics & Visualization", items: "Apache ECharts, Power BI, Self-serve Reporting" },
  ] satisfies readonly ResumeSkillGroup[],
  practiceProjects: [
    {
      title: "AWS Data Warehouse Platform (S3 + Glue + Redshift)",
      bullets: [
        "Developed ETL pipelines using AWS Glue and PySpark to process data from Amazon S3 into Redshift.",
        "Designed dimensional warehouse tables and implemented incremental loading strategies for efficient data processing.",
        "Optimized Redshift queries using distribution and sort keys, improving analytical query performance.",
      ],
    },
    {
      title: "Enterprise Data & Analytics Platform (ADF + ADLS Gen2 + Claude + Python)",
      bullets: [
        "Built a configurable ingestion framework for Azure SQL, REST API and FTP/SFTP sources, orchestrated with Azure Data Factory into ADLS Gen2 (Bronze) and Azure SQL targets, with run tracking and duplicate handling.",
        "Designed a metadata-driven backend with FastAPI, PostgreSQL and SQLAlchemy/Alembic, including RBAC, hierarchical business-unit access and configurable workflow engines.",
        "Developed a Query Editor and an ECharts-based Dashboard Builder for dataset discovery, querying and interactive dashboards, backed by 500+ automated backend tests.",
      ],
    },
  ] satisfies readonly ResumeProject[],
  languages: profile.languages,
} as const;
