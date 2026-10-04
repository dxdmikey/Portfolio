"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { WEB3FORMS_ACCESS_KEY, transmission } from "@/content/transmission";
import { profile } from "@/content/profile";
import {
  emptyFields,
  hasErrors,
  mailtoFallback,
  nextStatus,
  submitContact,
  validate,
  type ContactFields,
  type FieldErrors,
  type FieldName,
  type SubmitAction,
  type SubmitStatus,
} from "@/game/contact/submit";
import { useGame } from "@/providers/game-provider";

const FIELD_ORDER: readonly FieldName[] = ["name", "email", "message"];

/** Form state and the submit handler. `fetch` and `window.location` are only touched inside it. */
export function useContactForm(onSent: () => void) {
  const { bus, sfx } = useGame();
  const [fields, setFields] = useState<ContactFields>(emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [mailto, setMailto] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const step = (action: SubmitAction) => setStatus((s) => nextStatus(s, action));

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const next =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : value;
    setFields((f) => ({ ...f, [name]: next }));
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name as FieldName];
      return next;
    });
  };

  const celebrate = () => {
    const rect = formRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;
    bus.emit({ type: "fx", kind: "confetti", x, y, accent: "xp" });
    bus.emit({ type: "fx", kind: "ripple", x, y, accent: "plasma" });
    bus.emit({ type: "nova:say", text: transmission.form.novaSent });
    sfx.play("success");
    onSent();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const found = validate(fields);
    setErrors(found);
    if (hasErrors(found)) {
      sfx.play("error");
      const first = FIELD_ORDER.find((n) => found[n]);
      const target = first ? e.currentTarget.elements.namedItem(first) : null;
      if (target instanceof HTMLElement) target.focus();
      return;
    }
    const draft = mailtoFallback(fields, profile.email);
    step("submit");
    sfx.play("select");
    const outcome = await submitContact(fields, WEB3FORMS_ACCESS_KEY, (url, init) =>
      fetch(url, init),
    );
    if (outcome === "mailto") {
      // No key configured (only if WEB3FORMS_ACCESS_KEY is ever emptied): hand the message to the
      // visitor's mail app. The link is the visible fallback.
      step("reset");
      setMailto(draft);
      window.location.href = draft;
      return;
    }
    if (outcome === "sent") {
      step("success");
      setMailto(null);
      setFields(emptyFields);
      celebrate();
      return;
    }
    step("failure");
    sfx.play("error");
    setMailto(draft);
  };

  return {
    fields,
    errors,
    status,
    mailto,
    invalid: hasErrors(errors),
    formRef,
    onChange,
    onSubmit,
    hasKey: WEB3FORMS_ACCESS_KEY !== "",
  };
}
