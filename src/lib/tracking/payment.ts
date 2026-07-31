/**
 * The recipient payment flow.
 *
 * Some shipments stop and wait for the recipient to supply a contact address
 * before payment instructions and the supporting documents can be issued. Two
 * of these states are visible on the tracking page: one asks for an address,
 * the other confirms it arrived.
 *
 * The vocabulary mirrors the shipments_payment_status_known check constraint
 * exactly. Anything outside it parses to null, which the page reads as "this
 * shipment is not in the flow" — the safe answer for a value written by a
 * version of the schema this build does not know about.
 */

export const PAYMENT_STATUSES = [
  "not_required",
  "awaiting_recipient_email",
  "email_received",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Operator-facing wording. The public page never names a payment state. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_required: "No payment needed",
  awaiting_recipient_email: "Awaiting the recipient's email address",
  email_received: "Email address received",
};

export function parsePaymentStatus(value: unknown): PaymentStatus | null {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value)
    ? (value as PaymentStatus)
    : null;
}

/**
 * The longest address RFC 5321 allows in a MAIL command, and the limit the
 * column check constraint carries.
 */
export const MAX_EMAIL_LENGTH = 254;

/**
 * Deliberately the same expression as the database check constraint and
 * public.submit_recipient_email(), so the browser, the server action and
 * Postgres agree on what an address is. It is intentionally permissive about
 * the local part — the only real proof an address works is mail arriving at it —
 * and strict about the two things that are always wrong: no whitespace, and a
 * dotted domain.
 */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** Trims and lower-cases. Always returns a string and never throws. */
export function normalizeEmail(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

/** Tests the normalized form, so " Someone@Example.COM " is valid. */
export function isValidEmail(input: string | null | undefined): boolean {
  const normalized = normalizeEmail(input);
  return normalized.length > 0 && normalized.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(normalized);
}

/**
 * The message shown under the field, or null when there is nothing to say.
 *
 * An empty box is not an error while someone is still filling it in; the submit
 * button being disabled already carries that. So this only speaks up once there
 * is something typed that cannot be an address.
 */
export function emailValidationMessage(input: string): string | null {
  const normalized = normalizeEmail(input);
  if (normalized === "") return null;
  if (normalized.length > MAX_EMAIL_LENGTH) return "That address is too long.";
  if (!EMAIL_PATTERN.test(normalized)) {
    return "Enter a complete email address, such as name@example.com.";
  }
  return null;
}
