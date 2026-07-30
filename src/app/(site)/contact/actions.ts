"use server";

import { submitSupportRequest, supportRequestSchema } from "@/lib/data/support";

export interface ContactFormState {
  status: "idle" | "sent" | "error";
  message: string | null;
  /** Field name to error message, for inline display. */
  fieldErrors: Record<string, string>;
  /** Echoed back so a failed submission does not clear what was typed. */
  values: Record<string, string>;
}

const FIELDS = ["name", "email", "phone", "subject", "trackingId", "message"] as const;

/**
 * Server action behind the contact form.
 *
 * Validates with the same schema the data layer uses, then writes through the
 * constrained database function. Next.js server actions carry an origin check,
 * so this cannot be submitted from another site.
 */
export async function submitContactAction(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<string, string>;

  // Honeypot. A real person never fills a field they cannot see, so anything
  // here is a bot. Answer as though it succeeded rather than teaching the bot
  // what tripped it.
  if (String(formData.get("company") ?? "").trim().length > 0) {
    return { status: "sent", message: "Thank you. Your message has been received.", fieldErrors: {}, values: {} };
  }

  const parsed = supportRequestSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors,
      values,
    };
  }

  const result = await submitSupportRequest(parsed.data);

  if (result.outcome === "sent") {
    return {
      status: "sent",
      message: "Thank you. Your message has been received and our team will reply by email.",
      fieldErrors: {},
      values: {},
    };
  }

  if (result.outcome === "rate_limited") {
    return {
      status: "error",
      message:
        "You have sent several messages recently. Please wait a little while before sending another, or call us if it is urgent.",
      fieldErrors: {},
      values,
    };
  }

  return {
    status: "error",
    message: "We could not send your message just now. Please try again, or email us directly.",
    fieldErrors: {},
    values,
  };
}
