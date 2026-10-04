import { transmission } from "@/content/transmission";
import { cn } from "@/lib/cn";
import type { SubmitStatus } from "@/game/contact/submit";

interface FormStatusProps {
  status: SubmitStatus;
  invalid: boolean;
  mailto: string | null;
  hasKey: boolean;
}

/** One polite live region for every outcome, plus the mail-app fallback link when needed. */
export function FormStatus({ status, invalid, mailto, hasKey }: FormStatusProps) {
  const copy = transmission.form;
  const message =
    status === "sent"
      ? copy.status.sent
      : status === "error"
        ? copy.status.error
        : invalid
          ? copy.status.invalid
          : mailto
            ? copy.status.mailto
            : "";
  const tone =
    status === "sent"
      ? "text-xp"
      : status === "error" || invalid
        ? "text-danger"
        : "text-starlight";
  return (
    <div className="flex min-h-12 flex-col gap-2">
      <p role="status" aria-live="polite" className={cn("text-sm", tone)}>
        {message}
      </p>
      {mailto ? (
        <a
          href={mailto}
          className="text-plasma min-h-11 self-start py-2 text-sm underline underline-offset-4"
        >
          {copy.mailtoLink}
        </a>
      ) : null}
      {!hasKey && !mailto && status === "idle" ? (
        <p className="text-dust text-sm">{copy.mailtoNote}</p>
      ) : null}
    </div>
  );
}
