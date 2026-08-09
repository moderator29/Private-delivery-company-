/**
 * The public shipment view model.
 *
 * public.track_shipment() returns JSON. This module is the boundary where that
 * untyped payload becomes a typed value: it validates the shape, so a schema
 * change surfaces as a parse failure rather than an undefined rendering halfway
 * down the tracking page. Every derived value the page shows is computed here
 * rather than in a component, which keeps the derivation unit testable.
 */

import { z } from "zod";

import { countryName, countryShortName } from "@/lib/countries";
import {
  parsePaymentMethod,
  parsePaymentStatus,
  type Invoice,
  type InvoiceLineItem,
  type PaymentMethod,
  type PaymentStatus,
} from "./payment";
import {
  SHIPMENT_STATUSES,
  type ShipmentStatus,
  buildProgressSteps,
  isMoving,
  journeyProgress,
  type ProgressStep,
} from "./status";

export const SERVICE_LEVELS = ["standard", "express", "priority", "same_day", "freight"] as const;
export type ServiceLevel = (typeof SERVICE_LEVELS)[number];

export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  standard: "Standard Delivery",
  express: "Express Delivery",
  priority: "Priority Delivery",
  same_day: "Same Day Delivery",
  freight: "Freight",
};

/** Accepts a Postgres numeric, which arrives as either a number or a string. */
const numericLike = z
  .union([z.number(), z.string()])
  .nullable()
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const nullableText = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const placeSchema = z.object({
  city: nullableText,
  state: nullableText,
  country: nullableText,
  latitude: numericLike,
  longitude: numericLike,
});

const eventSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  title: z.string(),
  description: nullableText,
  facility_label: nullableText,
  city: nullableText,
  state: nullableText,
  country: nullableText,
  latitude: numericLike,
  longitude: numericLike,
  occurred_at: z.string(),
});

/** Exactly the field set public.track_shipment() returns. */
export const trackShipmentPayloadSchema = z.object({
  tracking_id: z.string(),
  status: z.enum(SHIPMENT_STATUSES),
  service_level: z.enum(SERVICE_LEVELS),
  sender: z.object({
    name: nullableText,
    company: nullableText,
    city: nullableText,
    state: nullableText,
    country: nullableText,
  }),
  recipient: z.object({
    name: nullableText,
    company: nullableText,
    address_line1: nullableText,
    address_line2: nullableText,
    city: nullableText,
    state: nullableText,
    postal_code: nullableText,
    country: nullableText,
  }),
  origin: placeSchema,
  destination: placeSchema,
  current_location_label: nullableText,
  estimated_delivery_date: nullableText,
  estimated_delivery_window: nullableText,
  /**
   * Optional so a payload from a database that predates migration 0014 still
   * parses. Absent means no arrival instant is committed, so no countdown.
   */
  estimated_delivery_at: nullableText,
  shipped_at: nullableText,
  delivered_at: nullableText,
  package: z.object({
    package_type: nullableText,
    piece_count: z.number().nullable().optional().transform((v) => v ?? null),
    weight_kg: numericLike,
    length_cm: numericLike,
    width_cm: numericLike,
    height_cm: numericLike,
  }),
  /**
   * Optional so a payload from a database that predates migration 0011 still
   * parses. An absent or unrecognised value means the shipment is not in the
   * recipient payment flow.
   */
  payment_status: z.unknown().optional(),
  recipient_email_submitted_at: nullableText,
  /**
   * Invoice and pay-to details, all optional so a payload from a database that
   * predates migration 0012 still parses. Absent means the shipment carries no
   * invoice, which is the normal case.
   */
  payment_method: z.unknown().optional(),
  payment_wallet_address: nullableText,
  payment_currency: nullableText,
  total_amount_due: numericLike,
  payment_confirmation_at: nullableText,
  /**
   * When payment was confirmed received. Optional so a payload from a database
   * that predates migration 0015 still parses.
   */
  payment_received_at: nullableText,
  invoice_items: z
    .array(
      z.object({
        description: z.string(),
        amount: numericLike,
      }),
    )
    .optional()
    .default([]),
  created_at: z.string(),
  updated_at: z.string(),
  events: z.array(eventSchema),
});

export type TrackShipmentPayload = z.infer<typeof trackShipmentPayloadSchema>;

export interface Place {
  city: string | null;
  state: string | null;
  countryCode: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  /** "Dubai, United Arab Emirates" or the best available subset. */
  label: string;
  /** "Dubai, UAE", for compact contexts such as timeline rows. */
  shortLabel: string;
}

export interface PartyDetails {
  name: string | null;
  company: string | null;
  /** Address lines in display order. Empty when nothing is on file. */
  addressLines: string[];
  countryCode: string | null;
  countryName: string | null;
}

export interface TrackedEvent {
  status: ShipmentStatus;
  title: string;
  description: string | null;
  /** Facility name when known, otherwise city and country. */
  locationLabel: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
}

export interface PackageDetails {
  packageType: string | null;
  pieceCount: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  /** "30 x 22 x 4 cm" when all three dimensions are known. */
  dimensionsLabel: string | null;
}

export interface TrackedShipment {
  trackingId: string;
  status: ShipmentStatus;
  serviceLevel: ServiceLevel;
  serviceLevelLabel: string;
  sender: PartyDetails;
  recipient: PartyDetails;
  origin: Place;
  destination: Place;
  /** Latest operational scan location. Not a live GPS position. */
  currentLocationLabel: string | null;
  estimatedDeliveryDate: string | null;
  estimatedDeliveryWindow: string | null;
  /** Exact expected arrival, when one is committed. Drives the countdown. */
  estimatedDeliveryAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  package: PackageDetails;
  /** Null when the shipment is outside the recipient payment flow, which is the norm. */
  paymentStatus: PaymentStatus | null;
  /** When the recipient submitted their address, if they have. */
  recipientEmailSubmittedAt: string | null;
  /** The itemised invoice, or null when the shipment carries no invoice. */
  invoice: Invoice | null;
  /** How the recipient is asked to pay, when an invoice is present. */
  paymentMethod: PaymentMethod | null;
  /** The wallet address to pay to, when configured. */
  paymentWalletAddress: string | null;
  /** When the recipient reported sending payment, if they have. A claim, not a receipt. */
  paymentConfirmationAt: string | null;
  /** When payment was confirmed received. The fact behind the receipt. */
  paymentReceivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: TrackedEvent[];
  /** Newest event, or null when no scan has been recorded yet. */
  latestEvent: TrackedEvent | null;
  progress: ProgressStep[];
  /** 0 to 1 position along the normal path, for the route visual. */
  journeyFraction: number;
  /** Gates the animated route marker. */
  isMoving: boolean;
  /**
   * Whole days from pickup to delivery. Actual once delivered, otherwise
   * planned against the estimated delivery date. Null until pickup happens.
   */
  transitDays: number | null;
  transitIsEstimate: boolean;
}

function joinNonEmpty(parts: Array<string | null | undefined>, separator = ", "): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}

function toPlace(input: z.infer<typeof placeSchema>): Place {
  const code = input.country?.trim().toUpperCase() ?? null;
  const full = countryName(code);
  const short = countryShortName(code);

  const label = joinNonEmpty([input.city, input.state, full]) || "Not available";
  const shortLabel = joinNonEmpty([input.city, short]) || label;

  return {
    city: input.city,
    state: input.state,
    countryCode: code,
    countryName: full,
    latitude: input.latitude,
    longitude: input.longitude,
    label,
    shortLabel,
  };
}

function toSender(input: TrackShipmentPayload["sender"]): PartyDetails {
  const code = input.country?.trim().toUpperCase() ?? null;
  const line = joinNonEmpty([input.city, input.state, countryName(code)]);
  return {
    name: input.name,
    company: input.company,
    addressLines: line ? [line] : [],
    countryCode: code,
    countryName: countryName(code),
  };
}

function toRecipient(input: TrackShipmentPayload["recipient"]): PartyDetails {
  const code = input.country?.trim().toUpperCase() ?? null;
  const cityLine = joinNonEmpty([
    input.city,
    joinNonEmpty([input.state, input.postal_code], " "),
  ]);

  const lines = [input.address_line1, input.address_line2, cityLine, countryName(code)]
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line));

  return {
    name: input.name,
    company: input.company,
    addressLines: lines,
    countryCode: code,
    countryName: countryName(code),
  };
}

function toEventLocationLabel(event: z.infer<typeof eventSchema>): string | null {
  const facility = event.facility_label?.trim();
  if (facility) return facility;
  const label = joinNonEmpty([event.city, event.state, countryShortName(event.country)]);
  return label || null;
}

function toDimensionsLabel(
  length: number | null,
  width: number | null,
  height: number | null,
): string | null {
  if (length === null || width === null || height === null) return null;
  const format = (value: number) => String(Number(value.toFixed(2)));
  return `${format(length)} x ${format(width)} x ${format(height)} cm`;
}

/** Whole days between two instants, or null when either is unusable. */
function wholeDaysBetween(from: string, to: string): number | null {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86_400_000);
}

/** A date-only value compared against an instant, both in the display zone. */
function daysUntilCalendarDate(from: string, calendarDate: string): number | null {
  const start = Date.parse(from);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate.trim());
  if (Number.isNaN(start) || !match) return null;

  const [, year, month, day] = match;
  const end = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const startDay = Date.UTC(
    new Date(start).getUTCFullYear(),
    new Date(start).getUTCMonth(),
    new Date(start).getUTCDate(),
  );

  if (end < startDay) return null;
  return Math.round((end - startDay) / 86_400_000);
}

/**
 * Assembles the invoice from the payload, or null when there is nothing to bill.
 *
 * An invoice exists when there is an amount owed or at least one line item. The
 * total comes from the record's total_amount_due; it is not recomputed from the
 * items, so the figure the page shows is the figure operations set. When only a
 * total is on record and no line items, the total stands alone as one line.
 */
function toInvoice(payload: TrackShipmentPayload): Invoice | null {
  const items: InvoiceLineItem[] = (payload.invoice_items ?? [])
    .map((item) => ({
      description: item.description.trim(),
      amount: item.amount ?? 0,
    }))
    .filter((item) => item.description.length > 0);

  const total = payload.total_amount_due;
  const hasInvoice = items.length > 0 || (total !== null && total !== undefined);
  if (!hasInvoice) return null;

  const currency = (payload.payment_currency ?? "USD").trim().toUpperCase() || "USD";
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    currency,
    items,
    total: total ?? itemsTotal,
  };
}

export function toTrackedShipment(payload: TrackShipmentPayload): TrackedShipment {
  const events: TrackedEvent[] = payload.events.map((event) => ({
    status: event.status,
    title: event.title,
    description: event.description,
    locationLabel: toEventLocationLabel(event),
    city: event.city,
    state: event.state,
    latitude: event.latitude,
    longitude: event.longitude,
    occurredAt: event.occurred_at,
  }));

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const destination = toPlace(payload.destination);

  let transitDays: number | null = null;
  let transitIsEstimate = false;

  if (payload.shipped_at && payload.delivered_at) {
    transitDays = wholeDaysBetween(payload.shipped_at, payload.delivered_at);
  } else if (payload.shipped_at && payload.estimated_delivery_date) {
    transitDays = daysUntilCalendarDate(payload.shipped_at, payload.estimated_delivery_date);
    transitIsEstimate = true;
  }

  return {
    trackingId: payload.tracking_id,
    status: payload.status,
    serviceLevel: payload.service_level,
    serviceLevelLabel: SERVICE_LEVEL_LABELS[payload.service_level],
    sender: toSender(payload.sender),
    recipient: toRecipient(payload.recipient),
    origin: toPlace(payload.origin),
    destination,
    currentLocationLabel: payload.current_location_label,
    estimatedDeliveryDate: payload.estimated_delivery_date,
    estimatedDeliveryWindow: payload.estimated_delivery_window,
    estimatedDeliveryAt: payload.estimated_delivery_at,
    shippedAt: payload.shipped_at,
    deliveredAt: payload.delivered_at,
    package: {
      packageType: payload.package.package_type,
      pieceCount: payload.package.piece_count,
      weightKg: payload.package.weight_kg,
      lengthCm: payload.package.length_cm,
      widthCm: payload.package.width_cm,
      heightCm: payload.package.height_cm,
      dimensionsLabel: toDimensionsLabel(
        payload.package.length_cm,
        payload.package.width_cm,
        payload.package.height_cm,
      ),
    },
    paymentStatus: parsePaymentStatus(payload.payment_status),
    recipientEmailSubmittedAt: payload.recipient_email_submitted_at,
    invoice: toInvoice(payload),
    paymentMethod: parsePaymentMethod(payload.payment_method),
    paymentWalletAddress: payload.payment_wallet_address,
    paymentConfirmationAt: payload.payment_confirmation_at,
    paymentReceivedAt: payload.payment_received_at,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    events,
    latestEvent,
    progress: buildProgressSteps(
      events.map((event) => ({
        status: event.status,
        title: event.title,
        description: event.description,
        occurredAt: event.occurredAt,
        locationLabel: event.locationLabel,
      })),
      payload.status,
      destination.shortLabel,
    ),
    journeyFraction: journeyProgress(payload.status),
    isMoving: isMoving(payload.status),
    transitDays,
    transitIsEstimate,
  };
}

/**
 * Parses a raw public.track_shipment() result. Returns null for a miss so the
 * caller cannot distinguish "unknown ID" from "malformed ID", which is what
 * keeps the not-found page from leaking database state.
 */
export function parseTrackedShipment(raw: unknown): TrackedShipment | null {
  if (raw === null || raw === undefined) return null;
  const parsed = trackShipmentPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  return toTrackedShipment(parsed.data);
}
