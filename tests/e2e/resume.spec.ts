import { expect, NAME, PDF_HREF, test } from "./fixtures";

const PHONE_PATTERNS = ["+91", "8955540092"];

test.describe("resume page", () => {
  test("shows name, role and employer, with no phone number", async ({ page, errors }) => {
    await page.goto("/resume/");
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    const body = page.locator("body");
    await expect(body).toContainText("Data & AI Engineer");
    await expect(body).toContainText("Navayuga Engineering Company Ltd");
    const text = await body.innerText();
    for (const p of PHONE_PATTERNS) expect(text).not.toContain(p);
    expect(await page.content()).not.toMatch(/\+91|8955540092/);
    await expect(page.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", PDF_HREF);
    await expect(page.getByRole("link", { name: /Back to the game/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("homepage and resume HTML contain no phone number", async ({ request }) => {
    for (const path of ["/", "/resume/"]) {
      const res = await request.get(path);
      expect(res.ok(), path).toBe(true);
      const html = await res.text();
      for (const p of PHONE_PATTERNS) expect(html, `${path} contains ${p}`).not.toContain(p);
    }
  });
});
