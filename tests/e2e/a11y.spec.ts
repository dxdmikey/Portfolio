import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, formatViolations, gotoHome, hud, systemButton, test } from "./fixtures";

const BLOCKING = ["serious", "critical"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const blocking = violations.filter((v) => v.impact && BLOCKING.includes(v.impact));
  // Compare counts so a failure prints only the formatted report, not axe's raw result objects.
  expect(blocking.length, `\n${formatViolations(blocking)}\n`).toBe(0);
}

/** Let entrance animations and fonts settle so colour-contrast reads final values. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

test.describe("accessibility (axe)", () => {
  // A full-page axe scan of the whole voyage (every chapter is real DOM) takes ~25-32 s on a dev
  // laptop with two workers; the default 30 s budget made the light-mode scan time out.
  test.slow();

  test("home, dark", async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await settle(page);
    await scan(page);
  });

  test("home, light", async ({ page }) => {
    await gotoHome(page);
    await (await systemButton(page, "Switch to day mode")).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await settle(page);
    await scan(page);
  });

  test("quick view", async ({ page }) => {
    await gotoHome(page);
    await hud(page)
      .getByRole("button", { name: "Quick view (skip the story)", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();
    await settle(page);
    await scan(page);
  });

  test("resume page", async ({ page }) => {
    await page.goto("/resume/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", showBoot: true });

  test("loads error-free and PRESS START is shown immediately", async ({ page, errors }) => {
    await page.goto("/");
    const start = page.getByRole("button", { name: /press start/i });
    await expect(start).toBeVisible({ timeout: 1_000 });
    const opacity = await start.evaluate(
      (el) => getComputedStyle(el.closest(".boot-line")!).opacity,
    );
    expect(opacity).toBe("1");

    // The overlay focuses its button once hydrated; a key pressed before that has no listener yet.
    await expect(start).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Boot screen" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
