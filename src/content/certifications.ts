import type { Certification, Education } from "@/types/content";

export const certifications = [
  {
    id: "ai-102",
    code: "AI-102",
    officialCode: true,
    name: "Azure AI Engineer Associate",
    issuer: "Microsoft",
    issuerId: "microsoft",
    date: "Feb 2026",
    accent: "warp",
  },
  {
    id: "dp-100",
    code: "DP-100",
    officialCode: true,
    name: "Azure Data Scientist Associate",
    issuer: "Microsoft",
    issuerId: "microsoft",
    date: "Dec 2025",
    accent: "plasma",
  },
  {
    id: "dp-700",
    code: "DP-700",
    officialCode: true,
    name: "Microsoft Fabric Data Engineer Associate",
    issuer: "Microsoft",
    issuerId: "microsoft",
    date: "Aug 2025",
    accent: "xp",
  },
  {
    id: "databricks-de",
    code: "DBX-DE",
    officialCode: false,
    name: "Databricks Data Engineer Associate",
    issuer: "Databricks",
    issuerId: "databricks",
    date: "Mar 2024",
    accent: "coin",
  },
] as const satisfies readonly Certification[];

export const education = {
  school: "Vellore Institute of Technology (VIT)",
  location: "Bhopal, India",
  degree: "B.Tech in Computer Science and Engineering (Specialization in AI & ML)",
  period: "Jun 2019 – Jun 2023",
  grade: "CGPA 8.2 / 10",
} as const satisfies Education;
