import { describe, expect, it } from "vitest";

import { parseTrackedShipment } from "@/lib/tracking/shipment";

/**
 * A realistic public.track_shipment() result for the Dubai to Miami shipment.
 *
 * Numerics are written as strings on purpose: that is how the Postgres numeric
 * type arrives over PostgREST, and parsing them is part of what this boundary
 * is for.
 */
function payload(overrides: Record<string, unknown> = {}) {
  return {
    tracking_id: "STX984756532US",
    status: "in_transit",
    service_level: "standard",
    sender: {
      name: "Andrew Goodson",
      company: null,
      city: "Dubai",
      state: null,
      country: "AE",
    },
    recipient: {
      name: "Rafael S Angarita",
      company: null,
      address_line1: "15440 SW 74th Circle Ct #604",
      address_line2: null,
      city: "Miami",
      state: "Florida",
      postal_code: "33193",
      country: "US",
    },
    origin: {
      city: "Dubai",
      state: null,
      country: "AE",
      latitude: "25.204800",
      longitude: "55.270800",
    },
    destination: {
      city: "Miami",
      state: "Florida",
      country: "US",
      latitude: "25.761700",
      longitude: "-80.191800",
    },
    current_location_label: "Dubai, UAE",
    estimated_delivery_date: "2026-08-06",
    estimated_delivery_window: "By 8:00 PM",
    shipped_at: "2026-07-31T07:15:00+00:00",
    delivered_at: null,
    package: {
      package_type: "Document",
      piece_count: 1,
      weight_kg: "0.05",
      length_cm: null,
      width_cm: null,
      height_cm: null,
    },
    created_at: "2026-07-30T04:30:00+00:00",
    updated_at: "2026-08-01T06:45:00+00:00",
    events: [
      {
        status: "label_created",
        title: "Shipment Information Received",
        description: "Shipment details received and the waybill was created.",
        facility_label: null,
        city: "Dubai",
        state: null,
        country: "AE",
        latitude: "25.204800",
        longitude: "55.270800",
        occurred_at: "2026-07-30T04:30:00+00:00",
      },
      {
        status: "picked_up",
        title: "Picked Up",
        description: "Collected from the sender by a SwiftTrack courier.",
        facility_label: null,
        city: "Dubai",
        state: null,
        country: "AE",
        latitude: "25.204800",
        longitude: "55.270800",
        occurred_at: "2026-07-31T07:15:00+00:00",
      },
      {
        status: "in_transit",
        title: "Departed Origin Facility",
        description:
          "Processed for export and released from the Dubai gateway.",
        facility_label: "Dubai Gateway",
        city: "Dubai",
        state: null,
        country: "AE",
        latitude: "25.204800",
        longitude: "55.270800",
        occurred_at: "2026-08-01T05:40:00+00:00",
      },
      {
        status: "in_transit",
        title: "In Transit",
        description:
          "Departed Dubai on the linehaul to the destination country.",
        facility_label: null,
        city: "Dubai",
        state: null,
        country: "AE",
        latitude: "25.204800",
        longitude: "55.270800",
        occurred_at: "2026-08-01T06:45:00+00:00",
      },
    ],
    ...overrides,
  };
}

describe("parseTrackedShipment", () => {
  it("returns null rather than throwing for a miss or a malformed payload", () => {
    // The caller must not be able to tell "unknown ID" from "bad payload",
    // which is what stops the not-found page confirming which IDs exist.
    expect(parseTrackedShipment(null)).toBeNull();
    expect(parseTrackedShipment(undefined)).toBeNull();
    expect(parseTrackedShipment({})).toBeNull();
    expect(parseTrackedShipment("STX984756532US")).toBeNull();
    expect(parseTrackedShipment([])).toBeNull();
  });

  it("rejects a payload with a status outside the enum", () => {
    expect(
      parseTrackedShipment(payload({ status: "lost_in_space" })),
    ).toBeNull();
  });

  it("rejects a payload missing a required section", () => {
    const broken = payload();
    delete (broken as Record<string, unknown>).destination;
    expect(parseTrackedShipment(broken)).toBeNull();
  });

  it("keeps the tracking ID, status and service level from the payload", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.trackingId).toBe("STX984756532US");
    expect(shipment.status).toBe("in_transit");
    expect(shipment.serviceLevel).toBe("standard");
    expect(shipment.serviceLevelLabel).toBe("Standard Delivery");
  });

  it("parses Postgres numerics that arrive as strings into numbers", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.origin.latitude).toBe(25.2048);
    expect(shipment.origin.longitude).toBe(55.2708);
    expect(shipment.destination.latitude).toBe(25.7617);
    expect(shipment.destination.longitude).toBe(-80.1918);
    expect(shipment.package.weightKg).toBe(0.05);
    expect(shipment.events[0].latitude).toBe(25.2048);
  });

  it("treats an unparseable or empty numeric as absent instead of NaN", () => {
    const shipment = parseTrackedShipment(
      payload({
        package: {
          package_type: "Document",
          piece_count: 1,
          weight_kg: "",
          length_cm: "n/a",
          width_cm: null,
          height_cm: null,
        },
      }),
    )!;
    expect(shipment.package.weightKg).toBeNull();
    expect(shipment.package.lengthCm).toBeNull();
  });

  it("builds full and short place labels", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.origin.label).toBe("Dubai, United Arab Emirates");
    expect(shipment.origin.shortLabel).toBe("Dubai, UAE");
    expect(shipment.destination.label).toBe("Miami, Florida, United States");
    expect(shipment.destination.shortLabel).toBe("Miami, USA");
  });

  it("falls back to a stated absence when a place has nothing on file", () => {
    const shipment = parseTrackedShipment(
      payload({
        origin: {
          city: null,
          state: null,
          country: null,
          latitude: null,
          longitude: null,
        },
      }),
    )!;
    expect(shipment.origin.label).toBe("Not available");
    expect(shipment.origin.shortLabel).toBe("Not available");
    expect(shipment.origin.countryName).toBeNull();
  });

  it("assembles the recipient address lines in display order", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.recipient.name).toBe("Rafael S Angarita");
    expect(shipment.recipient.addressLines).toEqual([
      "15440 SW 74th Circle Ct #604",
      "Miami, Florida 33193",
      "United States",
    ]);
    expect(shipment.recipient.countryCode).toBe("US");
  });

  it("includes a second address line only when there is one", () => {
    const shipment = parseTrackedShipment(
      payload({
        recipient: {
          name: "Rafael S Angarita",
          company: "Angarita Imports",
          address_line1: "15440 SW 74th Circle Ct",
          address_line2: "Suite 604",
          city: "Miami",
          state: "Florida",
          postal_code: "33193",
          country: "US",
        },
      }),
    )!;
    expect(shipment.recipient.company).toBe("Angarita Imports");
    expect(shipment.recipient.addressLines).toEqual([
      "15440 SW 74th Circle Ct",
      "Suite 604",
      "Miami, Florida 33193",
      "United States",
    ]);
  });

  it("reduces the sender to a single city line, since no street is published", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.sender.name).toBe("Andrew Goodson");
    expect(shipment.sender.addressLines).toEqual([
      "Dubai, United Arab Emirates",
    ]);
  });

  it("computes planned transit days from pickup to the estimated delivery date", () => {
    const shipment = parseTrackedShipment(payload())!;
    // Shipped 31 July, estimated 6 August: six whole days, still an estimate.
    expect(shipment.transitDays).toBe(6);
    expect(shipment.transitIsEstimate).toBe(true);
  });

  it("computes actual transit days from pickup to delivery once delivered", () => {
    const shipment = parseTrackedShipment(
      payload({
        status: "delivered",
        delivered_at: "2026-08-05T07:15:00+00:00",
      }),
    )!;
    expect(shipment.transitDays).toBe(5);
    expect(shipment.transitIsEstimate).toBe(false);
  });

  it("reports no transit time until the shipment has been picked up", () => {
    const shipment = parseTrackedShipment(payload({ shipped_at: null }))!;
    expect(shipment.transitDays).toBeNull();
    expect(shipment.transitIsEstimate).toBe(false);
  });

  it("labels dimensions only when all three are on file", () => {
    expect(parseTrackedShipment(payload())!.package.dimensionsLabel).toBeNull();

    const partial = parseTrackedShipment(
      payload({
        package: {
          package_type: "Box",
          piece_count: 1,
          weight_kg: "2",
          length_cm: "30",
          width_cm: "22",
          height_cm: null,
        },
      }),
    )!;
    expect(partial.package.dimensionsLabel).toBeNull();

    const complete = parseTrackedShipment(
      payload({
        package: {
          package_type: "Box",
          piece_count: 2,
          weight_kg: "2.00",
          length_cm: "30",
          width_cm: "22",
          height_cm: "4",
        },
      }),
    )!;
    expect(complete.package.dimensionsLabel).toBe("30 x 22 x 4 cm");
    expect(complete.package.pieceCount).toBe(2);
    expect(complete.package.weightKg).toBe(2);
  });

  it("maps every event and exposes the newest as the latest scan", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.events).toHaveLength(4);
    expect(shipment.latestEvent).toBe(shipment.events[3]);
    expect(shipment.latestEvent!.title).toBe("In Transit");
    expect(shipment.latestEvent!.occurredAt).toBe("2026-08-01T06:45:00+00:00");
  });

  it("has no latest scan when no event has been recorded", () => {
    const shipment = parseTrackedShipment(payload({ events: [] }))!;
    expect(shipment.events).toEqual([]);
    expect(shipment.latestEvent).toBeNull();
  });

  it("prefers a facility name over the city for an event location", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.events[0].locationLabel).toBe("Dubai, UAE");
    expect(shipment.events[2].locationLabel).toBe("Dubai Gateway");
  });

  it("derives the route position and motion flag from the status", () => {
    const inTransit = parseTrackedShipment(payload())!;
    expect(inTransit.isMoving).toBe(true);
    expect(inTransit.journeyFraction).toBeCloseTo(0.4);

    const delayed = parseTrackedShipment(payload({ status: "delayed" }))!;
    expect(delayed.isMoving).toBe(false);
    expect(delayed.journeyFraction).toBe(0.5);

    const delivered = parseTrackedShipment(
      payload({
        status: "delivered",
        delivered_at: "2026-08-05T07:15:00+00:00",
      }),
    )!;
    expect(delivered.isMoving).toBe(false);
    expect(delivered.journeyFraction).toBeCloseTo(1);
  });

  it("builds the progress list from the events plus the milestones still to come", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.progress.filter((step) => !step.projected)).toHaveLength(4);
    expect(
      shipment.progress
        .filter((step) => step.projected)
        .map((step) => step.status),
    ).toEqual(["arrived_at_facility", "out_for_delivery", "delivered"]);
    // Projected steps are labelled with the destination's short form.
    expect(shipment.progress.at(-1)!.locationLabel).toBe("Miami, USA");
  });

  it("carries the recipient payment state through to the view model", () => {
    const awaiting = parseTrackedShipment(
      payload({ payment_status: "awaiting_recipient_email" }),
    )!;
    expect(awaiting.paymentStatus).toBe("awaiting_recipient_email");
    expect(awaiting.recipientEmailSubmittedAt).toBeNull();

    const received = parseTrackedShipment(
      payload({
        payment_status: "email_received",
        recipient_email_submitted_at: "2026-08-02T09:00:00+00:00",
      }),
    )!;
    expect(received.paymentStatus).toBe("email_received");
    expect(received.recipientEmailSubmittedAt).toBe("2026-08-02T09:00:00+00:00");
  });

  it("reads a missing or unknown payment state as not being in the flow", () => {
    // A payload from a database that predates migration 0011 must still parse
    // rather than blanking the whole tracking page.
    expect(parseTrackedShipment(payload())!.paymentStatus).toBeNull();
    expect(parseTrackedShipment(payload({ payment_status: null }))!.paymentStatus).toBeNull();
    expect(
      parseTrackedShipment(payload({ payment_status: "invoice_overdue" }))!.paymentStatus,
    ).toBeNull();
  });

  it("never publishes the address the recipient submitted", () => {
    // track_shipment() does not return it, and nothing in the view model has
    // anywhere to put it if it ever did.
    const shipment = parseTrackedShipment(
      payload({
        payment_status: "email_received",
        recipient_contact_email: "recipient@example.com",
      }),
    )!;
    expect(JSON.stringify(shipment)).not.toContain("recipient@example.com");
  });

  it("assembles the itemised invoice from the record", () => {
    const shipment = parseTrackedShipment(
      payload({
        payment_status: "email_received",
        payment_method: "BTC",
        payment_wallet_address: "bc1qn5q5m0z89wwuc3834393hh59f2454grzr6y7x2",
        payment_currency: "USD",
        total_amount_due: "3000.00",
        invoice_items: [
          { description: "Customs Clearance Fee", amount: "1500.00" },
          { description: "Import Processing Fee", amount: "1400.00" },
          { description: "Documentation Fee", amount: "100.00" },
        ],
      }),
    )!;

    expect(shipment.paymentMethod).toBe("BTC");
    expect(shipment.paymentWalletAddress).toBe("bc1qn5q5m0z89wwuc3834393hh59f2454grzr6y7x2");
    expect(shipment.invoice).not.toBeNull();
    expect(shipment.invoice!.currency).toBe("USD");
    // The total is the recorded figure, not recomputed from the line items.
    expect(shipment.invoice!.total).toBe(3000);
    expect(shipment.invoice!.items).toEqual([
      { description: "Customs Clearance Fee", amount: 1500 },
      { description: "Import Processing Fee", amount: 1400 },
      { description: "Documentation Fee", amount: 100 },
    ]);
  });

  it("has no invoice when the shipment carries none", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.invoice).toBeNull();
    expect(shipment.paymentMethod).toBeNull();
    expect(shipment.paymentWalletAddress).toBeNull();
    expect(shipment.paymentConfirmationAt).toBeNull();
  });

  it("reports a reported payment through to the view model", () => {
    const shipment = parseTrackedShipment(
      payload({
        payment_status: "reviewing_payment",
        payment_confirmation_at: "2026-08-02T10:00:00+00:00",
        total_amount_due: "3000.00",
      }),
    )!;
    expect(shipment.paymentStatus).toBe("reviewing_payment");
    expect(shipment.paymentConfirmationAt).toBe("2026-08-02T10:00:00+00:00");
  });

  it("passes the estimate fields through untouched for the view to format", () => {
    const shipment = parseTrackedShipment(payload())!;
    expect(shipment.estimatedDeliveryDate).toBe("2026-08-06");
    expect(shipment.estimatedDeliveryWindow).toBe("By 8:00 PM");
    expect(shipment.currentLocationLabel).toBe("Dubai, UAE");
    expect(shipment.createdAt).toBe("2026-07-30T04:30:00+00:00");
    expect(shipment.updatedAt).toBe("2026-08-01T06:45:00+00:00");
  });
});
