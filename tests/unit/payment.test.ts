import { describe, expect, it } from "vitest";

import {
  MAX_EMAIL_LENGTH,
  emailValidationMessage,
  isValidEmail,
  normalizeEmail,
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
  });

  it("treats anything else as not being in the flow", () => {
    for (const value of [null, undefined, "", "paid", 7, {}]) {
      expect(parsePaymentStatus(value)).toBeNull();
    }
  });
});
