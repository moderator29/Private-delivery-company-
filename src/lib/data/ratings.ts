import "server-only";

import { headers } from "next/headers";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { normalizeTrackingId } from "@/lib/tracking/tracking-id";

export interface RatingState {
  canRate: boolean;
  rated: boolean;
  stars: number | null;
}

/**
 * Whether the tracking page should offer a rating form.
 *
 * Answered by the database so the rule "only a delivered, unrated shipment can
 * be rated" lives in one place and cannot be bypassed by posting directly.
 */
export async function getRatingState(trackingId: string): Promise<RatingState> {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("shipment_rating_state", {
      p_tracking_id: normalizeTrackingId(trackingId),
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return { canRate: false, rated: false, stars: null };
    }

    const payload = data as Record<string, unknown>;
    return {
      canRate: payload.can_rate === true,
      rated: payload.rated === true,
      stars: typeof payload.stars === "number" ? payload.stars : null,
    };
  } catch {
    return { canRate: false, rated: false, stars: null };
  }
}

export type RatingSubmitResult =
  | { outcome: "saved" }
  | { outcome: "rate_limited" }
  | { outcome: "invalid"; message: string }
  | { outcome: "error" };

const REASON_MESSAGES: Record<string, string> = {
  invalid_rating: "Choose a rating between one and five stars.",
  comment_too_long: "Please keep your comment under 600 characters.",
  not_found: "We could not find that shipment.",
  not_delivered: "A shipment can be rated once it has been delivered.",
  already_rated: "This delivery has already been rated. Thank you.",
};

export async function submitRating(
  trackingId: string,
  stars: number,
  comment: string | null,
): Promise<RatingSubmitResult> {
  const requestHeaders = await headers();
  const identifier = requestIdentifier(requestHeaders);

  const limit = rateLimit(identifier, { bucket: "rating", limit: 10, windowMs: 60 * 60_000 });
  if (!limit.allowed) return { outcome: "rate_limited" };

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("submit_shipment_rating", {
      p_tracking_id: normalizeTrackingId(trackingId),
      p_stars: stars,
      p_comment: comment ?? undefined,
      p_ip_hash: identifier,
    });

    if (error) {
      console.error("Rating submit failed", { code: error.code });
      return { outcome: "error" };
    }

    const payload =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};
    if (payload.ok === true) return { outcome: "saved" };

    const reason = typeof payload.reason === "string" ? payload.reason : "";
    return {
      outcome: "invalid",
      message: REASON_MESSAGES[reason] ?? "We could not save that rating.",
    };
  } catch (cause) {
    console.error("Rating submit threw", cause);
    return { outcome: "error" };
  }
}

export interface ServicePerformance {
  deliveredCount: number;
  onTimePercent: number | null;
  averageTransitDays: number | null;
  ratingCount: number;
  averageStars: number | null;
  /** True when there is not yet enough real data to publish a figure. */
  isEmpty: boolean;
}

/**
 * Aggregate performance, computed from real rows by the database.
 *
 * Nothing here is estimated or seeded. When no deliveries have completed yet,
 * isEmpty is true and the UI says so rather than showing a flattering zero.
 */
export async function getServicePerformance(): Promise<ServicePerformance> {
  const empty: ServicePerformance = {
    deliveredCount: 0,
    onTimePercent: null,
    averageTransitDays: null,
    ratingCount: 0,
    averageStars: null,
    isEmpty: true,
  };

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("service_performance");

    if (error || !data || typeof data !== "object" || Array.isArray(data)) return empty;

    const payload = data as Record<string, unknown>;
    const toNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const deliveredCount = toNumber(payload.delivered_count) ?? 0;
    const ratingCount = toNumber(payload.rating_count) ?? 0;

    return {
      deliveredCount,
      onTimePercent: toNumber(payload.on_time_percent),
      averageTransitDays: toNumber(payload.average_transit_days),
      ratingCount,
      averageStars: toNumber(payload.average_stars),
      isEmpty: deliveredCount === 0 && ratingCount === 0,
    };
  } catch {
    return empty;
  }
}
