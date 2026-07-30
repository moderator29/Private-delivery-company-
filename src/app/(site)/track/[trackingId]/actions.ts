"use server";

import { revalidatePath } from "next/cache";

import { submitRating } from "@/lib/data/ratings";
import { isValidTrackingId, normalizeTrackingId } from "@/lib/tracking/tracking-id";

export interface RatingFormState {
  status: "idle" | "saved" | "error";
  message: string | null;
}

/**
 * Server action behind the delivery rating form.
 *
 * Next.js server actions carry an origin check, so this cannot be posted from
 * another site. Every rule that matters, including "delivered shipments only"
 * and "one rating per shipment", is enforced by the database function this
 * calls, not here.
 */
export async function rateDeliveryAction(
  _previous: RatingFormState,
  formData: FormData,
): Promise<RatingFormState> {
  const trackingId = normalizeTrackingId(String(formData.get("trackingId") ?? ""));
  const stars = Number(formData.get("stars"));
  const rawComment = String(formData.get("comment") ?? "").trim();

  if (!isValidTrackingId(trackingId)) {
    return { status: "error", message: "We could not identify that shipment." };
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { status: "error", message: "Choose a rating between one and five stars." };
  }

  if (rawComment.length > 600) {
    return { status: "error", message: "Please keep your comment under 600 characters." };
  }

  const result = await submitRating(trackingId, stars, rawComment || null);

  if (result.outcome === "saved") {
    revalidatePath(`/track/${trackingId}`);
    return { status: "saved", message: "Thank you. Your rating has been recorded." };
  }

  if (result.outcome === "rate_limited") {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  if (result.outcome === "invalid") {
    return { status: "error", message: result.message };
  }

  return { status: "error", message: "We could not save your rating. Please try again." };
}
