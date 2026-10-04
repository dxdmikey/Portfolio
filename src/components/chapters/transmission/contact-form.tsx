"use client";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { transmission } from "@/content/transmission";
import { FormField } from "./form-field";
import { FormStatus } from "./form-status";
import { useContactForm } from "./use-contact-form";

/**
 * "Transmit a message": name, email, message and a hidden honeypot. No phone field, ever.
 * `onSent` lets the dish fire its beam after a successful send.
 */
export function ContactForm({ onSent }: { onSent: () => void }) {
  const copy = transmission.form;
  const { fields, errors, status, mailto, invalid, formRef, onChange, onSubmit, hasKey } =
    useContactForm(onSent);
  const sending = status === "sending";
  return (
    <section aria-labelledby="transmit-title">
      <h3 id="transmit-title" className="font-pixel text-px-md text-plasma uppercase">
        {copy.title}
      </h3>
      <p className="text-dust mt-3 mb-5 max-w-[52ch]">{copy.intro}</p>
      <PixelCard accent="plasma" className="p-4 sm:p-6">
        <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-1">
          <FormField name="name" value={fields.name} error={errors.name} onChange={onChange} />
          <FormField name="email" value={fields.email} error={errors.email} onChange={onChange} />
          <FormField
            name="message"
            value={fields.message}
            error={errors.message}
            onChange={onChange}
          />
          <input
            type="checkbox"
            name="botcheck"
            checked={fields.botcheck}
            onChange={onChange}
            tabIndex={-1}
            autoComplete="off"
            hidden
          />
          <PixelButton type="submit" disabled={sending} className="mt-2 self-start">
            {sending ? copy.submitting : copy.submit}
          </PixelButton>
          <FormStatus status={status} invalid={invalid} mailto={mailto} hasKey={hasKey} />
        </form>
      </PixelCard>
    </section>
  );
}
