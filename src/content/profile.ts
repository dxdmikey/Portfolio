import type { Profile } from "@/types/content";

const EMAIL = "kadwasra619@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/kadwasra-ravi-kumar-7b3b8318b";
const GITHUB_URL = "https://github.com/dxdmikey";
/**
 * Public site address (canonical URL, sitemap, OG image, resume link). Change the default here, or set
 * NEXT_PUBLIC_SITE_URL at build time (e.g. in Vercel's Environment Variables) for a custom domain.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kadwasra.vercel.app").replace(/\/+$/, "");

export const profile = {
  name: "Kadwasra Ravi Kumar",
  shortName: "Ravi",
  headline: "Data & AI Engineer",
  version: "v2026.10",
  className: "Data & AI Engineer",
  region: "Hyderabad, India",
  guild: "Navayuga · Digital Intelligence & Transformation",
  experience: "3+ years",
  level: 3,
  tagline: "I turn messy enterprise data into platforms people actually use.",
  bio:
    "Data & AI engineer with 3+ years building lakehouses, pipelines and migrations on Azure. " +
    "Right now I'm one half of a two-person team building a self-serve data platform for a " +
    "construction engineering company, so anyone can connect a source, shape the data and " +
    "build a report, with an AI agent that answers questions and draws charts on request. " +
    "I build full-stack the AI-native way: I own the architecture and the data flow, and I " +
    "ship end to end with Claude as my pair.",
  traits: ["Anime", "Nature explorer", "Gaming"],
  stats: [
    { id: "pipeline-design", label: "Pipeline design", value: 90, accent: "xp" },
    { id: "sql", label: "SQL sorcery", value: 90, accent: "plasma" },
    { id: "pyspark", label: "PySpark", value: 88, accent: "coin" },
    { id: "data-modeling", label: "Data modeling", value: 82, accent: "warp" },
    { id: "reliability", label: "Reliability & ops", value: 85, accent: "xp" },
    { id: "ai", label: "AI & prompting", value: 80, accent: "plasma" },
  ],
  photo: {
    src: "/images/ravi.webp",
    alt: "Portrait of Kadwasra Ravi Kumar in a navy blazer and glasses",
    width: 480,
    height: 600,
  },
  email: EMAIL,
  siteUrl: SITE_URL,
  links: [
    { id: "email", label: "Email", href: `mailto:${EMAIL}`, display: EMAIL },
    { id: "linkedin", label: "LinkedIn", href: LINKEDIN_URL },
    { id: "github", label: "GitHub", href: GITHUB_URL },
    { id: "resume", label: "Resume", href: "/Kadwasra_Ravi_Kumar_Resume.pdf" },
  ],
  languages: ["English", "Telugu", "Hindi"],
} as const satisfies Profile;
