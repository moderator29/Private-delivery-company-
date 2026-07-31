import "server-only";

import { headers } from "next/headers";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/tracking/payment";
import { normalizeTrackingId } from "@/lib/tracking/tracking-id";

export type RecipientEmailResult =
  | { outcome: "saved" }
  | { outcome: "rate_limited" }
  | { outcome: "rejected"; reason: RejectionReason; message: string }
  | { outcome: "error" };

export type RejectionReason =
  | "invalid_email"
  | "not_found"
  | "not_requested"
  | "already_submitted"
  | "unknown";

/**
 * What the visitor is told for each verdict the database can return.
 *
 * "not_found" and "not_requested" deliberately read the same way. Distinguishing
 * them would tell whoever holds a tracking number whether that shipment is
 * waiting on an address, which is a fact about someone else's delivery.
 */
const REASON_MESSAGES: Record<RejectionReason, string> = {
  invalid_email: "Enter a complete email address, such as name@example.com.",
  not_found: "We could not confirm this shipment is waiting for an email address.",
  not_requested: "We could not confirm this shipment is waiting for an email address.",
  already_submitted: "An email address has already been received for this shipment.",
  unknown: "We could not save that email address. Please try again.",
};

function toReason(value: unknown): RejectionReason {
  return value === "invalid_email" ||
    value === "not_found" ||
    value === "not_requested" ||
    value === "already_submitted"
    ? value
    : "unknown";
}

/**
 * Records the address a recipient submits from their tracking page.
 *
 * Writes through public.submit_recipient_email(), which is the only path an
 * anonymous caller has to these columns. Every rule that matters — the shipment
 * exists, is not archived, is actually asking for an address, and has not
 * already been answered — is enforced inside that function, so posting directly
 * to the RPC is no more powerful than using the form.
 *
 * The throttle here is the friendly one. It stops a single connection walking
 * tracking numbers; the database's own preconditions are what make walking them
 * pointless.
 */
export async function submitRecipientEmail(
  trackingId: string,
  email: string,
): Promise<RecipientEmailResult> {
  const requestHeaders = await headers();
  const identifier = requestIdentifier(requestHeaders);

  const limit = rateLimit(identifier, {
    bucket: "recipient-email",
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) return { outcome: "rate_limited" };

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("submit_recipient_email", {
      p_tracking_id: normalizeTrackingId(trackingId),
      p_email: normalizeEmail(email),
    });

    if (error) {
      // Logged without the tracking ID or the address, so operational logs do
      // not accumulate a record of who is expecting what.
      console.error("Recipient email submit failed", { code: error.code });
      return { outcome: "error" };
    }

    const payload =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    if (payload.ok === true) return { outcome: "saved" };

    const reason = toReason(payload.reason);
    return { outcome: "rejected", reason, message: REASON_MESSAGES[reason] };
  } catch (cause) {
    console.error("Recipient email submit threw", cause);
    return { outcome: "error" };
  }
}
