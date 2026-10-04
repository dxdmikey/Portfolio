import { refineryIncidents } from "../../src/content/refinery-incidents";
import { rightFixIndex } from "../../src/game/refinery/incidents";
import { FIRST_SHIFT_SEED, createShift, currentIncident, currentRecord, step } from "../../src/game/refinery/shift";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, formatViolations, gotoHome, test } from "./fixtures";

const GAME = "section[aria-labelledby='refinery-title']";

/** axe on the game panel only (serious/critical, WCAG 2.1 AA), in whatever state it is in. */
async function scanGame(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include(GAME)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.length, `
${formatViolations(blocking)}
`).toBe(0);
}

/** The right key for every step of the (fixed) first shift: "begin", p/q, then 1-3 + "next". */
function perfectPlan(): string[] {
  let s = step(createShift(FIRST_SHIFT_SEED, refineryIncidents), { type: "start" }).state;
  const keys: string[] = [];
  while (s.phase !== "report") {
    if (s.phase === "briefing") {
      keys.push("begin");
      s = step(s, { type: "begin" }).state;
    } else if (s.phase === "running") {
      const good = currentRecord(s)?.isValid ?? true;
      keys.push(good ? "p" : "q");
      s = step(s, { type: "decide", choice: good ? "promote" : "quarantine" }).state;
    } else {
      const incident = currentIncident(s);
      const right = incident ? rightFixIndex(incident) : 0;
      keys.push(String(right + 1), "next");
      s = step(step(s, { type: "resolve", option: right }).state, { type: "next-incident" }).state;
    }
  }
  return keys;
}

test.describe("CH6 refinery: pipeline on-call shift", () => {
  // A whole shift is ~40 actions on a heavy page; phone emulation needs more than the default 30 s.
  test.slow();

  test("a relaxed shift plays through by keyboard to an On-call hero report", async ({ page, errors }) => {
    await gotoHome(page);
    const game = page.locator(GAME);
    await game.scrollIntoViewIfNeeded();

    const relaxed = game.getByRole("button", { name: /Relaxed mode/ });
    await expect(relaxed).toHaveAttribute("aria-pressed", "false");
    await relaxed.click();
    await expect(relaxed).toHaveAttribute("aria-pressed", "true");
    await game.getByRole("button", { name: "Start shift" }).click();

    let scannedBelt = false;
    let scannedIncident = false;
    for (const key of perfectPlan()) {
      if (key === "begin") {
        await game.getByRole("button", { name: /Start level|Take the pager/ }).click();
      } else if (key === "next") {
        if (!scannedIncident) {
          scannedIncident = true;
          await scanGame(page);
        }
        await game.getByRole("button", { name: /Next incident|Write the report/ }).click();
      } else {
        if (!scannedBelt) {
          scannedBelt = true;
          await scanGame(page);
        }
        await page.keyboard.press(key);
      }
    }

    await expect(game.getByRole("heading", { name: "Shift complete" })).toBeFocused();
    await expect(game.getByText("On-call hero")).toBeVisible();
    await expect(game.getByText("3/3")).toBeVisible();
    await scanGame(page);
    expect(errors).toEqual([]);
  });

  test("three bad records promoted pages you, and Retry starts over", async ({ page }) => {
    await gotoHome(page);
    const game = page.locator(GAME);
    await game.scrollIntoViewIfNeeded();
    await game.getByRole("button", { name: /Relaxed mode/ }).click();
    await game.getByRole("button", { name: "Start shift" }).click();
    const paged = game.getByRole("heading", { name: "Paged at 3am" });
    while (!(await paged.isVisible())) {
      const begin = game.getByRole("button", { name: "Start level" });
      if (await begin.isVisible()) await begin.click();
      else await game.getByRole("button", { name: /^Promote/ }).click();
    }
    await game.getByRole("button", { name: "Retry shift" }).click();
    await expect(game.getByRole("button", { name: "Start level" })).toBeFocused();
  });
});
