import "server-only";

import { createHash } from "node:crypto";

/**
 * Fixed window rate limiter for public endpoints.
 *
 * Scope and limitation, stated plainly: this counter lives in the memory of a
 * single server instance. It stops casual scraping and form spam from one
 * address, and it is the right amount of machinery for an MVP running on one
 * instance. It is not a distributed limiter. Behind multiple instances or on a
 * serverless platform that spawns many isolates, each instance keeps its own
 * count, so the effective limit multiplies by the instance count. Moving to a
 * shared store is the documented next step in docs/SECURITY.md.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Keeps the map from growing without bound on a long running instance. */
function evictExpired(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitOptions {
  /** Distinguishes counters, for example "track" and "contact". */
  bucket: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets, for a Retry-After style message. */
  retryAfterSeconds: number;
}

export function rateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  evictExpired(now);

  const key = `${options.bucket}:${identifier}`;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > options.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds,
  };
}

/**
 * Derives a stable but non-identifying key from request headers.
 *
 * The address is hashed rather than stored, so throttling state cannot be turned
 * back into a list of visitor IP addresses. Falls back to a shared bucket when
 * no forwarding header is present, which is the conservative choice: an
 * unknown-origin request is throttled together with other unknowns rather than
 * being let through unlimited.
 */
export function requestIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";

  if (!candidate) return "unknown";
  return createHash("sha256").update(candidate).digest("hex").slice(0, 32);
}

/** Exposed for tests so a case can start from a known state. */
export function resetRateLimits() {
  windows.clear();
}
