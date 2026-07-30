import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { describeSupabaseEnv, normalizeSupabaseUrl } from "@/lib/env";

/**
 * These cases are not hypothetical. A deployment went out with a project URL
 * the client library refused, and the only symptom a customer saw was
 * "Tracking is temporarily unavailable". Each shape below identifies the
 * project unambiguously, so each one is accepted.
 */
describe("normalizeSupabaseUrl", () => {
  const canonical = "https://fdozazcubtreeaukjtot.supabase.co";

  it("leaves a correct API URL alone", () => {
    expect(normalizeSupabaseUrl(canonical)).toBe(canonical);
  });

  it("adds the scheme when a host was pasted without one", () => {
    expect(normalizeSupabaseUrl("fdozazcubtreeaukjtot.supabase.co")).toBe(
      canonical,
    );
  });

  it("expands the project reference on its own", () => {
    expect(normalizeSupabaseUrl("fdozazcubtreeaukjtot")).toBe(canonical);
  });

  it("recognises a dashboard link and recovers the project", () => {
    expect(
      normalizeSupabaseUrl(
        "https://supabase.com/dashboard/project/fdozazcubtreeaukjtot",
      ),
    ).toBe(canonical);
    expect(
      normalizeSupabaseUrl(
        "https://supabase.com/dashboard/project/fdozazcubtreeaukjtot/settings/api",
      ),
    ).toBe(canonical);
  });

  it("reduces an API URL that carries a path to its origin", () => {
    expect(normalizeSupabaseUrl(`${canonical}/rest/v1`)).toBe(canonical);
    expect(normalizeSupabaseUrl(`${canonical}/auth/v1/token`)).toBe(canonical);
  });

  it("strips quotes, surrounding space and trailing slashes", () => {
    expect(normalizeSupabaseUrl(`  "${canonical}/"  `)).toBe(canonical);
    expect(normalizeSupabaseUrl(`'${canonical}'`)).toBe(canonical);
  });

  it("treats an empty or absent value as absent", () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined();
    expect(normalizeSupabaseUrl("   ")).toBeUndefined();
    expect(normalizeSupabaseUrl('""')).toBeUndefined();
  });

  it("does not invent a URL from something unrecognisable", () => {
    // Returned untouched so validation reports it, rather than being reshaped
    // into something valid and wrong that fails later and further away.
    expect(normalizeSupabaseUrl("not a url at all")).toBe("not a url at all");
  });

  it("does not mistake a key for a project reference", () => {
    // A key pasted into the URL field must stay invalid. Silently turning one
    // into https://<key>.supabase.co would send the key out as a hostname.
    const publishable = "sb_publishable_0123456789abcdefghij";
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature";

    expect(normalizeSupabaseUrl(publishable)).toBe(publishable);
    expect(normalizeSupabaseUrl(jwt)).toBe(jwt);
  });

  it("preserves a local development URL, scheme and all", () => {
    expect(normalizeSupabaseUrl("http://127.0.0.1:54321")).toBe(
      "http://127.0.0.1:54321",
    );
  });

  it("does not guess a scheme for a bare address", () => {
    // Only a hostname with a real suffix gets https:// added. A bare address
    // is ambiguous, and local development is served over http, so assuming
    // https here would break the case it appears to help.
    expect(normalizeSupabaseUrl("127.0.0.1:54321")).toBe("127.0.0.1:54321");
  });
});

/**
 * describeSupabaseEnv() reads the live environment, so these set and restore it
 * around each case rather than mutating it for the whole file.
 */
describe("describeSupabaseEnv", () => {
  const NAMES = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ];

  const url = "https://fdozazcubtreeaukjtot.supabase.co";
  const key = "sb_publishable_0123456789abcdefghij";
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]));
    for (const name of NAMES) delete process.env[name];
  });

  afterEach(() => {
    for (const name of NAMES) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  it("reports a healthy configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;

    const report = describeSupabaseEnv();
    expect(report.configured).toBe(true);
    expect(report.urlShape).toBe("ok");
    expect(report.swapped).toBe(false);
    expect(report.host).toBe("fdozazcubtreeaukjtot.supabase.co");
  });

  it("recovers when the two variables hold each other's values", () => {
    // A project URL is longer than the key's minimum length, so a swap passes
    // the key check in silence and only the URL looks wrong. Both are wrong.
    process.env.NEXT_PUBLIC_SUPABASE_URL = key;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = url;

    const report = describeSupabaseEnv();
    expect(report.swapped).toBe(true);
    expect(report.configured).toBe(true);
    expect(report.host).toBe("fdozazcubtreeaukjtot.supabase.co");
  });

  it("names a key in the URL field without repeating it", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = key;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;

    const report = describeSupabaseEnv();
    expect(report.configured).toBe(false);
    expect(report.urlShape).toBe("looks-like-a-key");
    expect(report.problems.join(" ")).toContain("holds a Supabase key");
    // The whole point: the value must never appear in the output.
    expect(report.problems.join(" ")).not.toContain(key);
  });

  it("calls out a value broken by a space or line break", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fdozazcubtreeaukjtot .supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;

    const report = describeSupabaseEnv();
    expect(report.configured).toBe(false);
    expect(report.urlShape).toBe("contains-whitespace");
    expect(report.problems.join(" ")).toContain("space or a line break");
  });

  it("reports which variable name each value came from", () => {
    process.env.SUPABASE_URL = url;
    process.env.SUPABASE_ANON_KEY = key;

    const report = describeSupabaseEnv();
    expect(report.configured).toBe(true);
    expect(report.urlSource).toBe("SUPABASE_URL");
    expect(report.keySource).toBe("SUPABASE_ANON_KEY");
  });
});
