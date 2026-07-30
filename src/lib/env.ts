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

let cached: PublicEnv | null = null;

/** Where a resolved value came from. Reported by the health endpoint. */
export interface SupabaseEnvReport {
  configured: boolean;
  urlSource: string | null;
  keySource: string | null;
  /** Host only. Already public: it is in the browser bundle. Never the key. */
  host: string | null;
  problems: string[];
}

function resolve(): { env: PublicEnv | null; report: SupabaseEnvReport } {
  const bundled = fromBundle();

  const runtimeUrlName = URL_NAMES.find((name) => fromRuntime([name]));
  const runtimeKeyName = KEY_NAMES.find((name) => fromRuntime([name]));

  const url = fromRuntime(URL_NAMES) ?? bundled.url;
  const key = fromRuntime(KEY_NAMES) ?? bundled.key;

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
      const present = name.includes("URL") ? Boolean(url) : Boolean(key);
      return present ? `${name} ${issue.message}` : `${name} is not set`;
    });
    return {
      env: null,
      report: { configured: false, urlSource, keySource, host: null, problems },
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
    report: { configured: true, urlSource, keySource, host, problems: [] },
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
