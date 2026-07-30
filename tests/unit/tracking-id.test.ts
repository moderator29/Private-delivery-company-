import { describe, expect, it } from "vitest";

import {
  TRACKING_ALPHABET,
  TRACKING_ID_LENGTH,
  formatTrackingId,
  generateTrackingId,
  isValidTrackingId,
  normalizeTrackingId,
  trackingIdCountry,
} from "@/lib/tracking/tracking-id";

describe("normalizeTrackingId", () => {
  it("strips the formatting a customer copies from a confirmation email", () => {
    expect(normalizeTrackingId("STX9 8475 6532 US")).toBe("STX984756532US");
    expect(normalizeTrackingId("stx9-8475-6532-us")).toBe("STX984756532US");
    expect(normalizeTrackingId("  STX9\t8475\n6532 US  ")).toBe("STX984756532US");
  });

  it("folds confusable characters in the body", () => {
    // O for zero, I and L for one: none can legitimately appear in a body.
    expect(normalizeTrackingId("STXO8475653IUS")).toBe("STX084756531US");
    expect(normalizeTrackingId("STL984756532US")).toBe("ST1984756532US");
  });

  it("never folds the country suffix", () => {
    // U is legal in an ISO code. Folding it would turn US into VS.
    expect(normalizeTrackingId("STX984756532US")).toMatch(/US$/);
    expect(normalizeTrackingId("STX984756532US").endsWith("VS")).toBe(false);
  });

  it("returns a stripped string rather than throwing on junk", () => {
    expect(normalizeTrackingId("!!!")).toBe("");
    expect(normalizeTrackingId(null)).toBe("");
    expect(normalizeTrackingId(undefined)).toBe("");
    expect(normalizeTrackingId("hello world")).toBe("HELLOWORLD");
  });

  it("is idempotent", () => {
    const once = normalizeTrackingId("stx9 8475 6532 us");
    expect(normalizeTrackingId(once)).toBe(once);
  });
});

describe("isValidTrackingId", () => {
  it("accepts a well formed ID in any casing or spacing", () => {
    expect(isValidTrackingId("STX984756532US")).toBe(true);
    expect(isValidTrackingId("STX9 8475 6532 US")).toBe(true);
    expect(isValidTrackingId("stx9-8475-6532-us")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidTrackingId("STX98475632US")).toBe(false);
    expect(isValidTrackingId("STX9847565321US")).toBe(false);
    expect(isValidTrackingId("ST")).toBe(false);
  });

  it("rejects a missing or malformed country suffix", () => {
    expect(isValidTrackingId("STX9847565321")).toBe(false);
    expect(isValidTrackingId("STX98475653212")).toBe(false);
  });

  it("rejects a wrong prefix", () => {
    expect(isValidTrackingId("XTX984756532US")).toBe(false);
  });

  it("rejects empty and nullish input", () => {
    expect(isValidTrackingId("")).toBe(false);
    expect(isValidTrackingId(null)).toBe(false);
    expect(isValidTrackingId(undefined)).toBe(false);
  });

  it("matches the documented length", () => {
    expect("STX984756532US".length).toBe(TRACKING_ID_LENGTH);
  });
});

describe("formatTrackingId", () => {
  it("groups into blocks of four with the country code trailing", () => {
    expect(formatTrackingId("STX984756532US")).toBe("STX9 8475 6532 US");
  });

  it("formats regardless of the input formatting", () => {
    expect(formatTrackingId("stx9-8475-6532-us")).toBe("STX9 8475 6532 US");
  });

  it("returns invalid input unchanged so it is safe on user text", () => {
    expect(formatTrackingId("not a tracking id")).toBe("not a tracking id");
    expect(formatTrackingId("")).toBe("");
    expect(formatTrackingId(null)).toBe("");
  });
});

describe("trackingIdCountry", () => {
  it("extracts the destination country", () => {
    expect(trackingIdCountry("STX9 8475 6532 US")).toBe("US");
    expect(trackingIdCountry("STX984756532GB")).toBe("GB");
  });

  it("returns null for an invalid ID", () => {
    expect(trackingIdCountry("nonsense")).toBeNull();
  });
});

describe("generateTrackingId", () => {
  /** Deterministic byte source, so a generated ID can be asserted exactly. */
  const bytes = (values: number[]) => () => Uint8Array.from(values);

  it("maps bytes onto the alphabet without bias", () => {
    // Byte value n selects alphabet[n % 32].
    const id = generateTrackingId("US", bytes([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(id).toBe("ST0123456789US");
  });

  it("wraps at the alphabet length, since 256 is a multiple of 32", () => {
    const low = generateTrackingId("US", bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const high = generateTrackingId("US", bytes([32, 64, 96, 128, 160, 192, 224, 32, 64, 96]));
    expect(low).toBe("ST0000000000US");
    // Every one of those is a multiple of 32, so all map back to index 0.
    expect(high).toBe("ST0000000000US");
  });

  it("produces an ID that passes its own validator", () => {
    for (let i = 0; i < 200; i += 1) {
      const id = generateTrackingId("AE");
      expect(isValidTrackingId(id)).toBe(true);
      expect(id).toHaveLength(TRACKING_ID_LENGTH);
    }
  });

  it("only ever emits characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i += 1) {
      const body = generateTrackingId("US").slice(2, 12);
      for (const char of body) {
        expect(TRACKING_ALPHABET).toContain(char);
      }
    }
    // The exclusions are what make an ID safe to read aloud.
    for (const excluded of ["I", "L", "O", "U"]) {
      expect(TRACKING_ALPHABET).not.toContain(excluded);
    }
  });

  it("uses the destination country as the suffix", () => {
    expect(generateTrackingId("gb").endsWith("GB")).toBe(true);
    expect(generateTrackingId("  ae  ").endsWith("AE")).toBe(true);
  });

  it("rejects a country code that is not two letters", () => {
    expect(() => generateTrackingId("USA")).toThrow(/two letter/i);
    expect(() => generateTrackingId("")).toThrow(/two letter/i);
    expect(() => generateTrackingId("1A")).toThrow(/two letter/i);
  });

  it("rejects a short random source rather than emitting a weak ID", () => {
    expect(() => generateTrackingId("US", bytes([1, 2, 3]))).toThrow(/needed 10/);
  });

  it("does not collide across a large sample", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i += 1) seen.add(generateTrackingId("US"));
    expect(seen.size).toBe(5000);
  });
});
