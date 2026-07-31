"use server";

import { revalidatePath } from "next/cache";

import { submitRating } from "@/lib/data/ratings";
import { submitRecipientEmail } from "@/lib/data/recipient-email";
import { isValidEmail, normalizeEmail } from "@/lib/tracking/payment";
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

export interface RecipientEmailFormState {
  status: "idle" | "saved" | "error";
  message: string | null;
  /** Kept so a rejected submission does not empty the field the visitor typed. */
  email: string;
}

/**
 * Server action behind the recipient email form.
 *
 * The browser validates the address before it will enable the button, and this
 * validates it again, and public.submit_recipient_email() validates it a third
 * time. That is not redundancy for its own sake: a server action is an HTTP
 * endpoint, and the first two of those checks are absent when it is called by
 * anything other than the form.
 *
 * On success the tracking path is revalidated, which is what puts the new
 * "Recipient Email Received" scan into the timeline without a page reload.
 */
export async function submitRecipientEmailAction(
  _previous: RecipientEmailFormState,
  formData: FormData,
): Promise<RecipientEmailFormState> {
  const trackingId = normalizeTrackingId(String(formData.get("trackingId") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidTrackingId(trackingId)) {
    return { status: "error", message: "We could not identify that shipment.", email };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a complete email address, such as name@example.com.",
      email,
    };
  }

  const result = await submitRecipientEmail(trackingId, email);

  if (result.outcome === "saved") {
    revalidatePath(`/track/${trackingId}`);
    return { status: "saved", message: null, email };
  }

  if (result.outcome === "rate_limited") {
    return {
      status: "error",
      message: "Too many attempts from this connection. Please try again later.",
      email,
    };
  }

  if (result.outcome === "rejected") {
    // An address that arrived on an earlier attempt is a success from the
    // visitor's side, not a failure: the thing they were asked to do is done.
    if (result.reason === "already_submitted") {
      revalidatePath(`/track/${trackingId}`);
      return { status: "saved", message: null, email };
    }
    return { status: "error", message: result.message, email };
  }

  return {
    status: "error",
    message: "We could not reach the service just now. Please try again.",
    email,
  };
}
