import { describe, expect, it, vi } from "vitest";
import {
  buildRequest,
  emptyFields,
  hasErrors,
  mailtoFallback,
  nextStatus,
  submitContact,
  validate,
  type ContactFields,
  type FetchLike,
} from "@/game/contact/submit";

const valid: ContactFields = { name: " Ada ", email: "ada@example.com", message: "Hello Ravi, let us talk.", botcheck: false };

describe("validate", () => {
  it("accepts a complete message", () => {
    expect(hasErrors(validate(valid))).toBe(false);
  });

  it("requires every field", () => {
    expect(validate(emptyFields)).toEqual({ name: "required", email: "required", message: "required" });
    expect(validate({ ...valid, name: "   " }).name).toBe("required");
  });

  it("rejects malformed emails and very short messages", () => {
    expect(validate({ ...valid, email: "ada@" }).email).toBe("invalid-email");
    expect(validate({ ...valid, email: "ada example.com" }).email).toBe("invalid-email");
    expect(validate({ ...valid, message: "hi" }).message).toBe("too-short");
  });
});

describe("buildRequest", () => {
  it("posts JSON to Web3Forms with the key, trimmed fields and the honeypot", () => {
    const { url, init } = buildRequest(valid, "KEY");
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json", Accept: "application/json" });
    expect(JSON.parse(init.body)).toEqual({
      access_key: "KEY",
      name: "Ada",
      email: "ada@example.com",
      message: "Hello Ravi, let us talk.",
      subject: "New transmission from the portfolio",
      from_name: "Portfolio",
      botcheck: false,
    });
  });

  it("never sends a phone field", () => {
    expect(Object.keys(JSON.parse(buildRequest(valid, "KEY").init.body)).join(",")).not.toMatch(/phone|tel/i);
  });
});

describe("mailtoFallback", () => {
  it("builds a prefilled, encoded mailto link", () => {
    const href = mailtoFallback({ ...valid, message: "Hi & hello\nsecond line" }, "ravi@example.com");
    expect(href.startsWith("mailto:ravi@example.com?subject=")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe("New transmission from the portfolio");
    expect(params.get("body")).toBe("Hi & hello\nsecond line\n\nAda\nada@example.com");
  });
});

describe("nextStatus", () => {
  it("runs idle, sending, then sent or error", () => {
    expect(nextStatus("idle", "submit")).toBe("sending");
    expect(nextStatus("sending", "success")).toBe("sent");
    expect(nextStatus("sending", "failure")).toBe("error");
    expect(nextStatus("error", "submit")).toBe("sending");
    expect(nextStatus("sent", "reset")).toBe("idle");
  });

  it("ignores a second submit while sending", () => {
    expect(nextStatus("sending", "submit")).toBe("sending");
    expect(nextStatus("idle", "success")).toBe("idle");
  });
});

describe("submitContact", () => {
  const ok = (body: unknown): FetchLike => vi.fn(async () => ({ ok: true, json: async () => body }));

  it("falls back to mailto when there is no access key, without any network call", async () => {
    const fetchFn = ok({ success: true });
    expect(await submitContact(valid, "", fetchFn)).toBe("mailto");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("reports sent on a successful API response", async () => {
    const fetchFn = ok({ success: true });
    expect(await submitContact(valid, "KEY", fetchFn)).toBe("sent");
    expect(fetchFn).toHaveBeenCalledWith("https://api.web3forms.com/submit", expect.objectContaining({ method: "POST" }));
  });

  it("reports an error for API failures, bad statuses and network errors", async () => {
    expect(await submitContact(valid, "KEY", ok({ success: false }))).toBe("error");
    expect(await submitContact(valid, "KEY", async () => ({ ok: false, json: async () => ({}) }))).toBe("error");
    expect(
      await submitContact(valid, "KEY", async () => {
        throw new Error("offline");
      }),
    ).toBe("error");
  });

  it("silently drops submissions that tick the honeypot", async () => {
    const fetchFn = ok({ success: true });
    expect(await submitContact({ ...valid, botcheck: true }, "KEY", fetchFn)).toBe("sent");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
