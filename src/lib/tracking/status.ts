/**
 * Shipment status vocabulary and the derived progress model.
 *
 * The status list mirrors the public.shipment_status enum exactly. STATUS_ORDER
 * is the single source of truth for both, so adding a status in one place
 * surfaces a type error everywhere it needs handling.
 */

export const SHIPMENT_STATUSES = [
  "created",
  "label_created",
  "picked_up",
  "in_transit",
  "arrived_at_facility",
  "out_for_delivery",
  "delivered",
  "delivery_attempted",
  "delayed",
  "exception",
  "returned",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export function isShipmentStatus(value: unknown): value is ShipmentStatus {
  return typeof value === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

export type StatusTone = "neutral" | "moving" | "delivered" | "attention" | "stopped";

export interface StatusMeta {
  /** Customer facing label. Sentence case, no invented jargon. */
  label: string;
  /** One short line a customer can act on. */
  description: string;
  tone: StatusTone;
}

export const STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  created: {
    label: "Shipment Created",
    description: "We have the shipment details and are preparing the label.",
    tone: "neutral",
  },
  label_created: {
    label: "Label Created",
    description: "The label is ready and pickup is scheduled.",
    tone: "neutral",
  },
  picked_up: {
    label: "Picked Up",
    description: "A SwiftTrack courier has collected your package.",
    tone: "moving",
  },
  in_transit: {
    label: "In Transit",
    description: "Your package is on its way.",
    tone: "moving",
  },
  arrived_at_facility: {
    label: "Arrived at Destination Country",
    description: "The package has cleared into the destination country.",
    tone: "moving",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description: "Your package is with a courier for delivery today.",
    tone: "moving",
  },
  delivered: {
    label: "Delivered",
    description: "Your package has been delivered.",
    tone: "delivered",
  },
  delivery_attempted: {
    label: "Delivery Attempted",
    description: "We tried to deliver and will attempt again.",
    tone: "attention",
  },
  delayed: {
    label: "Delayed",
    description: "The package is running behind its original estimate.",
    tone: "attention",
  },
  exception: {
    label: "Exception",
    description: "Something needs attention before delivery can continue.",
    tone: "attention",
  },
  returned: {
    label: "Returned to Sender",
    description: "The package is on its way back to the sender.",
    tone: "stopped",
  },
  cancelled: {
    label: "Cancelled",
    description: "This shipment was cancelled and will not be delivered.",
    tone: "stopped",
  },
};

/** Statuses where nothing further will happen without operator action. */
const CLOSED_STATUSES = new Set<ShipmentStatus>(["delivered", "returned", "cancelled"]);

/** Statuses that mean the package is physically moving right now. */
const MOVING_STATUSES = new Set<ShipmentStatus>(["picked_up", "in_transit", "out_for_delivery"]);

const ATTENTION_STATUSES = new Set<ShipmentStatus>([
  "delivery_attempted",
  "delayed",
  "exception",
]);

export function isClosed(status: ShipmentStatus): boolean {
  return CLOSED_STATUSES.has(status);
}

/**
 * True only when the package is actually moving. The animated route indicator
 * is gated on this, so a delayed or delivered shipment never animates as though
 * it were in motion.
 */
export function isMoving(status: ShipmentStatus): boolean {
  return MOVING_STATUSES.has(status);
}

export function needsAttention(status: ShipmentStatus): boolean {
  return ATTENTION_STATUSES.has(status);
}

export function isDelivered(status: ShipmentStatus): boolean {
  return status === "delivered";
}

/**
 * The normal path a shipment takes. Used to project the milestones a customer
 * has not reached yet. Off-path statuses such as delayed or exception are
 * deliberately absent: they are shown from real events only, never projected.
 */
export const JOURNEY_MILESTONES = [
  { status: "label_created", label: "Shipment Information Received" },
  { status: "picked_up", label: "Picked Up" },
  { status: "in_transit", label: "In Transit" },
  { status: "arrived_at_facility", label: "Arrived at Destination Country" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
] as const satisfies ReadonlyArray<{ status: ShipmentStatus; label: string }>;

const MILESTONE_INDEX = new Map<ShipmentStatus, number>(
  JOURNEY_MILESTONES.map((milestone, index) => [milestone.status, index]),
);

/**
 * How far along the normal path a status sits, as a 0 to 1 fraction. Used to
 * place the marker on the route visual.
 *
 * Statuses that are not milestones inherit the progress of the last milestone
 * they imply, so a delayed shipment does not jump backwards on the route.
 */
export function journeyProgress(status: ShipmentStatus): number {
  const lastIndex = JOURNEY_MILESTONES.length - 1;

  const direct = MILESTONE_INDEX.get(status);
  if (direct !== undefined) return direct / lastIndex;

  switch (status) {
    case "created":
      return 0;
    case "delivery_attempted":
      // Reached the destination city but not the door.
      return (MILESTONE_INDEX.get("out_for_delivery") ?? lastIndex) / lastIndex;
    case "delayed":
    case "exception":
    case "returned":
    case "cancelled":
      // Position is unknown along the normal path, so sit at the midpoint
      // rather than implying progress that has not happened.
      return 0.5;
    default:
      return 0;
  }
}

export type ProgressState = "complete" | "current" | "upcoming";

export interface ProgressStep {
  key: string;
  label: string;
  state: ProgressState;
  status: ShipmentStatus;
  /** Present only for steps backed by a real scan event. */
  occurredAt: string | null;
  locationLabel: string | null;
  description: string | null;
  /** True when this step is projected rather than observed. */
  projected: boolean;
}

export interface ProgressEventInput {
  status: ShipmentStatus;
  title: string;
  description: string | null;
  occurredAt: string;
  locationLabel: string | null;
}

/**
 * Builds the "Shipment progress" list.
 *
 * Real events always come first, in order, marked complete, with the newest one
 * marked current. Remaining normal-path milestones are appended as projected
 * steps so a customer can see what is still to come. Projected steps carry no
 * timestamp and are flagged, because presenting an expectation as a scan would
 * be a lie about where the package is.
 *
 * Projection stops entirely once a shipment is delivered, returned or
 * cancelled: there is nothing left to expect.
 */
export function buildProgressSteps(
  events: readonly ProgressEventInput[],
  currentStatus: ShipmentStatus,
  /** Shown against projected steps, since they all happen at the destination. */
  destinationLabel: string | null = null,
): ProgressStep[] {
  const observed: ProgressStep[] = events.map((event, index) => ({
    key: `event-${index}`,
    label: event.title,
    state: index === events.length - 1 ? "current" : "complete",
    status: event.status,
    occurredAt: event.occurredAt,
    locationLabel: event.locationLabel,
    description: event.description,
    projected: false,
  }));

  if (isClosed(currentStatus)) return observed;

  // Only project past the furthest milestone any observed event has reached, so
  // an out-of-order backfilled event cannot resurrect a completed milestone.
  const reachedIndex = events.reduce((furthest, event) => {
    const index = MILESTONE_INDEX.get(event.status);
    return index === undefined ? furthest : Math.max(furthest, index);
  }, MILESTONE_INDEX.get(currentStatus) ?? -1);

  const projected: ProgressStep[] = JOURNEY_MILESTONES.slice(reachedIndex + 1).map(
    (milestone) => ({
      key: `expected-${milestone.status}`,
      label: milestone.label,
      state: "upcoming" as const,
      status: milestone.status,
      occurredAt: null,
      locationLabel: destinationLabel,
      description: null,
      projected: true,
    }),
  );

  return [...observed, ...projected];
}
