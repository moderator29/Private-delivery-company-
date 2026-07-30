/**
 * A stand-in for the Supabase REST surface, for browser tests.
 *
 * The end to end suite must exercise the real Next.js server: real routing,
 * real server components, real rendering. What it must not depend on is a live
 * Supabase project, both because a test run should not read or write production
 * data and because the CI container has no route to *.supabase.co.
 *
 * So this implements the handful of endpoints the application actually calls
 * and nothing else. Every response is shaped exactly like the corresponding
 * database function's return value, including Postgres numerics arriving as
 * strings, so the parsing layer under test is the same one production uses.
 *
 * Plain node:http with no dependencies, so it starts in milliseconds and cannot
 * drift out of step with a package upgrade.
 *
 * Usage: node tests/mock-supabase.mjs [port]   (or MOCK_SUPABASE_PORT)
 */

import { createServer } from "node:http";

/* -------------------------------------------------------------------------
 * Tracking IDs
 *
 * These are the canonical (folded) forms. The application normalises visitor
 * input before it ever reaches the database, and the unambiguous alphabet
 * excludes I, L, O and U, so "STDELIVERED1US" is looked up as "STDE11VERED1US".
 * The fixtures are keyed by the folded form for that reason.
 * ---------------------------------------------------------------------- */

export const TRACKING_IN_TRANSIT = "STX984756532US";
export const TRACKING_DELIVERED = "STDE11VERED1US";
export const TRACKING_DELAYED = "STDE1AYED123US";
/** Well formed, deliberately absent from the fixtures. */
export const TRACKING_UNKNOWN = "STZZ999999ZZUS";

const DUBAI = {
  city: "Dubai",
  state: null,
  country: "AE",
  latitude: "25.204800",
  longitude: "55.270800",
};

const MIAMI = {
  city: "Miami",
  state: "Florida",
  country: "US",
  latitude: "25.761700",
  longitude: "-80.191800",
};

function event(status, title, description, occurredAt, place = DUBAI, facilityLabel = null) {
  return {
    status,
    title,
    description,
    facility_label: facilityLabel,
    city: place.city,
    state: place.state,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    occurred_at: occurredAt,
  };
}

/** The live Dubai to Miami shipment, matching supabase/seed/first_shipment.sql. */
const IN_TRANSIT = {
  tracking_id: TRACKING_IN_TRANSIT,
  status: "in_transit",
  service_level: "standard",
  sender: { name: "Andrew Goodson", company: null, city: "Dubai", state: null, country: "AE" },
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
  origin: DUBAI,
  destination: MIAMI,
  current_location_label: "Dubai",
  estimated_delivery_date: "2026-08-06",
  estimated_delivery_window: "By 8:00 PM",
  shipped_at: "2026-07-31T07:15:00+00:00",
  delivered_at: null,
  package: {
    package_type: "Document",
    piece_count: 1,
    weight_kg: "0.050",
    length_cm: null,
    width_cm: null,
    height_cm: null,
  },
  created_at: "2026-07-30T04:30:00+00:00",
  updated_at: "2026-08-01T06:45:00+00:00",
  events: [
    event(
      "label_created",
      "Shipment Information Received",
      "Shipment details received and the waybill was created.",
      "2026-07-30T04:30:00+00:00",
    ),
    event(
      "picked_up",
      "Picked Up",
      "Collected from the sender by a SwiftTrack courier.",
      "2026-07-31T07:15:00+00:00",
    ),
    event(
      "in_transit",
      "Departed Origin Facility",
      "Processed for export and released from the Dubai gateway.",
      "2026-08-01T05:40:00+00:00",
    ),
    event(
      "in_transit",
      "In Transit",
      "Departed Dubai on the linehaul to the destination country.",
      "2026-08-01T06:45:00+00:00",
    ),
  ],
};

/** A completed delivery, so the rating flow has something to attach to. */
const DELIVERED = {
  ...IN_TRANSIT,
  tracking_id: TRACKING_DELIVERED,
  status: "delivered",
  service_level: "express",
  sender: { name: "Layla Haddad", company: "Haddad Trading", city: "Dubai", state: null, country: "AE" },
  recipient: {
    name: "Marcus Bell",
    company: null,
    address_line1: "820 Brickell Key Drive",
    address_line2: "Apt 1904",
    city: "Miami",
    state: "Florida",
    postal_code: "33131",
    country: "US",
  },
  current_location_label: "Miami, Florida",
  estimated_delivery_date: "2026-08-04",
  estimated_delivery_window: "By 8:00 PM",
  shipped_at: "2026-07-30T07:10:00+00:00",
  delivered_at: "2026-08-03T14:25:00+00:00",
  package: {
    package_type: "Box",
    piece_count: 2,
    weight_kg: "3.200",
    length_cm: "30.00",
    width_cm: "22.00",
    height_cm: "4.00",
  },
  created_at: "2026-07-29T05:00:00+00:00",
  updated_at: "2026-08-03T14:25:00+00:00",
  events: [
    event(
      "label_created",
      "Shipment Information Received",
      "Shipment details received and the waybill was created.",
      "2026-07-29T05:00:00+00:00",
    ),
    event("picked_up", "Picked Up", "Collected from the sender.", "2026-07-30T07:10:00+00:00"),
    event(
      "in_transit",
      "Departed Origin Facility",
      "Released from the Dubai gateway.",
      "2026-07-30T13:05:00+00:00",
    ),
    event(
      "arrived_at_facility",
      "Arrived at Destination Country",
      "Cleared customs in the destination country.",
      "2026-08-02T09:30:00+00:00",
      MIAMI,
    ),
    event(
      "out_for_delivery",
      "Out for Delivery",
      "With a courier for delivery today.",
      "2026-08-03T11:40:00+00:00",
      MIAMI,
    ),
    event(
      "delivered",
      "Delivered",
      "Handed to the recipient at the front desk.",
      "2026-08-03T14:25:00+00:00",
      MIAMI,
    ),
  ],
};

/** A shipment running behind, so the attention alert has something to show. */
const DELAYED = {
  ...IN_TRANSIT,
  tracking_id: TRACKING_DELAYED,
  status: "delayed",
  service_level: "priority",
  sender: { name: "Omar Rahman", company: null, city: "Dubai", state: null, country: "AE" },
  recipient: {
    name: "Priya Nair",
    company: null,
    address_line1: "1200 NW 87th Avenue",
    address_line2: null,
    city: "Miami",
    state: "Florida",
    postal_code: "33172",
    country: "US",
  },
  current_location_label: "Dubai",
  estimated_delivery_date: "2026-08-08",
  estimated_delivery_window: "By 8:00 PM",
  shipped_at: "2026-07-31T07:15:00+00:00",
  delivered_at: null,
  created_at: "2026-07-30T04:30:00+00:00",
  updated_at: "2026-08-02T03:15:00+00:00",
  events: [
    event(
      "label_created",
      "Shipment Information Received",
      "Shipment details received and the waybill was created.",
      "2026-07-30T04:30:00+00:00",
    ),
    event("picked_up", "Picked Up", "Collected from the sender.", "2026-07-31T07:15:00+00:00"),
    event(
      "in_transit",
      "In Transit",
      "Departed Dubai on the linehaul to the destination country.",
      "2026-08-01T06:45:00+00:00",
    ),
    event(
      "delayed",
      "Delayed in Transit",
      "The linehaul was held by weather at the transit hub. A new departure is being arranged.",
      "2026-08-02T03:15:00+00:00",
    ),
  ],
};

const SHIPMENTS = new Map([
  [TRACKING_IN_TRANSIT, IN_TRANSIT],
  [TRACKING_DELIVERED, DELIVERED],
  [TRACKING_DELAYED, DELAYED],
]);

/* ------------------------------------------------------------------------- */

const CONFUSABLES = { I: "1", L: "1", O: "0", U: "V" };

/** Mirrors public.normalize_tracking_id and src/lib/tracking/tracking-id.ts. */
function normalizeTrackingId(input) {
  if (typeof input !== "string") return "";
  const stripped = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const shape = /^ST(.{10})([A-Z]{2})$/.exec(stripped);
  if (!shape) return stripped;
  const body = [...shape[1]].map((char) => CONFUSABLES[char] ?? char).join("");
  return `ST${body}${shape[2]}`;
}

const RPC = {
  track_shipment(body) {
    const shipment = SHIPMENTS.get(normalizeTrackingId(body.p_tracking_id));
    // Unknown, malformed and archived all answer null, exactly as the real
    // function does. Nothing here tells the caller which it was.
    return { status: 200, payload: shipment ?? null };
  },

  shipment_rating_state(body) {
    const trackingId = normalizeTrackingId(body.p_tracking_id);
    const shipment = SHIPMENTS.get(trackingId);
    const canRate = shipment?.status === "delivered";
    return { status: 200, payload: { can_rate: canRate, rated: false, stars: null } };
  },

  submit_shipment_rating() {
    return { status: 200, payload: { ok: true } };
  },

  service_performance() {
    return {
      status: 200,
      payload: {
        delivered_count: 128,
        on_time_percent: "97.7",
        average_transit_days: "4.2",
        rating_count: 41,
        average_stars: "4.8",
      },
    };
  },

  submit_support_request() {
    // The real function returns void, which PostgREST answers with 204.
    return { status: 204, payload: undefined };
  },
};

function send(response, status, payload) {
  if (payload === undefined) {
    response.writeHead(status);
    response.end();
    return;
  }
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

export function createMockSupabase() {
  return createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");

    // The admin area must behave as signed out. Refusing every auth call is
    // what a browser with no valid session gets from the real service.
    if (pathname.startsWith("/auth/v1/")) {
      return send(response, 401, {
        code: 401,
        message: "Invalid authentication credentials",
      });
    }

    if (pathname.startsWith("/rest/v1/rpc/")) {
      const name = pathname.slice("/rest/v1/rpc/".length);
      const handler = RPC[name];
      if (!handler) {
        return send(response, 404, {
          code: "PGRST202",
          message: `Could not find the function public.${name}`,
        });
      }
      const body = request.method === "POST" ? await readBody(request) : {};
      const { status, payload } = handler(body);
      return send(response, status, payload);
    }

    if (pathname === "/__health") return send(response, 200, { ok: true });

    // Anything else is a call the application is not supposed to be making.
    return send(response, 404, { code: "PGRST100", message: `No route for ${pathname}` });
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    server.once("error", onError);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", onError);
      resolve(port);
    });
  });
}

/**
 * Starts the server and resolves with the port it bound to.
 *
 * Walks forward from the preferred port if something else already holds it, so
 * a stray process on a developer's machine does not fail the whole run. The
 * caller must use the returned port rather than assuming the preferred one.
 */
export async function startMockSupabase(preferredPort, attempts = 20) {
  const server = createMockSupabase();

  for (let offset = 0; offset < attempts; offset += 1) {
    try {
      const port = await listen(server, preferredPort + offset);
      return { server, port };
    } catch (error) {
      if (error?.code !== "EADDRINUSE") throw error;
    }
  }

  throw new Error(
    `No free port for the Supabase mock in ${preferredPort}..${preferredPort + attempts - 1}`,
  );
}

const isEntrypoint = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isEntrypoint) {
  const preferred = Number(process.argv[2] ?? process.env.MOCK_SUPABASE_PORT ?? 54321);
  startMockSupabase(preferred).then(({ port }) => {
    process.stdout.write(`mock supabase listening on http://127.0.0.1:${port}\n`);
  });
}
