import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

const CONTROL_BASE =
  "w-full rounded-control border bg-white text-ink-800 placeholder:text-ink-400 transition-colors duration-150 disabled:bg-ink-50 disabled:text-ink-400";

const CONTROL_SIZING = "min-h-11 px-3.5 py-2.5 text-sm";

function controlClasses(invalid: boolean, className?: string) {
  return cn(
    CONTROL_BASE,
    CONTROL_SIZING,
    invalid ? "border-brand-400 focus:border-brand-600" : "border-ink-200 focus:border-ink-400",
    className,
  );
}

/**
 * Wraps a control with its label, optional hint and error message, and wires up
 * the aria attributes between them.
 *
 * The error is rendered in an aria-live region and referenced by
 * aria-describedby on the control, so a screen reader announces the problem when
 * server-side validation fails rather than the visitor discovering it visually.
 */
export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Renders the label for assistive tech only, for compact search inputs. */
  hideLabel?: boolean;
  className?: string;
  children: (controlProps: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    "aria-required": boolean | undefined;
  }) => ReactNode;
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-medium text-ink-700",
          hideLabel && "sr-only-focusable absolute",
        )}
      >
        {label}
        {required ? (
          <span className="ml-1 text-brand-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}

      <p
        id={errorId}
        role={error ? "alert" : undefined}
        aria-live="polite"
        className={cn("text-xs font-medium text-brand-700", !error && "hidden")}
      >
        {error}
      </p>
    </div>
  );
}

export type TextInputProps = ComponentProps<"input"> & { invalid?: boolean };

export function TextInput({ invalid, className, ...rest }: TextInputProps) {
  return <input className={controlClasses(Boolean(invalid), className)} {...rest} />;
}

export type TextAreaProps = ComponentProps<"textarea"> & { invalid?: boolean };

export function TextArea({ invalid, className, rows = 5, ...rest }: TextAreaProps) {
  return (
    <textarea rows={rows} className={controlClasses(Boolean(invalid), className)} {...rest} />
  );
}

export type SelectProps = ComponentProps<"select"> & { invalid?: boolean };

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        controlClasses(Boolean(invalid), className),
        // Room for the native chevron without the text running under it.
        "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%20stroke%3D%22%236b7484%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[position:right_0.875rem_center] bg-no-repeat pr-10",
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
