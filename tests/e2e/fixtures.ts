import { expect, test as base, type Locator, type Page } from "@playwright/test";

export const NAME = "Kadwasra Ravi Kumar";
export const PDF_HREF = "/Kadwasra_Ravi_Kumar_Resume.pdf";

export { chapters as CHAPTERS } from "../../src/content/story";
export { DISCOVERY_XP } from "../../src/lib/constants";

interface Fixtures {
  /** When true the boot screen is NOT bypassed. Default false. */
  showBoot: boolean;
  /** Console errors and uncaught page errors collected since the page was created. */
  errors: string[];
}

export const test = base.extend<Fixtures>({
  showBoot: [false, { option: true }],
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      // Network failures are reported (with URL) by the response listener below.
      if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) {
        errors.push(`console.error: ${m.text()}`);
      }
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
    });
    await use(errors);
  },
  page: async ({ page, showBoot }, use) => {
    if (!showBoot) {
      await page.addInitScript(() => sessionStorage.setItem("portfolio.exe:booted", "true"));
    }
    await use(page);
  },
});

export { expect };

/** The HUD (sticky header). */
export const hud = (page: Page): Locator => page.getByRole("banner");

/**
 * Open the home page (boot bypassed unless `showBoot`) and wait for hydration.
 * The quick-view toggle only gets `aria-pressed` once mounted: a reliable hydration signal that
 * is visible at every viewport (theme and sound live in the System menu on phones).
 */
export async function gotoHome(page: Page) {
  await page.goto("/");
  await expect(hud(page).getByRole("button", { name: "Quick view (skip the story)", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
}

/** A HUD system button (theme, sound). On phones it first opens the System menu. */
export async function systemButton(page: Page, name: string | RegExp): Promise<Locator> {
  const menu = page.getByRole("button", { name: "System menu" });
  if (await menu.isVisible()) {
    if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
  }
  return page.getByRole("button", { name });
}

/** The HUD experience bar's current value (`aria-valuenow`). */
export async function xpValue(page: Page): Promise<number> {
  const now = await hud(page).getByRole("progressbar", { name: "Experience points" }).getAttribute("aria-valuenow");
  return Number(now);
}

/** "N of M discoveries found" from the HUD counter (screen-reader text next to the visual "n/N"). */
export async function discoveryCount(page: Page): Promise<number> {
  const text = await hud(page)
    .getByText(/\d+ of \d+ discoveries found/)
    .textContent();
  const m = /^(\d+) of (\d+)/.exec(text ?? "");
  if (!m) throw new Error(`discovery counter text not found: ${text}`);
  return Number(m[1]);
}

/** Jump to a chapter via the HUD pip link and wait until it is on screen. */
export async function flyTo(page: Page, chapter: { id: string; number: number; label: string }) {
  await hud(page).getByRole("link", { name: `Chapter ${chapter.number}: ${chapter.label}`, exact: true }).click();
  await expect(page.locator(`#${chapter.id}`)).toBeInViewport();
}

export function formatViolations(
  violations: { id: string; impact?: string | null; help: string; helpUrl: string; nodes: { target: unknown; failureSummary?: string }[] }[],
): string {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n` +
        v.nodes
          .slice(0, 5)
          .map((n) => `   - ${JSON.stringify(n.target)}\n     ${(n.failureSummary ?? "").replace(/\n/g, "\n     ")}`)
          .join("\n"),
    )
    .join("\n\n");
}
