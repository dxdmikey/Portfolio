/**
 * Contact form logic, framework-free: validation, the Web3Forms request, a tiny state machine and a
 * `mailto:` fallback. No phone field exists on purpose.
 */

export const WEB3FORMS_URL = "https://api.web3forms.com/submit";
export const SUBMISSION_SUBJECT = "New transmission from the portfolio";
export const SUBMISSION_FROM_NAME = "Portfolio";
export const MESSAGE_MIN_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactFields {
  name: string;
  email: string;
  message: string;
  /** Honeypot: real people never see or tick it. */
  botcheck: boolean;
}

export const emptyFields: ContactFields = { name: "", email: "", message: "", botcheck: false };

export type FieldName = "name" | "email" | "message";
export type FieldErrorCode = "required" | "invalid-email" | "too-short";
export type FieldErrors = Partial<Record<FieldName, FieldErrorCode>>;

export function validate(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = "required";
  const email = fields.email.trim();
  if (!email) errors.email = "required";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "invalid-email";
  const message = fields.message.trim();
  if (!message) errors.message = "required";
  else if (message.length < MESSAGE_MIN_LENGTH) errors.message = "too-short";
  return errors;
}

export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;

export interface SubmitRequest {
  url: string;
  init: { method: "POST"; headers: Record<string, string>; body: string };
}

export function buildRequest(fields: ContactFields, accessKey: string): SubmitRequest {
  return {
    url: WEB3FORMS_URL,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        name: fields.name.trim(),
        email: fields.email.trim(),
        message: fields.message.trim(),
        subject: SUBMISSION_SUBJECT,
        from_name: SUBMISSION_FROM_NAME,
        botcheck: fields.botcheck,
      }),
    },
  };
}

/** A prefilled draft for the visitor's mail app (used when there is no key, or the send failed). */
export function mailtoFallback(fields: ContactFields, toEmail: string): string {
  const body = `${fields.message.trim()}\n\n${fields.name.trim()}\n${fields.email.trim()}`;
  return `mailto:${toEmail}?subject=${encodeURIComponent(SUBMISSION_SUBJECT)}&body=${encodeURIComponent(body)}`;
}

// ── State machine: idle → sending → sent | error ───────────────────────────

export type SubmitStatus = "idle" | "sending" | "sent" | "error";
export type SubmitAction = "submit" | "success" | "failure" | "reset";

const TRANSITIONS: Record<SubmitStatus, Partial<Record<SubmitAction, SubmitStatus>>> = {
  idle: { submit: "sending" },
  sending: { success: "sent", failure: "error", reset: "idle" },
  sent: { reset: "idle", submit: "sending" },
  error: { submit: "sending", reset: "idle" },
};

/** Unknown transitions are ignored, so a double click while sending can never double-submit. */
export function nextStatus(status: SubmitStatus, action: SubmitAction): SubmitStatus {
  return TRANSITIONS[status][action] ?? status;
}

// ── Sending ───────────────────────────────────────────────────────────────

export interface FetchResponseLike {
  ok: boolean;
  json(): Promise<unknown>;
}
export type FetchLike = (url: string, init: SubmitRequest["init"]) => Promise<FetchResponseLike>;

/** `mailto`: no key is configured, the caller opens the draft. */
export type SubmitOutcome = "sent" | "error" | "mailto";

export async function submitContact(fields: ContactFields, accessKey: string, fetchFn: FetchLike): Promise<SubmitOutcome> {
  if (!accessKey) return "mailto";
  // A ticked honeypot is a bot: pretend it worked and send nothing.
  if (fields.botcheck) return "sent";
  const { url, init } = buildRequest(fields, accessKey);
  try {
    const response = await fetchFn(url, init);
    if (!response.ok) return "error";
    const data = (await response.json()) as { success?: unknown };
    return data.success === true ? "sent" : "error";
  } catch {
    return "error";
  }
}
