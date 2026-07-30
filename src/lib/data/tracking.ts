import "server-only";

import { headers } from "next/headers";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { isValidTrackingId, normalizeTrackingId } from "@/lib/tracking/tracking-id";
import { parseTrackedShipment, type TrackedShipment } from "@/lib/tracking/shipment";

export type TrackingLookupResult =
  | { outcome: "found"; shipment: TrackedShipment }
  | { outcome: "not_found" }
  | { outcome: "invalid_format" }
  | { outcome: "rate_limited"; retryAfterSeconds: number }
  | { outcome: "error" };

/**
 * Public tracking lookup.
 *
 * Reads through public.track_shipment(), which is the only path an anonymous
 * caller has to shipment data and which returns just the approved public field
 * set. Nothing here queries a table directly, so there is no query for a policy
 * mistake to expose.
 *
 * "not_found" is returned identically for an ID that never existed, one that was
 * archived, and one that is well formed but unknown. The caller cannot tell
 * these apart, which is what stops the page from confirming whether a given ID
 * exists in the database.
 */
export async function lookupShipment(rawTrackingId: string): Promise<TrackingLookupResult> {
  const trackingId = normalizeTrackingId(rawTrackingId);

  // Rejected before any network call, so malformed input costs nothing and
  // cannot be used to probe the backend.
  if (!isValidTrackingId(trackingId)) {
    return { outcome: "invalid_format" };
  }

  const requestHeaders = await headers();
  const limit = rateLimit(requestIdentifier(requestHeaders), {
    bucket: "track",
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return { outcome: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };
  }

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("track_shipment", { p_tracking_id: trackingId });

    if (error) {
      // Logged without the tracking ID so operational logs do not accumulate
      // a record of which shipments people looked up.
      console.error("Tracking lookup failed", { code: error.code, message: error.message });
      return { outcome: "error" };
    }

    const shipment = parseTrackedShipment(data);
    if (!shipment) return { outcome: "not_found" };

    return { outcome: "found", shipment };
  } catch (cause) {
    console.error("Tracking lookup threw", cause);
    return { outcome: "error" };
  }
}
