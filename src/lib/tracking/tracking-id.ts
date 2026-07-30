/**
 * Tracking ID rules.
 *
 * Format: "ST" + ten characters from an unambiguous alphabet + a two letter
 * ISO destination country code. Displayed in groups of four:
 *
 *   STX984756532US  ->  STX9 8475 6532 US
 *
 * The alphabet excludes I, L, O and U so the body can be read aloud, printed on
 * a waybill or typed from a photo without ambiguity. The country suffix is a
 * real ISO code and is not restricted the same way, which is why U is legal
 * there and folding is applied to the body only.
 *
 * 32^10 is roughly 1.1e15 possible bodies, so guessing another customer's
 * shipment is impractical. Lookups are additionally rate limited.
 */

export const TRACKING_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const TRACKING_ID_PREFIX = "ST";
export const TRACKING_ID_BODY_LENGTH = 10;
export const TRACKING_ID_COUNTRY_LENGTH = 2;
export const TRACKING_ID_LENGTH =
  TRACKING_ID_PREFIX.length + TRACKING_ID_BODY_LENGTH + TRACKING_ID_COUNTRY_LENGTH;

/** Mirrors the shipments_tracking_id_format check constraint. */
export const TRACKING_ID_PATTERN = /^ST[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}[A-Z]{2}$/;

/** Shape test used before folding: prefix, ten of anything, two letters. */
const SHAPE_PATTERN = /^ST(.{10})([A-Z]{2})$/;

/**
 * Characters people substitute for the excluded ones. None of I, L, O or U can
 * appear in a valid body, so folding them is always safe and rescues a visitor
 * who typed a letter O for a zero.
 */
const CONFUSABLES: Record<string, string> = {
  I: "1",
  L: "1",
  O: "0",
  U: "V",
};

/**
 * Prepares visitor input for lookup: strips spaces, dashes and any other
 * formatting, upper-cases, then folds confusable characters in the body only.
 * Always returns a string and never throws.
 */
export function normalizeTrackingId(input: string | null | undefined): string {
  if (!input) return "";

  const stripped = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const shape = SHAPE_PATTERN.exec(stripped);
  if (!shape) return stripped;

  const [, body, country] = shape;
  let folded = "";
  for (const char of body) {
    folded += CONFUSABLES[char] ?? char;
  }

  return `${TRACKING_ID_PREFIX}${folded}${country}`;
}

export function isValidTrackingId(input: string | null | undefined): boolean {
  return TRACKING_ID_PATTERN.test(normalizeTrackingId(input));
}

/**
 * Groups an ID for display: STX984756532US reads as "STX9 8475 6532 US".
 * Input that is not a valid ID is returned unchanged, so this is safe to call
 * on raw user input.
 */
export function formatTrackingId(input: string | null | undefined): string {
  const normalized = normalizeTrackingId(input);
  if (!TRACKING_ID_PATTERN.test(normalized)) return input ?? "";

  const body = normalized.slice(0, TRACKING_ID_PREFIX.length + TRACKING_ID_BODY_LENGTH);
  const country = normalized.slice(TRACKING_ID_PREFIX.length + TRACKING_ID_BODY_LENGTH);
  return `${(body.match(/.{1,4}/g) ?? []).join(" ")} ${country}`;
}

/** The destination country code carried by a tracking ID, or null if invalid. */
export function trackingIdCountry(input: string | null | undefined): string | null {
  const normalized = normalizeTrackingId(input);
  if (!TRACKING_ID_PATTERN.test(normalized)) return null;
  return normalized.slice(-TRACKING_ID_COUNTRY_LENGTH);
}

/**
 * Source of randomness, injectable so generation can be tested
 * deterministically. Must fill the returned array with uniform bytes.
 */
export type RandomBytesSource = (byteLength: number) => Uint8Array;

const defaultRandomBytes: RandomBytesSource = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytes;
};

/**
 * Generates a tracking ID for a destination country.
 *
 * The database has an equivalent generator used as the column default. This one
 * exists so the admin flow can show an operator the ID before the row is
 * written, and so generation is unit testable. Uniqueness is enforced by the
 * unique constraint on shipments.tracking_id, not by this function.
 *
 * 256 is an exact multiple of the 32 character alphabet, so indexing by
 * byte % 32 stays uniform with no modulo bias.
 */
export function generateTrackingId(
  destinationCountry: string,
  randomBytes: RandomBytesSource = defaultRandomBytes,
): string {
  const country = (destinationCountry ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new Error(
      `Destination country must be a two letter code, received "${destinationCountry}"`,
    );
  }

  const bytes = randomBytes(TRACKING_ID_BODY_LENGTH);
  if (bytes.length < TRACKING_ID_BODY_LENGTH) {
    throw new Error(
      `Random source returned ${bytes.length} bytes, needed ${TRACKING_ID_BODY_LENGTH}`,
    );
  }

  let body = "";
  for (let i = 0; i < TRACKING_ID_BODY_LENGTH; i += 1) {
    body += TRACKING_ALPHABET[bytes[i] % TRACKING_ALPHABET.length];
  }

  return `${TRACKING_ID_PREFIX}${body}${country}`;
}
