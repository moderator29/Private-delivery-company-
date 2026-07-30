import { beforeEach, describe, expect, it } from "vitest";

import { rateLimit, requestIdentifier, resetRateLimits } from "@/lib/rate-limit";

const OPTIONS = { bucket: "track", limit: 3, windowMs: 60_000 };

beforeEach(() => {
  resetRateLimits();
});

describe("rateLimit", () => {
  it("allows exactly the configured number of requests, then blocks", () => {
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(true);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(true);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(true);

    const blocked = rateLimit("visitor", OPTIONS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("counts down the remaining allowance", () => {
    expect(rateLimit("visitor", OPTIONS).remaining).toBe(2);
    expect(rateLimit("visitor", OPTIONS).remaining).toBe(1);
    expect(rateLimit("visitor", OPTIONS).remaining).toBe(0);
  });

  it("keeps blocking once over the limit", () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) rateLimit("visitor", OPTIONS);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(false);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(false);
  });

  it("reports a retry delay a caller can put in a message", () => {
    rateLimit("visitor", OPTIONS);
    const second = rateLimit("visitor", OPTIONS);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
    expect(second.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("keeps buckets independent, so tracking lookups do not throttle the contact form", () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) rateLimit("visitor", OPTIONS);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(false);

    expect(rateLimit("visitor", { ...OPTIONS, bucket: "contact" }).allowed).toBe(true);
  });

  it("keeps identifiers independent, so one visitor cannot throttle another", () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) rateLimit("visitor-a", OPTIONS);
    expect(rateLimit("visitor-a", OPTIONS).allowed).toBe(false);
    expect(rateLimit("visitor-b", OPTIONS).allowed).toBe(true);
  });

  it("starts a fresh window once the previous one has expired", () => {
    // A window of zero milliseconds has already expired by the next call.
    const instant = { ...OPTIONS, windowMs: 0 };
    expect(rateLimit("visitor", instant).allowed).toBe(true);
    expect(rateLimit("visitor", instant).allowed).toBe(true);
    expect(rateLimit("visitor", instant).allowed).toBe(true);
    expect(rateLimit("visitor", instant).allowed).toBe(true);
  });
});

describe("resetRateLimits", () => {
  it("clears every window so a test can start from a known state", () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) rateLimit("visitor", OPTIONS);
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(false);

    resetRateLimits();
    expect(rateLimit("visitor", OPTIONS).allowed).toBe(true);
  });
});

describe("requestIdentifier", () => {
  const withHeaders = (init: Record<string, string>) => requestIdentifier(new Headers(init));

  it("derives a stable key from the forwarded address", () => {
    const first = withHeaders({ "x-forwarded-for": "203.0.113.7" });
    const second = withHeaders({ "x-forwarded-for": "203.0.113.7" });
    expect(first).toBe(second);
    expect(first).toHaveLength(32);
  });

  it("gives different addresses different keys", () => {
    expect(withHeaders({ "x-forwarded-for": "203.0.113.7" })).not.toBe(
      withHeaders({ "x-forwarded-for": "203.0.113.8" }),
    );
  });

  it("never contains the raw address", () => {
    // Throttling state must not be reversible into a list of visitor IPs.
    const identifier = withHeaders({ "x-forwarded-for": "203.0.113.7" });
    expect(identifier).not.toContain("203.0.113.7");
    expect(identifier).not.toContain("203");
    expect(identifier).toMatch(/^[0-9a-f]{32}$/);
  });

  it("uses only the client address from a proxy chain", () => {
    const direct = withHeaders({ "x-forwarded-for": "203.0.113.7" });
    const chained = withHeaders({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" });
    expect(chained).toBe(direct);
  });

  it("ignores whitespace around the address", () => {
    expect(withHeaders({ "x-forwarded-for": "  203.0.113.7  " })).toBe(
      withHeaders({ "x-forwarded-for": "203.0.113.7" }),
    );
  });

  it("falls back to x-real-ip when there is no forwarding chain", () => {
    const real = withHeaders({ "x-real-ip": "203.0.113.7" });
    expect(real).toBe(withHeaders({ "x-forwarded-for": "203.0.113.7" }));
  });

  it("falls back to a shared unknown bucket when no address header is present", () => {
    // The conservative choice: unknown-origin requests are throttled together
    // rather than being let through unlimited.
    expect(requestIdentifier(new Headers())).toBe("unknown");
    expect(withHeaders({ "x-forwarded-for": "" })).toBe("unknown");
    expect(withHeaders({ "x-forwarded-for": "   " })).toBe("unknown");
  });
});
