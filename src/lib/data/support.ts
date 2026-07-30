import "server-only";

import { headers } from "next/headers";
import { z } from "zod";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { normalizeTrackingId, TRACKING_ID_PATTERN } from "@/lib/tracking/tracking-id";

/**
 * Contact form validation. The same constraints exist in the database function
 * and as table check constraints, so a submission that skips this layer is still
 * rejected. This layer exists to produce messages a person can act on.
 */
export const supportRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(120, "Name must be 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(200, "Email must be 200 characters or fewer.")
    .regex(/^[^@\s]+@[^@\s.]+\.[^@\s]+$/, "Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number must be 40 characters or fewer.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(1, "Choose what your message is about.")
    .max(160, "Subject must be 160 characters or fewer."),
  trackingId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || TRACKING_ID_PATTERN.test(normalizeTrackingId(value)),
      "That does not look like a SwiftTrack tracking number. Leave it blank if you do not have one.",
    ),
  message: z
    .string()
    .trim()
    .min(10, "Please give us a little more detail, at least 10 characters.")
    .max(4000, "Message must be 4000 characters or fewer."),
});

export type SupportRequestInput = z.infer<typeof supportRequestSchema>;

export type SupportSubmitResult =
  | { outcome: "sent" }
  | { outcome: "rate_limited"; retryAfterSeconds: number }
  | { outcome: "error" };

/**
 * Writes a contact form submission through public.submit_support_request().
 *
 * No service role key is involved: the function is the only write path anon has
 * into support_requests, and it fixes every column the caller must not control.
 */
export async function submitSupportRequest(
  input: SupportRequestInput,
): Promise<SupportSubmitResult> {
  const requestHeaders = await headers();
  const identifier = requestIdentifier(requestHeaders);

  const limit = rateLimit(identifier, { bucket: "contact", limit: 5, windowMs: 60 * 60_000 });
  if (!limit.allowed) {
    return { outcome: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };
  }

  try {
    const supabase = createSupabaseAnonClient();
    const { error } = await supabase.rpc("submit_support_request", {
      p_name: input.name,
      p_email: input.email,
      p_subject: input.subject,
      p_message: input.message,
      p_phone: input.phone ? input.phone : undefined,
      p_tracking_id: input.trackingId ? normalizeTrackingId(input.trackingId) : undefined,
      // The identifier is already a hash, so the database never stores the
      // address itself.
      p_ip_hash: identifier,
    });

    if (error) {
      if (error.message.includes("rate_limited")) {
        return { outcome: "rate_limited", retryAfterSeconds: 3600 };
      }
      console.error("Support request insert failed", { code: error.code });
      return { outcome: "error" };
    }

    return { outcome: "sent" };
  } catch (cause) {
    console.error("Support request threw", cause);
    return { outcome: "error" };
  }
}
