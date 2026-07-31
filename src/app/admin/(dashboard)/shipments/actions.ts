"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PermissionDeniedError, requireWriteAccess } from "@/lib/data/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/tracking/payment";
import { SERVICE_LEVELS } from "@/lib/tracking/shipment";
import { SHIPMENT_STATUSES } from "@/lib/tracking/status";
import { generateTrackingId } from "@/lib/tracking/tracking-id";

export interface ActionState {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Record<string, string>;
}

const OK: ActionState = { status: "idle", message: null, fieldErrors: {} };

/** Empty string to null, so a cleared optional field stores NULL not "". */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
    message: "Enter a positive number, or leave it blank.",
  });

const optionalCoordinate = (limit: number) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (Number.isFinite(value) && Math.abs(value) <= limit), {
      message: `Must be between -${limit} and ${limit}, or blank.`,
    });

/**
 * Blank means "not in the recipient payment flow", which is the normal case and
 * is stored as NULL rather than as an empty string the check constraint would
 * reject.
 */
const paymentStatus = z
  .string()
  .trim()
  .refine((value) => value === "" || (PAYMENT_STATUSES as readonly string[]).includes(value), {
    message: "Choose a payment state from the list.",
  })
  .transform((value) => (value === "" ? null : (value as PaymentStatus)));

const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Use a two letter country code, such as AE or US.");

const shipmentSchema = z.object({
  serviceLevel: z.enum(SERVICE_LEVELS),

  senderName: optionalText,
  senderCompany: optionalText,
  senderEmail: optionalText,
  senderPhone: optionalText,
  originCity: z.string().trim().min(1, "Origin city is required."),
  originState: optionalText,
  originPostalCode: optionalText,
  originCountry: countryCode,
  originLatitude: optionalCoordinate(90),
  originLongitude: optionalCoordinate(180),

  recipientName: optionalText,
  recipientCompany: optionalText,
  recipientEmail: optionalText,
  recipientPhone: optionalText,
  destinationAddressLine1: optionalText,
  destinationAddressLine2: optionalText,
  destinationCity: z.string().trim().min(1, "Destination city is required."),
  destinationState: optionalText,
  destinationPostalCode: optionalText,
  destinationCountry: countryCode,
  destinationLatitude: optionalCoordinate(90),
  destinationLongitude: optionalCoordinate(180),

  paymentStatus,

  packageType: optionalText,
  pieceCount: z
    .string()
    .trim()
    .transform((value) => (value === "" ? 1 : Number(value)))
    .refine((value) => Number.isInteger(value) && value > 0, "Piece count must be at least 1."),
  weightKg: optionalNumber,
  lengthCm: optionalNumber,
  widthCm: optionalNumber,
  heightCm: optionalNumber,

  estimatedDeliveryDate: optionalText,
  estimatedDeliveryWindow: optionalText,
  internalNotes: optionalText,
});

function readShipmentForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "");
  return shipmentSchema.safeParse({
    serviceLevel: read("serviceLevel") || "standard",
    senderName: read("senderName"),
    senderCompany: read("senderCompany"),
    senderEmail: read("senderEmail"),
    senderPhone: read("senderPhone"),
    originCity: read("originCity"),
    originState: read("originState"),
    originPostalCode: read("originPostalCode"),
    originCountry: read("originCountry") || "AE",
    originLatitude: read("originLatitude"),
    originLongitude: read("originLongitude"),
    recipientName: read("recipientName"),
    recipientCompany: read("recipientCompany"),
    recipientEmail: read("recipientEmail"),
    recipientPhone: read("recipientPhone"),
    destinationAddressLine1: read("destinationAddressLine1"),
    destinationAddressLine2: read("destinationAddressLine2"),
    destinationCity: read("destinationCity"),
    destinationState: read("destinationState"),
    destinationPostalCode: read("destinationPostalCode"),
    destinationCountry: read("destinationCountry") || "US",
    destinationLatitude: read("destinationLatitude"),
    destinationLongitude: read("destinationLongitude"),
    paymentStatus: read("paymentStatus"),
    packageType: read("packageType"),
    pieceCount: read("pieceCount"),
    weightKg: read("weightKg"),
    lengthCm: read("lengthCm"),
    widthCm: read("widthCm"),
    heightCm: read("heightCm"),
    estimatedDeliveryDate: read("estimatedDeliveryDate"),
    estimatedDeliveryWindow: read("estimatedDeliveryWindow"),
    internalNotes: read("internalNotes"),
  });
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function toRow(input: z.infer<typeof shipmentSchema>) {
  return {
    service_level: input.serviceLevel,
    sender_name: input.senderName,
    sender_company: input.senderCompany,
    sender_email: input.senderEmail,
    sender_phone: input.senderPhone,
    origin_city: input.originCity,
    origin_state: input.originState,
    origin_postal_code: input.originPostalCode,
    origin_country: input.originCountry,
    origin_latitude: input.originLatitude,
    origin_longitude: input.originLongitude,
    recipient_name: input.recipientName,
    recipient_company: input.recipientCompany,
    recipient_email: input.recipientEmail,
    recipient_phone: input.recipientPhone,
    destination_address_line1: input.destinationAddressLine1,
    destination_address_line2: input.destinationAddressLine2,
    destination_city: input.destinationCity,
    destination_state: input.destinationState,
    destination_postal_code: input.destinationPostalCode,
    destination_country: input.destinationCountry,
    destination_latitude: input.destinationLatitude,
    destination_longitude: input.destinationLongitude,
    // Deliberately not written here: recipient_contact_email and
    // recipient_email_submitted_at. Those record what the recipient did, and
    // only submit_recipient_email() writes them.
    payment_status: input.paymentStatus,
    package_type: input.packageType,
    piece_count: input.pieceCount,
    weight_kg: input.weightKg,
    length_cm: input.lengthCm,
    width_cm: input.widthCm,
    height_cm: input.heightCm,
    estimated_delivery_date: input.estimatedDeliveryDate,
    estimated_delivery_window: input.estimatedDeliveryWindow,
    internal_notes: input.internalNotes,
  };
}

function permissionState(): ActionState {
  return {
    status: "error",
    message: "Your account has read-only access to this area.",
    fieldErrors: {},
  };
}

/**
 * Creates a shipment.
 *
 * The tracking ID is generated here rather than left to the column default,
 * because the default cannot see the row's destination country and every ID
 * carries that country as its suffix. Uniqueness is still enforced by the unique
 * constraint, and a collision is retried once.
 */
export async function createShipmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let profile;
  try {
    profile = await requireWriteAccess();
  } catch (error) {
    if (error instanceof PermissionDeniedError) return permissionState();
    throw error;
  }

  const parsed = readShipmentForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const row = toRow(parsed.data);

  let createdId: string | null = null;

  for (let attempt = 0; attempt < 2 && !createdId; attempt += 1) {
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        ...row,
        tracking_id: generateTrackingId(parsed.data.destinationCountry),
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      createdId = data.id;
      break;
    }

    // 23505 is a unique violation, which here means a tracking ID collision.
    // Anything else is a real failure and should surface.
    if (error && error.code !== "23505") {
      console.error("Create shipment failed", { code: error.code });
      return {
        status: "error",
        message: "We could not create that shipment. Please try again.",
        fieldErrors: {},
      };
    }
  }

  if (!createdId) {
    return {
      status: "error",
      message: "Could not allocate a unique tracking ID. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  redirect(`/admin/shipments/${createdId}?created=1`);
}

export async function updateShipmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireWriteAccess();
  } catch (error) {
    if (error instanceof PermissionDeniedError) return permissionState();
    throw error;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing shipment reference.", fieldErrors: {} };

  const parsed = readShipmentForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  // Tracking ID is deliberately not updatable: it is already printed on a label
  // and shared with the customer.
  const { error } = await supabase.from("shipments").update(toRow(parsed.data)).eq("id", id);

  if (error) {
    console.error("Update shipment failed", { code: error.code });
    return {
      status: "error",
      message: "We could not save those changes. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${id}`);
  redirect(`/admin/shipments/${id}?saved=1`);
}

const eventSchema = z.object({
  shipmentId: z.string().uuid(),
  status: z.enum(SHIPMENT_STATUSES),
  title: z.string().trim().min(1, "Give the event a title.").max(160),
  description: optionalText,
  facilityLabel: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  occurredAt: z.string().trim().min(1, "Set when this happened."),
  isPublic: z.boolean(),
});

/**
 * Adds a tracking event.
 *
 * This is also how a status change is recorded: the shipment's status,
 * current location and delivery timestamps are derived from its events by a
 * database trigger, so the header and the timeline can never disagree.
 */
export async function addEventAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let profile;
  try {
    profile = await requireWriteAccess();
  } catch (error) {
    if (error instanceof PermissionDeniedError) return permissionState();
    throw error;
  }

  const parsed = eventSchema.safeParse({
    shipmentId: String(formData.get("shipmentId") ?? ""),
    status: String(formData.get("status") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    facilityLabel: String(formData.get("facilityLabel") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    country: String(formData.get("country") ?? ""),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    // An unchecked checkbox submits no value at all, so presence is the test.
    isPublic: formData.getAll("isPublic").includes("true"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // datetime-local has no timezone. It is entered in the operations timezone,
  // so it is interpreted as Gulf Standard Time rather than the server's zone.
  const occurredAt = new Date(`${parsed.data.occurredAt}:00+04:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return {
      status: "error",
      message: "That date and time could not be read.",
      fieldErrors: { occurredAt: "Use the date and time picker." },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shipment_events").insert({
    shipment_id: parsed.data.shipmentId,
    status: parsed.data.status,
    title: parsed.data.title,
    description: parsed.data.description,
    facility_label: parsed.data.facilityLabel,
    city: parsed.data.city,
    state: parsed.data.state,
    country: parsed.data.country?.toUpperCase() ?? null,
    occurred_at: occurredAt.toISOString(),
    is_public: parsed.data.isPublic,
    created_by: profile.id,
  });

  if (error) {
    console.error("Add event failed", { code: error.code });
    return {
      status: "error",
      message: "We could not add that event. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${parsed.data.shipmentId}`);
  return OK;
}

/** Archive is a soft delete: the record and its history survive for audit. */
export async function setArchivedAction(formData: FormData): Promise<void> {
  await requireWriteAccess();

  const id = String(formData.get("id") ?? "");
  const archive = String(formData.get("archive") ?? "true") === "true";
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shipments")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    console.error("Archive toggle failed", { code: error.code });
    throw new Error("Could not change the archive state of this shipment.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${id}`);
  redirect(`/admin/shipments/${id}?${archive ? "archived=1" : "restored=1"}`);
}
