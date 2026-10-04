import { CHAPTERS, DISCOVERY_XP, discoveryCount, expect, gotoHome, test, xpValue } from "./fixtures";

const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
/** Bring a chapter on screen without relying on the HUD (these tests are about the chapter itself). */
const visit = async (page: import("@playwright/test").Page, id: string) => {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`#${id}`)).toBeInViewport();
};

test.describe("CH0 launchpad", () => {
  test("launching the rocket counts a discovery and adds discovery XP", async ({ page }) => {
    await gotoHome(page);
    expect(await discoveryCount(page)).toBe(0);
    const xpBefore = await xpValue(page);
    await page.getByRole("button", { name: "Launch the rocket" }).click();
    await expect.poll(() => discoveryCount(page)).toBe(1);
    await expect.poll(() => xpValue(page)).toBeGreaterThanOrEqual(xpBefore + DISCOVERY_XP);
    // Once it has flown off, the same button offers a relaunch.
    await expect(page.getByRole("button", { name: "Relaunch the rocket" })).toBeVisible();
  });

  test("poking the name and pixel Ravi are discoveries", async ({ page }) => {
    await gotoHome(page);
    await page.getByRole("button", { name: "Poke the name" }).click();
    await page.getByRole("button", { name: "Say hi to pixel Ravi" }).click();
    await expect.poll(() => discoveryCount(page)).toBe(2);
  });

  test("lighting all five stars reveals the constellation", async ({ page }) => {
    await gotoHome(page);
    for (let i = 1; i <= 5; i++) {
      await page.getByRole("button", { name: `Mysterious star ${i}` }).click();
    }
    await expect(page.getByRole("button", { name: "Mysterious star 5" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => discoveryCount(page)).toBe(1);
  });
});

test.describe("CH1 pilot profile", () => {
  test("the ID card flips and a trait chip counts as a discovery", async ({ page }) => {
    test.setTimeout(60_000); // phones: the card and chips sit under smooth-scroll and NOVA's dock
    await gotoHome(page);
    await visit(page, "pilot");
    const flip = page.getByRole("button", { name: "Flip card" });
    await expect(flip).toHaveAttribute("aria-pressed", "false");
    await flip.click();
    await expect(flip).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => discoveryCount(page)).toBe(1);

    // Centre the chip with an instant jump: the page uses smooth scrolling (which defeats Playwright's
    // stability check) and on phones NOVA's dialogue (bottom-left) can cover it right after the flip.
    const anime = page.getByRole("button", { name: "Anime", exact: true });
    await anime.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(anime).toBeInViewport();
    // force: Playwright's own re-scroll parks the chip under NOVA's dock on phones; it is already centred.
    await anime.click({ force: true });
    await expect.poll(() => discoveryCount(page)).toBe(2);
  });
});

test.describe("CH4 Navayuga Station", () => {
  test("a locked module stays locked; powering in order brings the station online", async ({ page }) => {
    await gotoHome(page);
    await visit(page, "station");
    const station = page.locator("#station");
    const ready = station.getByRole("button", { name: /ready to power/ });
    const locked = station.getByRole("button", { name: /locked:/ });

    await expect(ready.first()).toBeVisible({ timeout: 15_000 }); // lazy chunk
    const lockedBefore = await locked.count();
    expect(lockedBefore).toBeGreaterThan(0);
    await locked.first().click();
    await expect(locked).toHaveCount(lockedBefore);
    await expect(station.getByText("Station online", { exact: true })).toHaveCount(0);

    // Always power whichever module is ready next: upstream first. Each one charges for a moment
    // before coming online, so wait for the next ready module instead of counting.
    for (let i = 0; i < 8; i++) {
      await expect(ready.first()).toBeVisible();
      await ready.first().click();
    }
    await expect(station.getByText("Station online", { exact: true })).toBeVisible();
    await expect(station.getByRole("button", { name: /locked:|ready to power|charging/ })).toHaveCount(0);
    await expect.poll(() => discoveryCount(page)).toBe(1);

    // Finale: one demo batch through the pipeline; progress survives a reload.
    await station.getByRole("button", { name: "Run first sync" }).click();
    await expect(station.getByText("Sync complete", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await gotoHome(page);
    await visit(page, "station");
    await expect(station.getByText("8/8 modules online")).toBeVisible({ timeout: 15_000 });
    await expect(station.getByRole("button", { name: "Run sync again" })).toBeVisible();
  });
});

test.describe("CH5 armory", () => {
  test("flipping an ability card reveals where it was used; polishing a trophy is a discovery", async ({ page }) => {
    await gotoHome(page);
    await visit(page, "armory");
    const armory = page.locator("#armory");

    // Only the visible face is in the accessibility tree, so the back face's label appears on flip.
    const flipped = armory.getByRole("button", { name: /Where I used it/ });
    await expect(flipped).toHaveCount(0);
    // The first list in the chapter is the ability grid.
    await armory.getByRole("list").first().getByRole("button").first().click();
    await expect(flipped).toHaveCount(1);
    await expect.poll(() => discoveryCount(page)).toBe(1);

    await armory
      .getByRole("button", { name: /Polish trophy/ })
      .first()
      .click();
    await expect.poll(() => discoveryCount(page)).toBe(2);
  });
});

test.describe("CH6 side quests", () => {
  test("cracking an asteroid opens a mission briefing; Esc closes it", async ({ page }) => {
    await gotoHome(page);
    await visit(page, "side-quests");
    await page.getByRole("button", { name: /^AWS data warehouse\./ }).click();
    const dialog = page.getByRole("dialog", { name: "Mission briefing: AWS data warehouse" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("CH7 transmission", () => {
  test("the contact links are usable without sending a signal; the dish is optional", async ({ page }) => {
    await gotoHome(page);
    await visit(page, "transmission");
    const tx = page.locator("#transmission");

    // Never gated behind the game: every card is there before the dish is touched.
    const email = tx.getByRole("link", { name: "Email", exact: true });
    await expect(email).toBeVisible();
    const href = (await email.getAttribute("href")) ?? "";
    expect(href).toMatch(/^mailto:[^?]+\?subject=[^&]+/);
    expect(decodeURIComponent(href)).toContain("subject=Hello from your portfolio");
    for (const label of ["LinkedIn", "GitHub", "Resume"]) {
      await expect(tx.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(tx.getByRole("button", { name: "Copy email" })).toBeVisible();

    await tx.getByRole("button", { name: "Send a signal" }).click();
    await expect(tx.getByText("Signal sent", { exact: true })).toBeVisible();
    await expect.poll(() => discoveryCount(page)).toBe(1);
  });
});

test("sanity: the chapter list used by the tests matches the page", () => {
  expect(CHAPTERS.map((c) => c.id)).toEqual([
    "launchpad",
    "pilot",
    "vit",
    "nebula",
    "station",
    "armory",
    "side-quests",
    "transmission",
  ]);
  expect(chapter("station").number).toBe(4);
});
