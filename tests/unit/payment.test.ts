import { describe, expect, it } from "vitest";

import {
  MAX_EMAIL_LENGTH,
  emailValidationMessage,
  formatMoney,
  isValidEmail,
  normalizeEmail,
  parsePaymentMethod,
  parsePaymentStatus,
} from "@/lib/tracking/payment";

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  Recipient@Example.COM  ")).toBe("recipient@example.com");
  });

  it("never throws on absent input", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("isValidEmail", () => {
  it("accepts addresses people actually have", () => {
    for (const address of [
      "someone@example.com",
      "first.last@example.co.uk",
      "user+tag@sub.example.org",
      "  Mixed.Case@Example.COM  ",
      "a@b.co",
    ]) {
      expect(isValidEmail(address), address).toBe(true);
    }
  });

  it("rejects what cannot be an address", () => {
    for (const address of [
      "",
      "   ",
      "nope",
      "@example.com",
      "someone@",
      // A dotted domain is the one structural rule enforced.
      "someone@example",
      "someone@.com",
      "two words@example.com",
      "someone@exa mple.com",
      "someone@example.com extra",
    ]) {
      expect(isValidEmail(address), address).toBe(false);
    }
  });

  it("rejects anything past the length the column accepts", () => {
    const domain = "@example.com";
    const atLimit = "a".repeat(MAX_EMAIL_LENGTH - domain.length) + domain;
    expect(atLimit).toHaveLength(MAX_EMAIL_LENGTH);
    expect(isValidEmail(atLimit)).toBe(true);
    expect(isValidEmail(`a${atLimit}`)).toBe(false);
  });
});

describe("emailValidationMessage", () => {
  it("stays quiet on an empty field, because that is not yet a mistake", () => {
    expect(emailValidationMessage("")).toBeNull();
    expect(emailValidationMessage("   ")).toBeNull();
  });

  it("stays quiet on a valid address", () => {
    expect(emailValidationMessage("someone@example.com")).toBeNull();
  });

  it("explains what is wrong with a malformed address", () => {
    expect(emailValidationMessage("someone@")).toMatch(/name@example\.com/);
  });

  it("names length as the problem when that is the problem", () => {
    expect(emailValidationMessage(`${"a".repeat(300)}@example.com`)).toMatch(/too long/);
  });
});

describe("parsePaymentStatus", () => {
  it("recognises the vocabulary the check constraint allows", () => {
    expect(parsePaymentStatus("awaiting_recipient_email")).toBe("awaiting_recipient_email");
    expect(parsePaymentStatus("email_received")).toBe("email_received");
    expect(parsePaymentStatus("not_required")).toBe("not_required");
    expect(parsePaymentStatus("reviewing_payment")).toBe("reviewing_payment");
    // The settled state, which replaces the invoice with a receipt.
    expect(parsePaymentStatus("paid")).toBe("paid");
  });

  it("treats anything else as not being in the flow", () => {
    for (const value of [null, undefined, "", "settled", "PAID", 7, {}]) {
      expect(parsePaymentStatus(value)).toBeNull();
    }
  });
});

describe("parsePaymentMethod", () => {
  it("recognises the configured method", () => {
    expect(parsePaymentMethod("BTC")).toBe("BTC");
  });

  it("treats anything else as no method on record", () => {
    for (const value of [null, undefined, "", "btc", "ETH", 7, {}]) {
      expect(parsePaymentMethod(value)).toBeNull();
    }
  });
});

describe("formatMoney", () => {
  it("prefixes the currency and groups the amount", () => {
    expect(formatMoney("USD", 1500)).toBe("USD 1,500");
    expect(formatMoney("USD", 1400)).toBe("USD 1,400");
    expect(formatMoney("USD", 100)).toBe("USD 100");
    expect(formatMoney("USD", 3000)).toBe("USD 3,000");
  });

  it("keeps two decimals only when the amount is fractional", () => {
    expect(formatMoney("USD", 12.5)).toBe("USD 12.50");
    expect(formatMoney("EUR", 0)).toBe("EUR 0");
  });

  it("upper-cases the code and survives a missing one", () => {
    expect(formatMoney("usd", 10)).toBe("USD 10");
    expect(formatMoney("", 10)).toBe("10");
  });

  it("never throws on a non-finite amount", () => {
    expect(formatMoney("USD", Number.NaN)).toBe("USD 0");
  });
});
