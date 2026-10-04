import type { NextConfig } from "next";

/**
 * Pure static export — no server, no functions. Deployed as plain files on Vercel Hobby.
 * Images are pre-optimised at build time by `scripts/optimize-images.ts`, so the
 * runtime optimiser is disabled.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
