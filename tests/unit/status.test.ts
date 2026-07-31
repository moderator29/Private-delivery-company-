import { describe, expect, it } from "vitest";

import {
  JOURNEY_MILESTONES,
  SHIPMENT_STATUSES,
  STATUS_META,
  buildProgressSteps,
  isClosed,
  isDelivered,
  isMoving,
  isShipmentStatus,
  journeyProgress,
  needsAttention,
  type ProgressEventInput,
  type ShipmentStatus,
} from "@/lib/tracking/status";

/** Convenience builder so a case only states the fields it cares about. */
function event(
  overrides: Partial<ProgressEventInput> & { status: ShipmentStatus },
): ProgressEventInput {
  return {
    title: STATUS_META[overrides.status].label,
    description: null,
    occurredAt: "2026-08-01T06:45:00Z",
    locationLabel: "Dubai, UAE",
    ...overrides,
  };
}

describe("isShipmentStatus", () => {
  it("accepts every status in the enum and nothing else", () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(isShipmentStatus(status)).toBe(true);
    }
    expect(isShipmentStatus("in-transit")).toBe(false);
    expect(isShipmentStatus("")).toBe(false);
    expect(isShipmentStatus(null)).toBe(false);
    expect(isShipmentStatus(3)).toBe(false);
  });
});

describe("journeyProgress", () => {
  it("spaces the normal path milestones evenly from 0 to 1", () => {
    expect(journeyProgress("label_created")).toBeCloseTo(0);
    expect(journeyProgress("picked_up")).toBeCloseTo(0.2);
    expect(journeyProgress("in_transit")).toBeCloseTo(0.4);
    expect(journeyProgress("arrived_at_facility")).toBeCloseTo(0.6);
    expect(journeyProgress("out_for_delivery")).toBeCloseTo(0.8);
    expect(journeyProgress("delivered")).toBeCloseTo(1);
  });

  it("starts a newly created shipment at zero", () => {
    expect(journeyProgress("created")).toBe(0);
  });

  it("places a failed delivery attempt where out for delivery sits", () => {
    // The package reached the destination city, just not the door, so it must
    // not slide backwards on the route visual.
    expect(journeyProgress("delivery_attempted")).toBe(
      journeyProgress("out_for_delivery"),
    );
  });

  it("parks off-path statuses at the midpoint rather than implying progress", () => {
    expect(journeyProgress("delayed")).toBe(0.5);
    expect(journeyProgress("exception")).toBe(0.5);
    expect(journeyProgress("returned")).toBe(0.5);
    expect(journeyProgress("cancelled")).toBe(0.5);
  });

  it("stays inside 0 to 1 for every status", () => {
    for (const status of SHIPMENT_STATUSES) {
      const fraction = journeyProgress(status);
      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThanOrEqual(1);
    }
  });
});

describe("status predicates", () => {
  it("treats only picked up, in transit and out for delivery as moving", () => {
    expect(isMoving("picked_up")).toBe(true);
    expect(isMoving("in_transit")).toBe(true);
    expect(isMoving("out_for_delivery")).toBe(true);

    // The animated route marker is gated on this, so none of these may animate.
    expect(isMoving("created")).toBe(false);
    expect(isMoving("label_created")).toBe(false);
    expect(isMoving("arrived_at_facility")).toBe(false);
    expect(isMoving("delivered")).toBe(false);
    expect(isMoving("delayed")).toBe(false);
    expect(isMoving("delivery_attempted")).toBe(false);
  });

  it("treats delivered, returned and cancelled as closed", () => {
    expect(isClosed("delivered")).toBe(true);
    expect(isClosed("returned")).toBe(true);
    expect(isClosed("cancelled")).toBe(true);
    expect(isClosed("in_transit")).toBe(false);
    expect(isClosed("delayed")).toBe(false);
  });

  it("flags the three statuses a customer may need to act on", () => {
    expect(needsAttention("delivery_attempted")).toBe(true);
    expect(needsAttention("delayed")).toBe(true);
    expect(needsAttention("exception")).toBe(true);
    expect(needsAttention("in_transit")).toBe(false);
    expect(needsAttention("delivered")).toBe(false);
    // Returned and cancelled are stopped, not something to chase.
    expect(needsAttention("returned")).toBe(false);
    expect(needsAttention("cancelled")).toBe(false);
  });

  it("identifies delivery only for the delivered status", () => {
    expect(isDelivered("delivered")).toBe(true);
    expect(isDelivered("delivery_attempted")).toBe(false);
  });

  it("never reports a status as both moving and closed", () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(isMoving(status) && isClosed(status)).toBe(false);
    }
  });

  it("gives every status a customer facing label and description", () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(STATUS_META[status].label.length).toBeGreaterThan(0);
      expect(STATUS_META[status].description.length).toBeGreaterThan(0);
    }
  });
});

describe("buildProgressSteps", () => {
  const dubaiEvents: ProgressEventInput[] = [
    event({
      status: "label_created",
      title: "Shipment Information Received",
      description: "Shipment details received and the waybill was created.",
      occurredAt: "2026-07-30T04:30:00Z",
    }),
    event({
      status: "picked_up",
      title: "Picked Up",
      occurredAt: "2026-07-31T07:15:00Z",
    }),
    event({
      status: "in_transit",
      title: "Departed Origin Facility",
      occurredAt: "2026-08-01T05:40:00Z",
    }),
    event({
      status: "in_transit",
      title: "In Transit",
      occurredAt: "2026-08-01T06:45:00Z",
    }),
  ];

  it("lists observed events first, in the order given", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    expect(steps.slice(0, 4).map((step) => step.label)).toEqual([
      "Shipment Information Received",
      "Picked Up",
      "Departed Origin Facility",
      "In Transit",
    ]);
    expect(steps.slice(0, 4).every((step) => step.projected)).toBe(false);
  });

  it("marks the newest observed event current and the earlier ones complete", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    expect(steps.slice(0, 3).map((step) => step.state)).toEqual([
      "complete",
      "complete",
      "complete",
    ]);
    expect(steps[3].state).toBe("current");
    expect(steps.filter((step) => step.state === "current")).toHaveLength(1);
  });

  it("carries the scan detail through to observed steps", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    expect(steps[0]).toMatchObject({
      occurredAt: "2026-07-30T04:30:00Z",
      locationLabel: "Dubai, UAE",
      description: "Shipment details received and the waybill was created.",
      projected: false,
      status: "label_created",
    });
  });

  it("appends the remaining milestones as projected steps with no timestamp", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    const projected = steps.filter((step) => step.projected);

    expect(projected.map((step) => step.status)).toEqual([
      "arrived_at_facility",
      "out_for_delivery",
      "delivered",
    ]);
    for (const step of projected) {
      // A projection presented as a scan would be a claim about where the
      // package is, so it must carry no time and stay flagged.
      expect(step.occurredAt).toBeNull();
      expect(step.projected).toBe(true);
      expect(step.state).toBe("upcoming");
      expect(step.description).toBeNull();
    }
  });

  it("labels projected steps with the destination, since that is where they happen", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    for (const step of steps.filter((s) => s.projected)) {
      expect(step.locationLabel).toBe("Miami, USA");
    }
  });

  it("leaves the projected location empty when no destination label is given", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit");
    expect(
      steps.filter((s) => s.projected).every((s) => s.locationLabel === null),
    ).toBe(true);
  });

  it("uses the milestone wording rather than the last event title for projections", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    expect(steps.filter((s) => s.projected).map((s) => s.label)).toEqual([
      "Arrived at Destination Country",
      "Out for Delivery",
      "Delivered",
    ]);
  });

  it("gives every step a unique key", () => {
    const steps = buildProgressSteps(dubaiEvents, "in_transit", "Miami, USA");
    expect(new Set(steps.map((step) => step.key)).size).toBe(steps.length);
  });

  it("projects the whole journey when nothing has been scanned yet", () => {
    const steps = buildProgressSteps([], "created", "Miami, USA");
    expect(steps).toHaveLength(JOURNEY_MILESTONES.length);
    expect(steps.every((step) => step.projected)).toBe(true);
    // With no observed scan there is nothing to call "current".
    expect(steps.some((step) => step.state === "current")).toBe(false);
  });

  it("stops projecting once the shipment is delivered", () => {
    const events = [
      ...dubaiEvents,
      event({ status: "delivered", title: "Delivered" }),
    ];
    const steps = buildProgressSteps(events, "delivered", "Miami, USA");
    expect(steps).toHaveLength(events.length);
    expect(steps.some((step) => step.projected)).toBe(false);
    expect(steps[steps.length - 1].state).toBe("current");
  });

  it("stops projecting once the shipment is returned or cancelled", () => {
    // Nothing further is expected, so offering "Out for Delivery" would be a lie.
    const returned = buildProgressSteps(
      [
        ...dubaiEvents,
        event({ status: "returned", title: "Returned to sender" }),
      ],
      "returned",
      "Miami, USA",
    );
    expect(returned.some((step) => step.projected)).toBe(false);

    const cancelled = buildProgressSteps(
      dubaiEvents,
      "cancelled",
      "Miami, USA",
    );
    expect(cancelled.some((step) => step.projected)).toBe(false);
  });

  it("keeps projecting through an off-path status such as delayed", () => {
    const steps = buildProgressSteps(dubaiEvents, "delayed", "Miami, USA");
    // "delayed" is not a milestone, so projection resumes after the furthest
    // milestone the real events reached.
    expect(steps.filter((s) => s.projected).map((s) => s.status)).toEqual([
      "arrived_at_facility",
      "out_for_delivery",
      "delivered",
    ]);
  });

  it("does not resurrect a completed milestone from an out-of-order event", () => {
    // A late backfilled pickup scan arriving after the in-transit scans must not
    // pull the projection back to "In Transit"; the reduce keeps the furthest
    // milestone reached by any event.
    const backfilled = [
      ...dubaiEvents,
      event({ status: "picked_up", title: "Picked Up (backfilled)" }),
    ];
    const steps = buildProgressSteps(backfilled, "picked_up", "Miami, USA");

    expect(steps.filter((s) => s.projected).map((s) => s.status)).toEqual([
      "arrived_at_facility",
      "out_for_delivery",
      "delivered",
    ]);
    expect(steps.some((s) => s.projected && s.status === "picked_up")).toBe(
      false,
    );
    expect(steps.some((s) => s.projected && s.status === "in_transit")).toBe(
      false,
    );
  });

  it("projects from the current status when it is ahead of every event", () => {
    // The rollup can move the shipment forward before the matching scan lands.
    const steps = buildProgressSteps(
      dubaiEvents,
      "out_for_delivery",
      "Miami, USA",
    );
    expect(steps.filter((s) => s.projected).map((s) => s.status)).toEqual([
      "delivered",
    ]);
  });

  it("never projects an off-path status", () => {
    const steps = buildProgressSteps(dubaiEvents, "exception", "Miami, USA");
    const projectedStatuses = steps
      .filter((s) => s.projected)
      .map((s) => s.status);
    for (const status of [
      "delayed",
      "exception",
      "delivery_attempted",
      "returned",
      "cancelled",
    ]) {
      expect(projectedStatuses).not.toContain(status);
    }
  });
});

/**
 * The hold state. It exists because neither "delayed" nor "exception" could say
 * the thing a customer actually needs to hear: the package is stopped on
 * purpose, nothing is wrong with it, and it will resume.
 */
describe("awaiting_verification", () => {
  it("raises attention without claiming the package is moving", () => {
    expect(needsAttention("awaiting_verification")).toBe(true);
    // The route marker animates on isMoving. A held package must sit still.
    expect(isMoving("awaiting_verification")).toBe(false);
  });

  it("is a hold, not an ending, so the rest of the journey still projects", () => {
    expect(isClosed("awaiting_verification")).toBe(false);

    const steps = buildProgressSteps(
      [
        {
          status: "awaiting_verification",
          title: "Held for Verification",
          description: null,
          occurredAt: "2026-07-30T17:10:00Z",
          locationLabel: "Dubai",
        },
      ],
      "awaiting_verification",
      "Miami, USA",
    );

    expect(steps.some((step) => step.projected)).toBe(true);
    expect(steps.at(-1)?.status).toBe("delivered");
  });

  it("does not imply progress along the normal path", () => {
    expect(journeyProgress("awaiting_verification")).toBe(0.5);
  });

  it("tells the customer it is stopped rather than late", () => {
    expect(STATUS_META.awaiting_verification.label).toBe(
      "Awaiting Verification",
    );
    expect(STATUS_META.awaiting_verification.description).toContain(
      "not moving",
    );
  });
});
