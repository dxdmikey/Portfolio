import { CHAPTERS, expect, flyTo, gotoHome, hud, NAME, test } from "./fixtures";

const STORY = CHAPTERS.filter((c) => c.number > 0);
const SCROLL_PAUSE_MS = 120;

test.describe("home", () => {
  test("renders the name and every chapter, with no errors while scrolling top to bottom", async ({ page, errors }) => {
    await gotoHome(page);
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    for (const c of CHAPTERS) await expect(page.locator(`section#${c.id}`)).toBeAttached();
    for (const c of STORY) {
      await expect(page.getByRole("heading", { level: 2, name: c.label, exact: true }), c.label).toBeAttached();
    }

    // Fly the whole page so every lazy chunk (station, star chart, ...) and observer runs.
    const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const step = Math.floor(page.viewportSize()!.height * 0.8);
    for (let y = 0; y < maxY; y += step) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(SCROLL_PAUSE_MS);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("#transmission")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Send a signal" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("boot", () => {
  test.use({ showBoot: true });

  test("press a key, skip the countdown, hero is visible", async ({ page, errors }) => {
    await page.goto("/");
    const boot = page.getByRole("dialog", { name: "Boot screen" });
    await expect(boot).toBeVisible();
    await expect(boot.getByRole("button", { name: /press start/i })).toBeVisible();
    // The page behind the overlay is ready, but the title card owns the screen.
    await page.keyboard.press("Enter");

    const skip = page.getByRole("button", { name: "Skip countdown" });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(skip).toBeHidden();
    await expect(boot).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByRole("button", { name: "Launch the rocket" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a second visit in the same session skips the boot screen", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Skip countdown" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Boot screen" })).toHaveCount(0);
  });
});

test.describe("chapter tracker", () => {
  test("clicking a chapter scrolls there and marks it current", async ({ page, isMobile }) => {
    await gotoHome(page);
    const station = CHAPTERS.find((c) => c.id === "station")!;
    await flyTo(page, station);
    const link = hud(page).getByRole("link", { name: "Chapter 4: Navayuga Station", exact: true });
    await expect(link).toHaveAttribute("aria-current", "step");
    await expect(page).toHaveURL(/#station$/);
    if (!isMobile) {
      // The text label is hidden below the sm breakpoint.
      await expect(hud(page).locator("p[aria-live=polite]")).toContainText("CH4 Navayuga Station");
    }
  });
});

test.describe("scroll-driven sky", () => {
  test("the sky colour at the launchpad differs from the one at the transmission", async ({ page }) => {
    await gotoHome(page);
    const sample = () =>
      page.getByTestId("space-scene").evaluate((el) => {
        const canvas = el as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("space-scene has no 2d context");
        const [r, g, b] = ctx.getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data;
        return [r, g, b];
      });
    // The loop draws on scroll and at an idle cadence; give it a moment to render the first frame.
    await page.waitForTimeout(500);
    const top = await sample();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("#transmission")).toBeInViewport();
    await expect.poll(sample, { message: "sky should change colour when flying to the last chapter" }).not.toEqual(top);
  });
});

test.describe("quick view", () => {
  test("hides the story, shows the summary, persists across reload and toggles back", async ({ page }) => {
    await gotoHome(page);
    await hud(page).getByRole("button", { name: "Quick view (skip the story)", exact: true }).click();

    await expect(page.locator("html")).toHaveAttribute("data-quick", "1");
    await expect(page.locator("#pilot")).toBeHidden();
    await expect(page.getByTestId("space-scene")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-quick", "1");
    await expect(page.getByRole("dialog", { name: "Boot screen" })).toHaveCount(0);
    await expect(page.locator("#pilot")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();

    await hud(page).getByRole("button", { name: "Back to the voyage", exact: true }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-quick", /.*/);
    await expect(page.locator("#pilot")).toBeAttached();
    await expect(page.getByRole("heading", { level: 2, name: "Pilot profile" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeHidden();
  });
});
