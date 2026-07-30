/**
 * Environment configuration.
 *
 * Two problems are solved here, both of which have caused a production outage
 * on this project.
 *
 * 1. Validation is lazy, on first use, not at module import. `next build`
 *    imports every module to collect page data, so validating at import turns a
 *    missing variable into a failed build rather than a clear runtime error.
 *
 * 2. Configuration is resolved at request time on the server, not only from the
 *    values baked into the bundle. Next.js inlines `NEXT_PUBLIC_*` by matching
 *    the literal text `process.env.NEXT_PUBLIC_...` during the build, so a
 *    variable added to the hosting platform afterwards has no effect until the
 *    next build. That is deeply unintuitive: you set the variable, you reload,
 *    and nothing changes. Server rendering has no such constraint — the real
 *    environment is right there — so on the server we read it dynamically and
 *    fall back to the inlined value. Public tracking renders on the server, so
 *    it starts working the moment the variable exists, with no redeploy.
 *
 * Several spellings are accepted for each value because Supabase itself has
 * used more than one name over time (publishable key, anon key) and a
 * deployment that names the variable slightly differently should work rather
 * than fail silently.
 *
 * The service role key is deliberately absent from this module. The application
 * never needs it.
 */

import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("must be a valid URL, for example https://abc.supabase.co"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "looks too short to be a valid key"),
});

export type PublicEnv = z.infer<typeof publicSchema>;

/** Accepted names for the project URL, most preferred first. */
const URL_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
] as const;

/** Accepted names for the browser-safe key, most preferred first. */
const KEY_NAMES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

/**
 * Reads the live environment by name.
 *
 * The dynamic index is the point of this function: it is what the build's
 * literal-text substitution cannot rewrite, so it sees the value the process
 * was actually started with. It is confined to the server because in the
 * browser `process.env` is a small object of inlined values and nothing else,
 * where this would always return undefined.
 */
function fromRuntime(names: readonly string[]): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const source = process.env as Record<string, string | undefined>;
  for (const name of names) {
    const value = source[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * The values compiled into this bundle.
 *
 * These have to be written out in full: the build matches the literal text, so
 * a dynamic lookup would leave the browser with nothing. This is the only path
 * available in a client component.
 */
function fromBundle(): { url?: string; key?: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    key: (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )?.trim(),
  };
}

/**
 * Coerces the ways a Supabase project URL actually gets pasted into a
 * configuration field into the one form the client library accepts.
 *
 * The dashboard shows the project reference on its own, the URL in the address
 * bar is the dashboard's own, and copying the API URL out of a terminal or a
 * chat message tends to lose the scheme or gain a pair of quotes. Every one of
 * those identifies the project unambiguously, and rejecting them buys nothing
 * except an outage that reads as "the tracking service is down".
 *
 * Anything unrecognised is returned untouched so validation can report it,
 * rather than being mangled into a URL that is valid and wrong.
 */
export function normalizeSupabaseUrl(
  raw: string | undefined,
): string | undefined {
  if (!raw) return undefined;

  const value = raw
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/+$/, "")
    .trim();

  if (!value) return undefined;

  // Never reshape something that looks like a credential. A JWT is dotted
  // alphanumerics and would otherwise satisfy the "host that lost its scheme"
  // rule below, which would put the key in a DNS query and a TLS SNI header on
  // every request. A key in this field is a mistake; it has to stay one.
  if (/^(?:sb_|eyJ)/.test(value)) return value;

  // A dashboard link rather than the API URL. The reference is the last
  // meaningful path segment.
  const dashboard = value.match(
    /^https?:\/\/(?:www\.)?supabase\.(?:com|io)\/dashboard\/project\/([a-z0-9]+)/i,
  );
  if (dashboard) return `https://${dashboard[1]}.supabase.co`;

  if (/^https?:\/\//i.test(value)) {
    // A full API URL with a path attached, such as the REST or auth base.
    // supabase-js wants the origin.
    try {
      const parsed = new URL(value);
      if (/\.supabase\.(co|in|red)$/i.test(parsed.hostname))
        return parsed.origin;
    } catch {
      // Fall through and let validation report it.
    }
    return value;
  }

  // The project reference on its own, as the dashboard displays it.
  if (/^[a-z0-9]{16,32}$/i.test(value)) return `https://${value}.supabase.co`;

  // A host that simply lost its scheme.
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?::\d+)?$/i.test(value))
    return `https://${value}`;

  return value;
}

/** True for values that are unmistakably a Supabase key rather than a URL. */
function looksLikeKey(value: string | undefined): boolean {
  return Boolean(value && /^(?:sb_(?:publishable|secret)_|eyJ)/.test(value));
}

/** True when the value resolves to something the client library can use. */
function looksLikeUrl(value: string | undefined): boolean {
  const normalized = normalizeSupabaseUrl(value);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Describes what is in the URL variable without ever repeating it.
 *
 * This is the difference between a diagnosis and a guess when the value cannot
 * be looked at directly. Echoing it is not an option: if a key has been pasted
 * into this field, printing it would publish the key on a URL anyone can open.
 */
export type UrlShape =
  | "ok"
  | "empty"
  | "looks-like-a-key"
  | "contains-whitespace"
  | "unrecognised";

function describeUrlShape(raw: string | undefined): UrlShape {
  if (!raw || !raw.trim()) return "empty";
  if (looksLikeKey(raw.trim())) return "looks-like-a-key";
  if (looksLikeUrl(raw)) return "ok";
  if (/\s/.test(raw.trim())) return "contains-whitespace";
  return "unrecognised";
}

let cached: PublicEnv | null = null;

/** Where a resolved value came from. Reported by the health endpoint. */
export interface SupabaseEnvReport {
  configured: boolean;
  urlSource: string | null;
  keySource: string | null;
  /** Host only. Already public: it is in the browser bundle. Never the key. */
  host: string | null;
  /**
   * Set when the configured value had to be reshaped to be usable, so the
   * health endpoint can say so and the variable can be tidied at leisure.
   */
  urlNormalized: boolean;
  /** What the URL variable holds, described without repeating its value. */
  urlShape: UrlShape;
  /** Set when the two variables held each other's values and were swapped. */
  swapped: boolean;
  problems: string[];
}

function resolve(): { env: PublicEnv | null; report: SupabaseEnvReport } {
  const bundled = fromBundle();

  const runtimeUrlName = URL_NAMES.find((name) => fromRuntime([name]));
  const runtimeKeyName = KEY_NAMES.find((name) => fromRuntime([name]));

  let configuredUrl = fromRuntime(URL_NAMES) ?? bundled.url;
  let key = fromRuntime(KEY_NAMES) ?? bundled.key;

  // The two variables holding each other's values is a common and completely
  // unambiguous mistake: a key is never a URL and a URL is never a key. It is
  // also invisible from the outside, because a project URL is comfortably
  // longer than the key's minimum length and so passes that check in silence.
  // Correcting it here beats failing with a message that points at the URL
  // when both variables are wrong.
  const swapped = looksLikeKey(configuredUrl) && looksLikeUrl(key);
  if (swapped) {
    const held = configuredUrl;
    configuredUrl = key;
    key = held;
  }

  const urlShape = describeUrlShape(configuredUrl);
  const url = normalizeSupabaseUrl(configuredUrl);
  const urlNormalized = Boolean(configuredUrl) && url !== configuredUrl;

  const urlSource =
    runtimeUrlName ?? (bundled.url ? "bundled NEXT_PUBLIC_SUPABASE_URL" : null);
  const keySource =
    runtimeKeyName ??
    (bundled.key ? "bundled NEXT_PUBLIC_SUPABASE_*_KEY" : null);

  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  });

  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => {
      const name = String(issue.path[0]);
      const isUrl = name.includes("URL");
      const present = isUrl ? Boolean(configuredUrl) : Boolean(key);
      if (!present) return `${name} is not set`;
      if (isUrl) {
        // The value exists but is not usable. Say what is wrong with it in
        // terms of its shape, never by repeating it: if a key has been pasted
        // into this field, echoing it here would publish the key.
        if (urlShape === "looks-like-a-key") {
          return (
            `${name} holds a Supabase key, not a URL. Put the project API URL here ` +
            `(https://<project-ref>.supabase.co) and the key in ` +
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.`
          );
        }
        if (urlShape === "contains-whitespace") {
          return (
            `${name} is set but contains a space or a line break, so it is not a valid URL. ` +
            `Re-paste it as a single unbroken value.`
          );
        }
        return (
          `${name} is set but ${issue.message}. It should be the project API URL, ` +
          `for example https://abcdefghijklmnopqrst.supabase.co - not the dashboard link, ` +
          `and not a key.`
        );
      }
      return `${name} ${issue.message}`;
    });
    return {
      env: null,
      report: {
        configured: false,
        urlSource,
        keySource,
        host: null,
        urlNormalized,
        urlShape,
        swapped,
        problems,
      },
    };
  }

  let host: string | null = null;
  try {
    host = new URL(parsed.data.NEXT_PUBLIC_SUPABASE_URL).host;
  } catch {
    // Already validated as a URL; this cannot realistically fail.
  }

  return {
    env: parsed.data,
    report: {
      configured: true,
      urlSource,
      keySource,
      host,
      urlNormalized,
      urlShape,
      swapped,
      problems: [],
    },
  };
}

/**
 * Returns the Supabase configuration, throwing a message that names what is
 * missing and where to set it.
 *
 * A successful result is cached; a failure is not, so a serverless instance
 * that starts before the variables are set recovers on a later request instead
 * of staying broken for its whole lifetime.
 */
export function getSupabaseEnv(): PublicEnv {
  if (cached) return cached;

  const { env, report } = resolve();

  if (!env) {
    throw new Error(
      `Supabase environment configuration is incomplete.\n` +
        report.problems.map((problem) => `  - ${problem}`).join("\n") +
        `\n\nSet NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your ` +
        `hosting platform's environment variables, or copy .env.example to .env.local for ` +
        `local development. On the server these are read at request time, so a redeploy is ` +
        `not required; the browser bundle still needs a rebuild to pick them up.`,
    );
  }

  cached = env;
  return cached;
}

/** Non-throwing view of the same resolution, for diagnostics. */
export function describeSupabaseEnv(): SupabaseEnvReport {
  return resolve().report;
}

/**
 * Public origin of the deployment.
 *
 * Read without validation and with a sensible default, because it is used by
 * metadata at module scope on every page. A wrong value produces a wrong
 * canonical URL, which is worth a warning rather than a failed build. On the
 * platform's own domain VERCEL_PROJECT_PRODUCTION_URL is a better guess than
 * localhost when nothing is configured.
 */
function resolveSiteUrl(): string {
  const configured =
    fromRuntime(["NEXT_PUBLIC_SITE_URL", "SITE_URL"]) ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const platform = fromRuntime(["VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"]);
  if (platform)
    return `https://${platform.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** Absolute URL builder for canonical links, sitemap entries and share links. */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${suffix}`;
}
