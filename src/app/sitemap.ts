import type { MetadataRoute } from "next";
import { profile } from "@/content/profile";

export const dynamic = "force-static";

const ROUTES = ["/", "/resume/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${profile.siteUrl}${route}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
