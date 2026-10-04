import type { Accent, SocialLink } from "@/types/content";
import type { FieldErrorCode } from "@/game/contact/submit";

/**
 * Public Web3Forms access key for the contact form (https://web3forms.com).
 *
 * Ravi: sign up at web3forms.com with your email, then paste the key they send you between the
 * quotes below. It is a PUBLIC key by design (it only lets the form deliver mail to your inbox),
 * so it is safe to commit. While it is empty the form opens a prefilled mail draft instead.
 * NEXT_PUBLIC_WEB3FORMS_KEY (set at build time, e.g. in Vercel) overrides it without a code change.
 */
export const WEB3FORMS_ACCESS_KEY: string =
  process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "76c8bb32-c3d6-44d9-bdb7-6f5b00146c9f";

/** Copy for CH7, Transmission (contact). */
export const transmission = {
  intro: "Looking for a data & AI engineer for your crew? Open to new missions, side quests and collaborations.",
  dish: {
    send: "Send a signal",
    sending: "Transmitting…",
    sent: "Signal sent",
    resend: "Send another signal",
    hint: "Optional: aim the dish for a little light show. Every channel below works any time.",
  },
  form: {
    title: "Transmit a message",
    intro: "Write to Ravi directly. He reads every transmission.",
    fields: {
      name: { label: "Your name", placeholder: "Ada Lovelace" },
      email: { label: "Your email", placeholder: "ada@example.com" },
      message: { label: "Message", placeholder: "Tell Ravi about the mission, the team or the role." },
    },
    submit: "Transmit",
    submitting: "Transmitting…",
    /** Shown under the button while no Web3Forms key is set. */
    mailtoNote: "This opens a prefilled draft in your mail app.",
    errors: {
      required: "This field is required.",
      "invalid-email": "Enter a valid email address, like name@example.com.",
      "too-short": "Write a little more so Ravi has something to reply to.",
    } satisfies Record<FieldErrorCode, string>,
    status: {
      invalid: "Please fix the highlighted fields.",
      sent: "Message sent. Thank you, Ravi will reply soon.",
      error: "That did not go through. You can send it from your mail app instead.",
      mailto: "Opening your mail app. If nothing happens, use the link below.",
    },
    mailtoLink: "Open the prefilled email",
    novaSent: "Transmission received! Ravi answers every signal. 📡",
  },
  frequencies: {
    title: "Open frequencies",
    intro: "The fastest ways to reach Ravi. No signal needed.",
    copy: "Copy email",
    copied: "Copied!",
    resumePage: "View resume page",
  },
  /** Big link cards, keyed by `profile.links[].id`. The labels and URLs come from `profile.ts`. */
  cards: {
    email: { glyph: "@", blurb: "Fastest way to start a conversation.", accent: "plasma" },
    linkedin: { glyph: "IN", blurb: "Connect and see the career timeline.", accent: "warp" },
    github: { glyph: "GH", blurb: "Code, experiments and this very site.", accent: "xp" },
    resume: { glyph: "CV", blurb: "One page, ready to download.", accent: "coin" },
  } satisfies Record<SocialLink["id"], { glyph: string; blurb: string; accent: Accent }>,
  copyCard: { glyph: "CP", blurb: "Copy the address to your clipboard.", accent: "plasma" as Accent },
  mail: {
    subject: "Hello from your portfolio",
    body: "Hi Ravi,\n\nI flew through PORTFOLIO.EXE and wanted to say hello.\n\n",
  },
  footer: "© 2026 · Data & AI Engineer · Hyderabad, India",
} as const;
