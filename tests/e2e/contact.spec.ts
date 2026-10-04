import { expect, gotoHome, test } from "./fixtures";
import type { Page } from "@playwright/test";

const WEB3FORMS = "https://api.web3forms.com/**";

const visit = async (page: Page, id: string) => {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`#${id}`)).toBeInViewport();
};

async function fillValid(page: Page) {
  const form = page.locator("#transmission form");
  await form.getByLabel("Your name").fill("Ada Lovelace");
  await form.getByLabel("Your email").fill("ada@example.com");
  await form.getByLabel("Message").fill("Hi Ravi, we have a lakehouse role for you.");
  return form;
}

// The real access key is set, so every test intercepts Web3Forms: no test may ever send a real email.
test.describe("CH7 contact form", () => {
  test("validates fields before sending", async ({ page }) => {
    let calls = 0;
    await page.route(WEB3FORMS, (route) => {
      calls += 1;
      return route.abort();
    });
    await gotoHome(page);
    await visit(page, "transmission");
    const form = page.locator("#transmission form");

    await form.getByRole("button", { name: "Transmit" }).click();
    await expect(form.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel("Your email")).toHaveAccessibleDescription(
      "This field is required.",
    );
    await expect(form.getByText("Please fix the highlighted fields.")).toBeVisible();

    await form.getByLabel("Your name").fill("Ada Lovelace");
    await form.getByLabel("Your email").fill("not-an-email");
    await form.getByLabel("Message").fill("Hi Ravi, we have a lakehouse role for you.");
    await form.getByRole("button", { name: "Transmit" }).click();
    await expect(form.getByLabel("Your email")).toHaveAccessibleDescription(/valid email address/);
    expect(calls).toBe(0);
  });

  test("posts to Web3Forms and confirms", async ({ page }) => {
    let body: Record<string, unknown> = {};
    await page.route(WEB3FORMS, async (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"success":true}',
      });
    });
    await gotoHome(page);
    await visit(page, "transmission");
    const form = await fillValid(page);
    await form.getByRole("button", { name: "Transmit" }).click();

    await expect(page.getByText(/Message sent/)).toBeVisible();
    expect(body.email).toBe("ada@example.com");
    expect(String(body.message)).toContain("lakehouse role");
    expect(typeof body.access_key).toBe("string");
  });

  test("falls back to a prefilled mailto when sending fails", async ({ page }) => {
    await page.route(WEB3FORMS, (route) => route.abort());
    await gotoHome(page);
    await visit(page, "transmission");
    const form = await fillValid(page);
    await form.getByRole("button", { name: "Transmit" }).click();

    await expect(page.getByText(/did not go through/)).toBeVisible();
    const draft = page
      .locator("#transmission")
      .getByRole("link", { name: "Open the prefilled email" });
    const href = (await draft.getAttribute("href")) ?? "";
    expect(href).toMatch(/^mailto:[^?]+\?subject=/);
    expect(decodeURIComponent(href)).toContain("lakehouse role");
  });

  test("has no phone field", async ({ page }) => {
    await gotoHome(page);
    await visit(page, "transmission");
    await expect(page.locator("#transmission form").getByLabel(/phone|mobile|tel/i)).toHaveCount(0);
  });
});
