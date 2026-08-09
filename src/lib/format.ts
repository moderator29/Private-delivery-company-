/**
 * Display formatting.
 *
 * Every timestamp is rendered in one explicit timezone and labelled with it.
 * That is a deliberate choice: formatting in the viewer's local zone on the
 * server is impossible, and doing it on the client causes a hydration mismatch
 * and a visible flash. Operations timestamps are meaningful relative to the
 * network, so the network's timezone is the honest one to show, as long as it is
 * always labelled. The machine readable instant is still emitted in a
 * <time dateTime> attribute alongside.
 */

export const DISPLAY_TIME_ZONE = "Asia/Dubai";
export const DISPLAY_TIME_ZONE_LABEL = "GST";

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "July 30, 2026" */
export function formatDate(value: string | null | undefined): string | null {
  const date = parse(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

/** "August 1, 2026 10:45 AM GST" */
export function formatDateTime(value: string | null | undefined): string | null {
  const date = parse(value);
  if (!date) return null;
  // "August 1, 2026 at 10:45 AM" from Intl, reshaped to the waybill style
  // "August 1, 2026 10:45 AM GST" used across the tracking page.
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  })
    .format(date)
    .replace(" at ", " ");
  return `${formatted} ${DISPLAY_TIME_ZONE_LABEL}`;
}

/** "10:45 AM ET" */
export function formatTime(value: string | null | undefined): string | null {
  const date = parse(value);
  if (!date) return null;
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
  return `${formatted} ${DISPLAY_TIME_ZONE_LABEL}`;
}

/**
 * A date-only value such as an estimated delivery date. Parsed as a calendar
 * date rather than an instant, so "2026-08-01" never renders as July 31 because
 * of a timezone shift.
 */
export function formatCalendarDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return formatDate(value);
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

/**
 * Weights are metric. Trailing zeros are trimmed so 0.05 stays "0.05 kg" while
 * 2.00 renders as "2 kg" rather than a falsely precise "2.00 kg".
 */
export function formatWeight(kilograms: number | null | undefined): string | null {
  if (kilograms === null || kilograms === undefined || !Number.isFinite(kilograms)) return null;
  const rounded = Math.round(kilograms * 1000) / 1000;
  return `${Number(rounded.toFixed(3))} kg`;
}

/**
 * How long is left, in the two largest units that still say something: "2 days
 * 18 hours", "18 hours 40 minutes", "9 minutes".
 *
 * A unit that is zero is dropped rather than printed, so an estimate three days
 * out reads "3 days" and not "3 days 0 hours". Anything already elapsed returns
 * null: the caller decides what to say when a package is late, and it is not
 * this function's place to invent "0 minutes left".
 */
export function formatTimeRemaining(milliseconds: number | null | undefined): string | null {
  if (milliseconds === null || milliseconds === undefined || !Number.isFinite(milliseconds)) {
    return null;
  }
  if (milliseconds <= 0) return null;

  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"}`;

  if (days > 0) {
    return hours > 0 ? `${plural(days, "day")} ${plural(hours, "hour")}` : plural(days, "day");
  }
  if (hours > 0) {
    return minutes > 0
      ? `${plural(hours, "hour")} ${plural(minutes, "minute")}`
      : plural(hours, "hour");
  }
  return plural(Math.max(minutes, 1), "minute");
}

export function formatDaysLabel(days: number | null | undefined): string | null {
  if (days === null || days === undefined || !Number.isFinite(days) || days < 0) return null;
  if (days === 0) return "Same day";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** Joins non-empty parts, used for addresses and location lines. */
export function joinParts(parts: Array<string | null | undefined>, separator = ", "): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}
