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

import { createHmac } from "node:crypto";
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

function event(
  status,
  title,
  description,
  occurredAt,
  place = DUBAI,
  facilityLabel = null,
) {
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
  sender: {
    name: "Layla Haddad",
    company: "Haddad Trading",
    city: "Dubai",
    state: null,
    country: "AE",
  },
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
    event(
      "picked_up",
      "Picked Up",
      "Collected from the sender.",
      "2026-07-30T07:10:00+00:00",
    ),
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
  sender: {
    name: "Omar Rahman",
    company: null,
    city: "Dubai",
    state: null,
    country: "AE",
  },
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
    event(
      "picked_up",
      "Picked Up",
      "Collected from the sender.",
      "2026-07-31T07:15:00+00:00",
    ),
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
    return {
      status: 200,
      payload: { can_rate: canRate, rated: false, stars: null },
    };
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

/* -------------------------------------------------------------------------
 * The operations dashboard
 *
 * Everything above serves the public site, which has no session, so any visitor
 * may see it. The admin area is the opposite: a page renders only when a valid
 * Supabase session resolves to an active row in admin_users. A mock that
 * refuses every auth call can therefore prove the redirect works and nothing
 * else, which leaves the dashboard itself unrenderable.
 *
 * MOCK_SUPABASE_ADMIN=1 turns on the auth endpoints and the tables behind them.
 * The flag does not sign anyone in: a browser stays signed out until it posts
 * the login form and receives the session cookie, and every table read is
 * refused unless it carries a bearer token this process issued. That is what
 * lets the signed-out specs keep observing exactly what they observed before,
 * whichever mode the mock is running in.
 * ---------------------------------------------------------------------- */

const ADMIN_ENABLED = process.env.MOCK_SUPABASE_ADMIN === "1";

export const ADMIN_EMAIL = "ops@swifttrack.test";
/** Satisfies the sign-in form and is useless anywhere real. */
export const ADMIN_PASSWORD = "mock-operations-password";

const ADMIN_ID = "8f3b6c10-0000-4000-8000-000000000001";
const REFRESH_TOKEN = "mock-refresh-token";

/** The auth user. getUser() returns this object at the top level, not wrapped. */
const AUTH_USER = {
  id: ADMIN_ID,
  aud: "authenticated",
  role: "authenticated",
  email: ADMIN_EMAIL,
  phone: "",
  email_confirmed_at: "2026-01-05T09:00:00+00:00",
  confirmed_at: "2026-01-05T09:00:00+00:00",
  last_sign_in_at: "2026-07-30T06:00:00+00:00",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Noor Al Mansoori" },
  identities: [],
  created_at: "2026-01-05T09:00:00+00:00",
  updated_at: "2026-07-30T06:00:00+00:00",
  is_anonymous: false,
};

const issuedTokens = new Set();

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

/**
 * Issues a session whose access token is a structurally real HS256 JWT.
 *
 * auth-js decodes the access token to read its expiry before it will use a
 * stored session, so an opaque string never reaches this server at all: it is
 * rejected inside the client. The signature is computed over a throwaway secret
 * because nothing verifies it. Only the shape and the exp claim matter.
 */
function issueSession() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: "http://127.0.0.1/auth/v1",
      sub: ADMIN_ID,
      aud: "authenticated",
      role: "authenticated",
      email: ADMIN_EMAIL,
      session_id: "8f3b6c10-0000-4000-8000-0000000000ff",
      iat: issuedAt,
      exp: expiresAt,
    }),
  );
  const signature = createHmac("sha256", "mock-signing-secret")
    .update(`${header}.${payload}`)
    .digest("base64url");

  const accessToken = `${header}.${payload}.${signature}`;
  issuedTokens.add(accessToken);

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: expiresAt - issuedAt,
    expires_at: expiresAt,
    refresh_token: REFRESH_TOKEN,
    user: AUTH_USER,
  };
}

/**
 * Only a token this process issued counts. A cookie left over from an earlier
 * run therefore reads as signed out rather than quietly granting access, which
 * is the same answer the real service gives for a revoked session.
 */
function isAuthorised(request) {
  const header = request.headers.authorization ?? "";
  return header.startsWith("Bearer ") && issuedTokens.has(header.slice(7));
}

async function handleAuth(request, response, url) {
  const endpoint = url.pathname.slice("/auth/v1/".length);

  if (endpoint === "token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "refresh_token") return send(response, 200, issueSession());

    const body = await readBody(request);
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      // Shaped like GoTrue's own refusal so the sign-in action takes its error
      // branch rather than throwing on an unexpected payload.
      return send(response, 400, {
        code: "invalid_credentials",
        error_code: "invalid_credentials",
        error: "invalid_grant",
        error_description: "Invalid login credentials",
        msg: "Invalid login credentials",
        message: "Invalid login credentials",
      });
    }
    return send(response, 200, issueSession());
  }

  if (endpoint === "user") {
    if (!isAuthorised(request)) {
      return send(response, 401, {
        code: 401,
        message: "Invalid authentication credentials",
      });
    }
    return send(response, 200, AUTH_USER);
  }

  if (endpoint === "logout") {
    const header = request.headers.authorization ?? "";
    issuedTokens.delete(header.slice(7));
    return send(response, 204, undefined);
  }

  return send(response, 404, {
    code: 404,
    message: `No auth route ${endpoint}`,
  });
}

/* -------------------------------------------------------------------------
 * Table fixtures
 *
 * The admin pages read tables directly rather than through a database
 * function, so these rows carry every column the generated types declare. A
 * missing column would surface as a blank field in the interface instead of an
 * error, which is exactly the kind of defect a rendering pass is meant to find.
 *
 * Timestamps are relative to process start rather than fixed dates. The
 * overview counts shipments delivered in the last seven days, and a fixed
 * fixture would quietly render that tile as zero for anyone running the mock
 * after the week it was written.
 * ---------------------------------------------------------------------- */

const START = Date.now();

/** ISO instant this many hours before the mock started. */
function ago(hours) {
  return new Date(START - hours * 3_600_000).toISOString();
}

/** Calendar date this many days after the mock started, for delivery estimates. */
function dueIn(days) {
  return new Date(START + days * 86_400_000).toISOString().slice(0, 10);
}

const ROUTES = {
  miami: {
    destination_city: "Miami",
    destination_state: "Florida",
    destination_country: "US",
    destination_postal_code: "33193",
    destination_address_line1: "15440 SW 74th Circle Ct #604",
    destination_latitude: 25.7617,
    destination_longitude: -80.1918,
  },
  london: {
    destination_city: "London",
    destination_state: null,
    destination_country: "GB",
    destination_postal_code: "EC2A 4NE",
    destination_address_line1: "34 Paul Street",
    destination_latitude: 51.5237,
    destination_longitude: -0.0857,
  },
  mumbai: {
    destination_city: "Mumbai",
    destination_state: "Maharashtra",
    destination_country: "IN",
    destination_postal_code: "400051",
    destination_address_line1: "Plot 14, Bandra Kurla Complex",
    destination_latitude: 19.0653,
    destination_longitude: 72.8687,
  },
  singapore: {
    destination_city: "Singapore",
    destination_state: null,
    destination_country: "SG",
    destination_postal_code: "018956",
    destination_address_line1: "10 Marina Boulevard, #39-02",
    destination_latitude: 1.2806,
    destination_longitude: 103.8546,
  },
  frankfurt: {
    destination_city: "Frankfurt",
    destination_state: "Hesse",
    destination_country: "DE",
    destination_postal_code: "60311",
    destination_address_line1: "Grosse Gallusstrasse 18",
    destination_latitude: 50.1109,
    destination_longitude: 8.6821,
  },
  riyadh: {
    destination_city: "Riyadh",
    destination_state: null,
    destination_country: "SA",
    destination_postal_code: "12241",
    destination_address_line1: "King Fahd Road, Al Olaya",
    destination_latitude: 24.7136,
    destination_longitude: 46.6753,
  },
  newYork: {
    destination_city: "New York",
    destination_state: "New York",
    destination_country: "US",
    destination_postal_code: "10018",
    destination_address_line1: "1120 Avenue of the Americas, Floor 4",
    destination_latitude: 40.7549,
    destination_longitude: -73.984,
  },
  nairobi: {
    destination_city: "Nairobi",
    destination_state: null,
    destination_country: "KE",
    destination_postal_code: "00100",
    destination_address_line1: "Riverside Drive, Suite 8",
    destination_latitude: -1.2648,
    destination_longitude: 36.8034,
  },
};

const SHIPMENT_DEFAULTS = {
  origin_city: "Dubai",
  origin_state: null,
  origin_country: "AE",
  origin_postal_code: "00000",
  origin_address_line1: "Dubai Logistics City, Gate 4",
  origin_address_line2: null,
  origin_latitude: 25.2048,
  origin_longitude: 55.2708,
  destination_address_line2: null,
  service_level: "standard",
  package_type: "Box",
  piece_count: 1,
  weight_kg: 1.5,
  length_cm: 30,
  width_cm: 22,
  height_cm: 8,
  sender_name: "Andrew Goodson",
  sender_company: null,
  sender_email: "andrew@swifttrackclients.test",
  sender_phone: "+971 4 555 0110",
  recipient_company: null,
  recipient_email: null,
  recipient_phone: null,
  estimated_delivery_window: "By 8:00 PM",
  internal_notes: null,
  current_location_label: "Dubai",
  delivered_at: null,
  archived_at: null,
  created_by: ADMIN_ID,
};

let shipmentSequence = 0;

function shipment(overrides) {
  shipmentSequence += 1;
  return {
    ...SHIPMENT_DEFAULTS,
    id: `a1b2c3d4-0000-4000-8000-${String(shipmentSequence).padStart(12, "0")}`,
    ...overrides,
  };
}

/**
 * The first three carry the tracking IDs the public fixtures use, so an
 * operator opening "View public page" from the detail screen lands on a
 * tracking page that actually resolves.
 */
const SHIPMENT_ROWS = [
  shipment({
    tracking_id: TRACKING_IN_TRANSIT,
    status: "in_transit",
    ...ROUTES.miami,
    recipient_name: "Rafael S Angarita",
    recipient_email: "rafael.angarita@example.test",
    recipient_phone: "+1 305 555 0142",
    package_type: "Document",
    piece_count: 1,
    weight_kg: 0.05,
    length_cm: null,
    width_cm: null,
    height_cm: null,
    current_location_label: "Dubai",
    estimated_delivery_date: dueIn(6),
    shipped_at: ago(30),
    internal_notes:
      "Customer called to confirm the delivery window. Recipient prefers a front-desk handover.",
    created_at: ago(54),
    updated_at: ago(3),
  }),
  shipment({
    tracking_id: TRACKING_DELIVERED,
    status: "delivered",
    service_level: "express",
    ...ROUTES.miami,
    destination_postal_code: "33131",
    destination_address_line1: "820 Brickell Key Drive",
    destination_address_line2: "Apt 1904",
    sender_name: "Layla Haddad",
    sender_company: "Haddad Trading",
    recipient_name: "Marcus Bell",
    recipient_email: "marcus.bell@example.test",
    piece_count: 2,
    weight_kg: 3.2,
    current_location_label: "Miami, Florida",
    estimated_delivery_date: dueIn(-1),
    shipped_at: ago(96),
    delivered_at: ago(26),
    created_at: ago(120),
    updated_at: ago(26),
  }),
  shipment({
    tracking_id: TRACKING_DELAYED,
    status: "delayed",
    service_level: "priority",
    ...ROUTES.miami,
    destination_postal_code: "33172",
    destination_address_line1: "1200 NW 87th Avenue",
    sender_name: "Omar Rahman",
    recipient_name: "Priya Nair",
    recipient_phone: "+1 305 555 0177",
    estimated_delivery_date: dueIn(9),
    shipped_at: ago(29),
    internal_notes:
      "Held by weather at the transit hub. Rebooking on the next linehaul.",
    created_at: ago(53),
    updated_at: ago(11),
  }),
  shipment({
    tracking_id: "ST4471902238GB",
    status: "out_for_delivery",
    service_level: "express",
    ...ROUTES.london,
    recipient_name: "Eleanor Whitfield",
    recipient_company: "Whitfield & Co Solicitors",
    recipient_email: "eleanor@whitfield.test",
    current_location_label: "London",
    estimated_delivery_date: dueIn(0),
    shipped_at: ago(60),
    created_at: ago(80),
    updated_at: ago(2),
  }),
  shipment({
    tracking_id: "ST7730148852IN",
    status: "out_for_delivery",
    ...ROUTES.mumbai,
    recipient_name: "Aditya Sharma",
    recipient_company: "Kanan Textiles",
    current_location_label: "Mumbai, Maharashtra",
    estimated_delivery_date: dueIn(0),
    shipped_at: ago(52),
    weight_kg: 12.4,
    piece_count: 4,
    created_at: ago(74),
    updated_at: ago(4),
  }),
  shipment({
    tracking_id: "ST2216470085SG",
    status: "arrived_at_facility",
    service_level: "priority",
    ...ROUTES.singapore,
    recipient_name: "Wei Lin Tan",
    current_location_label: "Singapore",
    estimated_delivery_date: dueIn(1),
    shipped_at: ago(44),
    created_at: ago(66),
    updated_at: ago(6),
  }),
  shipment({
    tracking_id: "ST5549703318DE",
    status: "in_transit",
    ...ROUTES.frankfurt,
    recipient_name: "Jonas Brenner",
    recipient_company: "Brenner Maschinenbau GmbH",
    estimated_delivery_date: dueIn(3),
    shipped_at: ago(20),
    weight_kg: 48,
    piece_count: 6,
    package_type: "Pallet",
    service_level: "freight",
    created_at: ago(40),
    updated_at: ago(7),
  }),
  shipment({
    tracking_id: "ST8872036641SA",
    status: "in_transit",
    service_level: "same_day",
    ...ROUTES.riyadh,
    recipient_name: "Fatima Al Otaibi",
    estimated_delivery_date: dueIn(0),
    shipped_at: ago(5),
    package_type: "Envelope",
    weight_kg: 0.3,
    created_at: ago(9),
    updated_at: ago(1),
  }),
  shipment({
    tracking_id: "ST3305369974US",
    status: "exception",
    ...ROUTES.newYork,
    recipient_name: "Dana Petrov",
    recipient_email: "dana.petrov@example.test",
    estimated_delivery_date: dueIn(2),
    shipped_at: ago(70),
    internal_notes:
      "Address query raised by the destination gateway. Awaiting the sender.",
    created_at: ago(92),
    updated_at: ago(8),
  }),
  shipment({
    tracking_id: "ST5527581196KE",
    status: "delivery_attempted",
    ...ROUTES.nairobi,
    recipient_name: "Grace Wanjiru",
    estimated_delivery_date: dueIn(1),
    shipped_at: ago(78),
    current_location_label: "Nairobi",
    created_at: ago(100),
    updated_at: ago(13),
  }),
  shipment({
    tracking_id: "ST5583014429GB",
    status: "delivered",
    service_level: "express",
    ...ROUTES.london,
    recipient_name: "Callum Reid",
    estimated_delivery_date: dueIn(-2),
    shipped_at: ago(140),
    delivered_at: ago(50),
    current_location_label: "London",
    created_at: ago(170),
    updated_at: ago(50),
  }),
  shipment({
    tracking_id: "ST3327581196SG",
    status: "delivered",
    ...ROUTES.singapore,
    recipient_name: "Marissa Ong",
    recipient_company: "Ong Medical Supplies",
    estimated_delivery_date: dueIn(-3),
    shipped_at: ago(160),
    delivered_at: ago(74),
    current_location_label: "Singapore",
    created_at: ago(190),
    updated_at: ago(74),
  }),
  shipment({
    tracking_id: "ST6650814429DE",
    status: "delivered",
    service_level: "priority",
    ...ROUTES.frankfurt,
    recipient_name: "Helena Vogt",
    estimated_delivery_date: dueIn(-4),
    shipped_at: ago(180),
    delivered_at: ago(98),
    current_location_label: "Frankfurt, Hesse",
    created_at: ago(210),
    updated_at: ago(98),
  }),
  shipment({
    tracking_id: "ST8841259963IN",
    status: "picked_up",
    ...ROUTES.mumbai,
    recipient_name: "Rohan Desai",
    estimated_delivery_date: dueIn(5),
    shipped_at: ago(4),
    created_at: ago(16),
    updated_at: ago(4),
  }),
  shipment({
    tracking_id: "ST9983147752SA",
    status: "label_created",
    ...ROUTES.riyadh,
    recipient_name: "Yousef Al Harbi",
    estimated_delivery_date: dueIn(4),
    shipped_at: null,
    current_location_label: null,
    created_at: ago(12),
    updated_at: ago(12),
  }),
  shipment({
    tracking_id: "ST4416470085US",
    status: "created",
    ...ROUTES.newYork,
    recipient_name: "Sofia Marino",
    recipient_company: "Marino Gallery",
    estimated_delivery_date: null,
    estimated_delivery_window: null,
    shipped_at: null,
    current_location_label: null,
    created_at: ago(6),
    updated_at: ago(6),
  }),
  shipment({
    tracking_id: "ST6638692207KE",
    status: "in_transit",
    ...ROUTES.nairobi,
    recipient_name: "Peter Otieno",
    estimated_delivery_date: dueIn(2),
    shipped_at: ago(34),
    created_at: ago(58),
    updated_at: ago(14),
  }),
  shipment({
    tracking_id: "ST6692557710GB",
    status: "arrived_at_facility",
    ...ROUTES.london,
    recipient_name: "Imogen Blake",
    estimated_delivery_date: dueIn(1),
    shipped_at: ago(38),
    created_at: ago(62),
    updated_at: ago(16),
  }),
  shipment({
    tracking_id: "ST4438692207SG",
    status: "delayed",
    ...ROUTES.singapore,
    recipient_name: "Nadia Rahim",
    estimated_delivery_date: dueIn(4),
    shipped_at: ago(64),
    internal_notes: "Customs inspection at the destination gateway.",
    created_at: ago(88),
    updated_at: ago(18),
  }),
  shipment({
    tracking_id: "ST7761925530DE",
    status: "returned",
    ...ROUTES.frankfurt,
    recipient_name: "Tobias Lang",
    estimated_delivery_date: dueIn(-6),
    shipped_at: ago(220),
    current_location_label: "Dubai",
    created_at: ago(250),
    updated_at: ago(120),
  }),
  shipment({
    tracking_id: "ST9952360074IN",
    status: "cancelled",
    ...ROUTES.mumbai,
    recipient_name: "Ananya Iyer",
    estimated_delivery_date: null,
    shipped_at: null,
    current_location_label: null,
    created_at: ago(230),
    updated_at: ago(200),
  }),
  shipment({
    tracking_id: "ST2294258863SA",
    status: "delivered",
    ...ROUTES.riyadh,
    recipient_name: "Khalid Nasser",
    estimated_delivery_date: dueIn(-5),
    shipped_at: ago(200),
    delivered_at: ago(130),
    current_location_label: "Riyadh",
    created_at: ago(240),
    updated_at: ago(130),
  }),
  shipment({
    tracking_id: "ST7749703318US",
    status: "delivered",
    ...ROUTES.newYork,
    recipient_name: "Vincent Cole",
    estimated_delivery_date: dueIn(-20),
    shipped_at: ago(700),
    delivered_at: ago(620),
    archived_at: ago(300),
    current_location_label: "New York, New York",
    created_at: ago(740),
    updated_at: ago(300),
  }),
  shipment({
    tracking_id: "ST8850814429GB",
    status: "cancelled",
    ...ROUTES.london,
    recipient_name: "Harriet Doyle",
    estimated_delivery_date: null,
    shipped_at: null,
    archived_at: ago(340),
    current_location_label: null,
    created_at: ago(800),
    updated_at: ago(340),
  }),
];

const byTracking = (trackingId) =>
  SHIPMENT_ROWS.find((row) => row.tracking_id === trackingId).id;

let eventSequence = 0;

function shipmentEvent(shipmentId, overrides) {
  eventSequence += 1;
  return {
    id: `b2c3d4e5-0000-4000-8000-${String(eventSequence).padStart(12, "0")}`,
    shipment_id: shipmentId,
    facility_label: null,
    city: "Dubai",
    state: null,
    country: "AE",
    latitude: 25.2048,
    longitude: 55.2708,
    is_public: true,
    created_by: ADMIN_ID,
    created_at: overrides.occurred_at,
    ...overrides,
  };
}

const IN_TRANSIT_ID = byTracking(TRACKING_IN_TRANSIT);
const DELIVERED_ID = byTracking(TRACKING_DELIVERED);
const DELAYED_ID = byTracking(TRACKING_DELAYED);

/**
 * Only the shipments a reviewer is likely to open carry a full history. An
 * empty history is a state the detail page has to handle too, so the rest are
 * deliberately left without one.
 */
const SHIPMENT_EVENT_ROWS = [
  shipmentEvent(IN_TRANSIT_ID, {
    status: "label_created",
    title: "Shipment Information Received",
    description: "Shipment details received and the waybill was created.",
    occurred_at: ago(54),
    facility_label: "Dubai Logistics City",
  }),
  shipmentEvent(IN_TRANSIT_ID, {
    status: "picked_up",
    title: "Picked Up",
    description: "Collected from the sender by a SwiftTrack courier.",
    occurred_at: ago(30),
  }),
  shipmentEvent(IN_TRANSIT_ID, {
    status: "in_transit",
    title: "Departed Origin Facility",
    description: "Processed for export and released from the Dubai gateway.",
    occurred_at: ago(12),
    facility_label: "Dubai Gateway",
  }),
  shipmentEvent(IN_TRANSIT_ID, {
    status: "in_transit",
    title: "Linehaul booked on DXB to MIA",
    description:
      "Booked on the direct rotation. Not published because the routing is commercially sensitive.",
    occurred_at: ago(6),
    is_public: false,
  }),
  shipmentEvent(IN_TRANSIT_ID, {
    status: "in_transit",
    title: "In Transit",
    description: "Departed Dubai on the linehaul to the destination country.",
    occurred_at: ago(3),
  }),
  shipmentEvent(DELIVERED_ID, {
    status: "label_created",
    title: "Shipment Information Received",
    description: "Shipment details received and the waybill was created.",
    occurred_at: ago(120),
  }),
  shipmentEvent(DELIVERED_ID, {
    status: "in_transit",
    title: "Departed Origin Facility",
    description: "Released from the Dubai gateway.",
    occurred_at: ago(90),
  }),
  shipmentEvent(DELIVERED_ID, {
    status: "arrived_at_facility",
    title: "Arrived at Destination Country",
    description: "Cleared customs in the destination country.",
    occurred_at: ago(44),
    city: "Miami",
    state: "Florida",
    country: "US",
    latitude: 25.7617,
    longitude: -80.1918,
  }),
  shipmentEvent(DELIVERED_ID, {
    status: "delivered",
    title: "Delivered",
    description: "Handed to the recipient at the front desk.",
    occurred_at: ago(26),
    city: "Miami",
    state: "Florida",
    country: "US",
    latitude: 25.7617,
    longitude: -80.1918,
  }),
  shipmentEvent(DELAYED_ID, {
    status: "in_transit",
    title: "In Transit",
    description: "Departed Dubai on the linehaul to the destination country.",
    occurred_at: ago(28),
  }),
  shipmentEvent(DELAYED_ID, {
    status: "delayed",
    title: "Delayed in Transit",
    description:
      "The linehaul was held by weather at the transit hub. A new departure is being arranged.",
    occurred_at: ago(11),
  }),
];

const ADMIN_USER_ROWS = [
  {
    id: ADMIN_ID,
    email: ADMIN_EMAIL,
    full_name: "Noor Al Mansoori",
    role: "owner",
    is_active: true,
    created_at: "2026-01-05T09:00:00+00:00",
    updated_at: "2026-07-30T06:00:00+00:00",
  },
];

let auditSequence = 0;

function auditLog(action, trackingId, hoursAgo, actorEmail = ADMIN_EMAIL) {
  auditSequence += 1;
  return {
    id: `c3d4e5f6-0000-4000-8000-${String(auditSequence).padStart(12, "0")}`,
    action,
    actor_id: ADMIN_ID,
    actor_email: actorEmail,
    entity_type: action.split(".")[0],
    entity_id: IN_TRANSIT_ID,
    metadata: { tracking_id: trackingId },
    created_at: ago(hoursAgo),
  };
}

const AUDIT_LOG_ROWS = [
  auditLog("shipment_events.created", TRACKING_IN_TRANSIT, 3),
  auditLog(
    "shipments.updated",
    "ST4471902238GB",
    2,
    "dispatch@swifttrack.test",
  ),
  auditLog("shipment_events.created", "ST7730148852IN", 4),
  auditLog(
    "shipments.status_changed",
    "ST3305369974US",
    8,
    "dispatch@swifttrack.test",
  ),
  auditLog("shipments.created", "ST8872036641SA", 9),
  auditLog("shipment_events.updated", TRACKING_DELAYED, 11),
  auditLog("shipments.archived", "ST7749703318US", 300),
  auditLog(
    "shipments.restored",
    "ST8850814429GB",
    340,
    "dispatch@swifttrack.test",
  ),
];

const TABLES = {
  admin_users: ADMIN_USER_ROWS,
  shipments: SHIPMENT_ROWS,
  shipment_events: SHIPMENT_EVENT_ROWS,
  audit_logs: AUDIT_LOG_ROWS,
};

/* -------------------------------------------------------------------------
 * A small slice of PostgREST
 *
 * Only the operators the admin queries actually emit are implemented. Guessing
 * at the rest would be untested code pretending to be a database; an unknown
 * operator throwing here is the more useful failure, because it means a query
 * changed and this mock has to be taught about it.
 * ---------------------------------------------------------------------- */

const RESERVED_PARAMS = new Set([
  "select",
  "order",
  "limit",
  "offset",
  "or",
  "and",
]);

function unquote(value) {
  return value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}

/** Postgres comparisons are never true against NULL, and neither are these. */
function ordered(value, operator, operand) {
  if (value === null || value === undefined) return false;
  const left = Date.parse(String(value));
  const right = Date.parse(operand);
  const [a, b] =
    Number.isNaN(left) || Number.isNaN(right)
      ? [String(value), operand]
      : [left, right];
  if (operator === "gt") return a > b;
  if (operator === "gte") return a >= b;
  if (operator === "lt") return a < b;
  return a <= b;
}

function matchesCondition(value, expression) {
  if (expression.startsWith("not."))
    return !matchesCondition(value, expression.slice(4));

  const separator = expression.indexOf(".");
  const operator = expression.slice(0, separator);
  const operand = expression.slice(separator + 1);

  switch (operator) {
    case "eq":
      return String(value) === operand;
    case "neq":
      return String(value) !== operand;
    case "is":
      return operand === "null"
        ? value === null || value === undefined
        : String(value) === operand;
    case "in":
      return operand
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map(unquote)
        .includes(String(value));
    case "like":
    case "ilike": {
      const pattern = operand
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*");
      return new RegExp(`^${pattern}$`, operator === "ilike" ? "i" : "").test(
        value === null || value === undefined ? "" : String(value),
      );
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte":
      return ordered(value, operator, operand);
    default:
      throw new Error(
        `mock-supabase: unsupported PostgREST operator "${operator}"`,
      );
  }
}

function compareRows(a, b, column, descending, nullsFirst) {
  const left = a[column];
  const right = b[column];
  const leftNull = left === null || left === undefined;
  const rightNull = right === null || right === undefined;
  if (leftNull || rightNull) {
    if (leftNull && rightNull) return 0;
    return (leftNull ? 1 : -1) * (nullsFirst ? -1 : 1);
  }
  const direction = left < right ? -1 : left > right ? 1 : 0;
  return descending ? -direction : direction;
}

function selectRows(name, url) {
  let rows = TABLES[name];

  for (const [key, value] of url.searchParams) {
    if (RESERVED_PARAMS.has(key)) continue;
    rows = rows.filter((row) => matchesCondition(row[key], value));
  }

  const or = url.searchParams.get("or");
  if (or) {
    const conditions = or.replace(/^\(|\)$/g, "").split(",");
    rows = rows.filter((row) =>
      conditions.some((condition) => {
        const separator = condition.indexOf(".");
        return matchesCondition(
          row[condition.slice(0, separator)],
          condition.slice(separator + 1),
        );
      }),
    );
  }

  const order = url.searchParams.get("order");
  if (order) {
    const terms = order.split(",").map((term) => {
      const [column, direction = "asc", nulls] = term.split(".");
      const descending = direction === "desc";
      return {
        column,
        descending,
        // Postgres puts nulls last when ascending and first when descending
        // unless the query says otherwise, and the sort controls rely on it.
        nullsFirst: nulls ? nulls === "nullsfirst" : descending,
      };
    });
    rows = [...rows].sort((a, b) => {
      for (const term of terms) {
        const result = compareRows(
          a,
          b,
          term.column,
          term.descending,
          term.nullsFirst,
        );
        if (result !== 0) return result;
      }
      return 0;
    });
  }

  const total = rows.length;
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = url.searchParams.get("limit");
  const page = rows.slice(
    offset,
    limit === null ? undefined : offset + Number(limit),
  );

  const select = url.searchParams.get("select");
  const columns = select && !select.includes("*") ? select.split(",") : null;
  const projected = columns
    ? page.map((row) =>
        Object.fromEntries(columns.map((column) => [column, row[column]])),
      )
    : page;

  return { rows: projected, total, offset };
}

function handleTable(request, response, url, name) {
  const rows = TABLES[name];
  if (!rows) {
    return send(response, 404, {
      code: "PGRST205",
      message: `Could not find the table 'public.${name}' in the schema cache`,
    });
  }

  // Row Level Security stands between an anonymous request and every one of
  // these tables, so an unauthenticated read has to come back empty-handed here
  // too. Otherwise the mock would be a weaker gate than production.
  if (!isAuthorised(request)) {
    return send(response, 401, {
      code: "42501",
      message: `permission denied for table ${name}`,
    });
  }

  const { rows: page, total, offset } = selectRows(name, url);
  const last = offset + Math.max(page.length, 1) - 1;

  const body = JSON.stringify(page);
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    // count=exact is answered in this header, which is where the client reads
    // the total for head-only count queries that receive no body at all.
    "content-range": `${offset}-${last}/${total}`,
  });
  // node drops the body of a HEAD response, and head:true count queries are
  // sent as HEAD, so this is the only difference between the two shapes.
  response.end(request.method === "HEAD" ? undefined : body);
}

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
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const { pathname } = url;

    // Without the admin fixtures the admin area must behave as signed out.
    // Refusing every auth call is what a browser with no valid session gets
    // from the real service.
    if (pathname.startsWith("/auth/v1/")) {
      if (!ADMIN_ENABLED) {
        return send(response, 401, {
          code: 401,
          message: "Invalid authentication credentials",
        });
      }
      return handleAuth(request, response, url);
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

    // Table reads, as opposed to database functions. Only the admin area makes
    // them, so they exist only when the admin fixtures do.
    if (ADMIN_ENABLED && pathname.startsWith("/rest/v1/")) {
      return handleTable(
        request,
        response,
        url,
        pathname.slice("/rest/v1/".length),
      );
    }

    if (pathname === "/__health") return send(response, 200, { ok: true });

    // Anything else is a call the application is not supposed to be making.
    return send(response, 404, {
      code: "PGRST100",
      message: `No route for ${pathname}`,
    });
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

const isEntrypoint =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isEntrypoint) {
  const preferred = Number(
    process.argv[2] ?? process.env.MOCK_SUPABASE_PORT ?? 54321,
  );
  startMockSupabase(preferred).then(({ port }) => {
    process.stdout.write(
      `mock supabase listening on http://127.0.0.1:${port}\n`,
    );
  });
}
