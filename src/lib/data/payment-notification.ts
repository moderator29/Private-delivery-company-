import "server-only";

import { headers } from "next/headers";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { normalizeTrackingId } from "@/lib/tracking/tracking-id";

export type PaymentNotificationResult =
  | { outcome: "saved" }
  | { outcome: "rate_limited" }
  | { outcome: "rejected"; reason: PaymentRejectionReason; message: string }
  | { outcome: "error" };

export type PaymentRejectionReason = "not_found" | "not_ready" | "already_submitted" | "unknown";

/**
 * What the visitor is told for each verdict the database can return.
 *
 * "not_found" and "not_ready" read the same way on purpose. Distinguishing them
 * would tell whoever holds a tracking number whether that shipment is at the
 * stage where payment can be reported, which is a fact about someone else's
 * shipment.
 */
const REASON_MESSAGES: Record<PaymentRejectionReason, string> = {
  not_found: "We could not confirm this shipment is ready for a payment notification.",
  not_ready: "We could not confirm this shipment is ready for a payment notification.",
  already_submitted: "A payment notification has already been received for this shipment.",
  unknown: "We could not record that notification. Please try again.",
};

function toReason(value: unknown): PaymentRejectionReason {
  return value === "not_found" || value === "not_ready" || value === "already_submitted"
    ? value
    : "unknown";
}

/**
 * Records that the recipient reported sending payment.
 *
 * Writes through public.submit_payment_notification(), the only path an
 * anonymous caller has to move a shipment into reviewing_payment. Every rule
 * that matters — the shipment exists, is not archived, has already had an email
 * received, and has not already been reported — is enforced inside that
 * function, so posting directly to the RPC is no more powerful than the button.
 *
 * This does not mark a shipment paid. It records a claim that finance reviews by
 * hand.
 *
 * The throttle here is the friendly backstop; the database's own preconditions
 * are what make walking tracking numbers pointless.
 */
export async function submitPaymentNotification(
  trackingId: string,
): Promise<PaymentNotificationResult> {
  const requestHeaders = await headers();
  const identifier = requestIdentifier(requestHeaders);

  const limit = rateLimit(identifier, {
    bucket: "payment-notification",
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) return { outcome: "rate_limited" };

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("submit_payment_notification", {
      p_tracking_id: normalizeTrackingId(trackingId),
    });

    if (error) {
      // Logged without the tracking ID, so operational logs do not accumulate a
      // record of which shipments people are paying for.
      console.error("Payment notification submit failed", { code: error.code });
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
    console.error("Payment notification submit threw", cause);
    return { outcome: "error" };
  }
}
