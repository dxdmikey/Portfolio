import type { Page } from "@playwright/test";
import { novaChapterLines } from "../../src/content/nova";
import { CHAPTERS, expect, flyTo, gotoHome, hud, systemButton, test } from "./fixtures";

test.describe("star chart", () => {
  test("opens as a dialog; picking a chapter closes it and warps there", async ({ page }) => {
    await gotoHome(page);
    await hud(page).getByRole("button", { name: "Open star chart" }).click();
    const dialog = page.getByRole("dialog", { name: "Star chart" });
    await expect(dialog).toBeVisible();
    // Desktop: planets on the map. Phones: the warp list. Same accessible name either way.
    await dialog.getByRole("button", { name: /Navayuga Station.*Warp there/ }).click({ timeout: 15_000 });
    await expect(dialog).toBeHidden();
    await expect(page.locator("#station")).toBeInViewport();
  });

  test("Esc closes it", async ({ page }) => {
    await gotoHome(page);
    await hud(page).getByRole("button", { name: "Open star chart" }).click();
    const dialog = page.getByRole("dialog", { name: "Star chart" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("NOVA co-pilot", () => {
  const novaLive = (page: Page) => page.getByRole("complementary", { name: "NOVA co-pilot" }).locator("p[aria-live=polite]");

  test("speaks into its live region after flying to a chapter", async ({ page }) => {
    await gotoHome(page);
    await flyTo(page, CHAPTERS.find((c) => c.id === "nebula")!);
    await expect(novaLive(page)).toContainText(novaChapterLines.nebula[0]!);
  });

  test("catches up after an instant jump to the last chapter", async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => {
      const target = document.getElementById("transmission");
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    });
    await expect(novaLive(page)).toContainText(novaChapterLines.transmission[0]!, { timeout: 2_000 });
  });
});

test.describe("theme", () => {
  test("switches to day mode and persists across reload", async ({ page }) => {
    await gotoHome(page);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await (await systemButton(page, "Switch to day mode")).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });
});
