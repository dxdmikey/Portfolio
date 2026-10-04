import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/chapters/transmission/contact-form";
import { renderWithGame, stubReducedMotion } from "./support/render-with-game";

beforeAll(stubReducedMotion);

const originalLocation = window.location;
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

async function fillValid() {
  await userEvent.type(screen.getByLabelText("Your name"), "Ada");
  await userEvent.type(screen.getByLabelText("Your email"), "ada@example.com");
  await userEvent.type(screen.getByLabelText("Message"), "Hello Ravi, let us talk about a role.");
}

/** Loads the form against a stubbed access key, so tests never depend on the real one. */
async function loadWith(key: string) {
  vi.resetModules();
  vi.doMock("@/content/transmission", async (orig) => ({
    ...(await orig<typeof import("@/content/transmission")>()),
    WEB3FORMS_ACCESS_KEY: key,
  }));
  const form = await import("@/components/chapters/transmission/contact-form");
  const helpers = await import("./support/render-with-game");
  return { Form: form.ContactForm, render: helpers.renderWithGame };
}

describe("ContactForm (validation)", () => {
  it("shows labelled, accessible errors and focuses the first invalid field", async () => {
    renderWithGame(<ContactForm onSent={() => undefined} />);
    await userEvent.click(screen.getByRole("button", { name: "Transmit" }));

    const name = screen.getByLabelText("Your name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveFocus();
    expect(screen.getByLabelText("Your email")).toHaveAccessibleDescription(
      "This field is required.",
    );
    expect(screen.getByText("Please fix the highlighted fields.")).toBeInTheDocument();
  });

  it("has no phone field and a hidden honeypot", () => {
    const { container } = renderWithGame(<ContactForm onSent={() => undefined} />);
    expect(screen.queryByLabelText(/phone|mobile|tel/i)).not.toBeInTheDocument();
    expect(container.querySelector('input[name="botcheck"][type="checkbox"]')).not.toBeVisible();
  });
});

describe("ContactForm (no access key)", () => {
  afterEach(() => {
    vi.doUnmock("@/content/transmission");
  });

  it("opens a prefilled mailto draft and shows it as a visible link", async () => {
    const loc = { href: "" } as unknown as Location;
    Object.defineProperty(window, "location", { configurable: true, value: loc });
    const { Form, render } = await loadWith("");
    render(<Form onSent={() => undefined} />);
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Transmit" }));

    const link = await screen.findByRole("link", { name: "Open the prefilled email" });
    expect(link.getAttribute("href")).toMatch(/^mailto:[^?]+\?subject=New%20transmission/);
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain(
      "Hello Ravi, let us talk about a role.",
    );
    expect(loc.href).toBe(link.getAttribute("href"));
  });
});

describe("ContactForm (with an access key)", () => {
  const loadWithKey = () => loadWith("test-key");
  afterEach(() => {
    vi.doUnmock("@/content/transmission");
    vi.unstubAllGlobals();
  });

  it("posts to Web3Forms, celebrates and fires the dish on success", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }));
    vi.stubGlobal("fetch", fetchMock);
    const { Form, render } = await loadWithKey();
    const onSent = vi.fn();
    const { events } = render(<Form onSent={onSent} />);
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Transmit" }));

    expect(await screen.findByText(/Message sent/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(onSent).toHaveBeenCalledOnce();
    expect(events.some((e) => e.type === "fx" && e.kind === "confetti")).toBe(true);
    expect(events.some((e) => e.type === "nova:say")).toBe(true);
    expect(screen.getByLabelText("Your name")).toHaveValue("");
  });

  it("shows an error and a mailto fallback when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const { Form, render } = await loadWithKey();
    const onSent = vi.fn();
    render(<Form onSent={onSent} />);
    await fillValid();
    await userEvent.click(screen.getByRole("button", { name: "Transmit" }));

    expect(await screen.findByText(/did not go through/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the prefilled email" })).toBeInTheDocument();
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Your name")).toHaveValue("Ada");
  });
});
