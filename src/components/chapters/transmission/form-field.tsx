import type { ChangeEvent } from "react";
import { transmission } from "@/content/transmission";
import { cn } from "@/lib/cn";
import type { FieldErrorCode, FieldName } from "@/game/contact/submit";

interface FormFieldProps {
  name: FieldName;
  value: string;
  error: FieldErrorCode | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const CONTROL =
  "bg-void text-starlight placeholder:text-dust border-grid focus:border-plasma w-full border-2 px-3 py-2 text-base outline-offset-2";
const MESSAGE_ROWS = 5;

const INPUT_PROPS = {
  name: { type: "text", autoComplete: "name" },
  email: { type: "email", autoComplete: "email", inputMode: "email" },
} as const;

/** Label, control and a live error message, wired with aria-invalid / aria-describedby. */
export function FormField({ name, value, error, onChange }: FormFieldProps) {
  const { label, placeholder } = transmission.form.fields[name];
  const id = `tx-${name}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    value,
    onChange,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    "aria-required": true,
    className: cn(CONTROL, error && "border-danger"),
  } as const;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {name === "message" ? (
        <textarea
          {...shared}
          rows={MESSAGE_ROWS}
          className={cn(shared.className, "min-h-32 resize-y")}
        />
      ) : (
        <input {...shared} {...INPUT_PROPS[name]} className={cn(shared.className, "min-h-11")} />
      )}
      <p id={errorId} className="text-danger min-h-5 text-sm">
        {error ? transmission.form.errors[error] : ""}
      </p>
    </div>
  );
}
