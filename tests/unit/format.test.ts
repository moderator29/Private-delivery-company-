import { describe, expect, it } from "vitest";

import {
  DISPLAY_TIME_ZONE,
  DISPLAY_TIME_ZONE_LABEL,
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatDaysLabel,
  formatTime,
  formatTimeRemaining,
  formatWeight,
  joinParts,
} from "@/lib/format";

describe("display timezone", () => {
  it("is the network's timezone and is always labelled", () => {
    expect(DISPLAY_TIME_ZONE).toBe("Asia/Dubai");
    expect(DISPLAY_TIME_ZONE_LABEL).toBe("GST");
  });
});

describe("formatDateTime", () => {
  it("renders an instant in Gulf Standard Time with the zone shown", () => {
    // 06:45 UTC is 10:45 in Dubai, which is +4 all year.
    expect(formatDateTime("2026-08-01T06:45:00Z")).toBe(
      "August 1, 2026 10:45 AM GST",
    );
  });

  it("shifts the date when the instant falls on the previous UTC day", () => {
    // 21:30 UTC on 31 July is already 01:30 on 1 August in Dubai.
    expect(formatDateTime("2026-07-31T21:30:00Z")).toBe(
      "August 1, 2026 1:30 AM GST",
    );
  });

  it("uses long month names and a 12 hour clock", () => {
    expect(formatDateTime("2026-12-25T14:05:00Z")).toBe(
      "December 25, 2026 6:05 PM GST",
    );
  });

  it("accepts an offset timestamp as Postgres returns it", () => {
    expect(formatDateTime("2026-08-01T10:45:00+04:00")).toBe(
      "August 1, 2026 10:45 AM GST",
    );
  });

  it("returns null for missing or unparseable input", () => {
    expect(formatDateTime(null)).toBeNull();
    expect(formatDateTime(undefined)).toBeNull();
    expect(formatDateTime("")).toBeNull();
    expect(formatDateTime("not a date")).toBeNull();
  });
});

describe("formatDate", () => {
  it("renders the calendar date of an instant in Dubai", () => {
    expect(formatDate("2026-07-30T04:30:00Z")).toBe("July 30, 2026");
    expect(formatDate("2026-07-31T21:30:00Z")).toBe("August 1, 2026");
  });

  it("returns null for missing or unparseable input", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("nonsense")).toBeNull();
  });
});

describe("formatTime", () => {
  it("renders just the clock time with the zone label", () => {
    expect(formatTime("2026-08-01T06:45:00Z")).toBe("10:45 AM GST");
    expect(formatTime(null)).toBeNull();
  });
});

describe("formatCalendarDate", () => {
  it("renders a date-only value without drifting a day", () => {
    // The estimated delivery date is a calendar date, not an instant. Parsing it
    // as an instant would render 2026-08-06 as August 5 in a negative offset.
    expect(formatCalendarDate("2026-08-06")).toBe("August 6, 2026");
    expect(formatCalendarDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatCalendarDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("tolerates surrounding whitespace", () => {
    expect(formatCalendarDate("  2026-08-06  ")).toBe("August 6, 2026");
  });

  it("falls back to instant formatting for anything that is not date-only", () => {
    expect(formatCalendarDate("2026-08-01T06:45:00Z")).toBe("August 1, 2026");
  });

  it("returns null for missing or unparseable input", () => {
    expect(formatCalendarDate(null)).toBeNull();
    expect(formatCalendarDate("")).toBeNull();
    expect(formatCalendarDate("soon")).toBeNull();
  });
});

describe("formatWeight", () => {
  it("keeps real precision but trims trailing zeros", () => {
    expect(formatWeight(0.05)).toBe("0.05 kg");
    expect(formatWeight(2)).toBe("2 kg");
    expect(formatWeight(2.0)).toBe("2 kg");
    expect(formatWeight(2.5)).toBe("2.5 kg");
    expect(formatWeight(12.25)).toBe("12.25 kg");
  });

  it("rounds to the gram", () => {
    expect(formatWeight(1.23456)).toBe("1.235 kg");
  });

  it("handles zero as a real value rather than a missing one", () => {
    expect(formatWeight(0)).toBe("0 kg");
  });

  it("returns null when no weight is recorded", () => {
    expect(formatWeight(null)).toBeNull();
    expect(formatWeight(undefined)).toBeNull();
    expect(formatWeight(Number.NaN)).toBeNull();
    expect(formatWeight(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("formatDaysLabel", () => {
  it("names a same day delivery rather than showing zero days", () => {
    expect(formatDaysLabel(0)).toBe("Same day");
  });

  it("singularises one day and pluralises the rest", () => {
    expect(formatDaysLabel(1)).toBe("1 day");
    expect(formatDaysLabel(2)).toBe("2 days");
    expect(formatDaysLabel(6)).toBe("6 days");
  });

  it("returns null rather than a negative or missing duration", () => {
    expect(formatDaysLabel(-1)).toBeNull();
    expect(formatDaysLabel(null)).toBeNull();
    expect(formatDaysLabel(undefined)).toBeNull();
    expect(formatDaysLabel(Number.NaN)).toBeNull();
  });
});

describe("joinParts", () => {
  it("drops empty, blank and missing parts", () => {
    expect(joinParts(["Miami", null, "Florida", undefined, "", "   "])).toBe(
      "Miami, Florida",
    );
  });

  it("trims what it keeps and honours a custom separator", () => {
    expect(joinParts([" Florida ", " 33193 "], " ")).toBe("Florida 33193");
  });

  it("returns an empty string when nothing survives", () => {
    expect(joinParts([null, undefined, "  "])).toBe("");
    expect(joinParts([])).toBe("");
  });
});

describe("formatTimeRemaining", () => {
  const minutes = (n: number) => n * 60_000;
  const hours = (n: number) => n * 3_600_000;
  const days = (n: number) => n * 86_400_000;

  it("reads the two largest units that still say something", () => {
    expect(formatTimeRemaining(days(2) + hours(18))).toBe("2 days 18 hours");
    expect(formatTimeRemaining(hours(18) + minutes(40))).toBe("18 hours 40 minutes");
    expect(formatTimeRemaining(minutes(9))).toBe("9 minutes");
  });

  it("drops a unit that is zero rather than printing it", () => {
    expect(formatTimeRemaining(days(3))).toBe("3 days");
    expect(formatTimeRemaining(hours(6))).toBe("6 hours");
  });

  it("singularises a unit of one", () => {
    expect(formatTimeRemaining(days(1) + hours(1))).toBe("1 day 1 hour");
    expect(formatTimeRemaining(minutes(1))).toBe("1 minute");
  });

  it("ignores seconds rather than rounding a minute up out of them", () => {
    expect(formatTimeRemaining(days(2) + hours(18) + 59_000)).toBe("2 days 18 hours");
  });

  it("never counts past zero, so a late shipment gets no invented figure", () => {
    // The caller decides what to say once the estimate has passed. Saying
    // "0 minutes left" would be a promise the record cannot support.
    expect(formatTimeRemaining(0)).toBeNull();
    expect(formatTimeRemaining(-hours(3))).toBeNull();
  });

  it("shows a minute rather than nothing for the last sliver of time", () => {
    expect(formatTimeRemaining(20_000)).toBe("1 minute");
  });

  it("returns null for anything that is not a usable number", () => {
    expect(formatTimeRemaining(null)).toBeNull();
    expect(formatTimeRemaining(undefined)).toBeNull();
    expect(formatTimeRemaining(Number.NaN)).toBeNull();
    expect(formatTimeRemaining(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
