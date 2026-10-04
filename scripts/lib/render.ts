import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import { startStaticServer } from "./static-server";

export const ROOT = resolve(__dirname, "..", "..");
export const OUT_DIR = resolve(ROOT, "out");
export const PUBLIC_DIR = resolve(ROOT, "public");

interface Viewport {
  width: number;
  height: number;
}

/** Serves `out/`, opens `route` in headless Chromium, runs `task`, always cleans up. */
export async function withPage<T>(
  route: string,
  viewport: Viewport,
  task: (page: Page) => Promise<T>,
): Promise<T> {
  if (!existsSync(resolve(OUT_DIR, "index.html"))) {
    throw new Error("out/ not found — run `npm run build` first.");
  }
  const server = await startStaticServer(OUT_DIR);
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport });
    await page.goto(`${server.url}${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    return await task(page);
  } finally {
    await browser?.close();
    await server.close();
  }
}
