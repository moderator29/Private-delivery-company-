/**
 * Environment configuration.
 *
 * Validated lazily, on first use, rather than at module import.
 *
 * That distinction matters: `next build` imports every module to collect page
 * data, so validating at import time turns a missing variable into a failed
 * build on the hosting platform rather than a clear error at runtime. A build
 * should succeed with the code it was given; a request that genuinely needs a
 * Supabase connection is where a missing key should surface.
 *
 * Only NEXT_PUBLIC_* values may be read in client components. The service role
 * key is deliberately absent from this module: the application never needs it.
 */

import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short to be valid"),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | null = null;

/**
 * Returns the validated Supabase configuration, throwing a message that names
 * what is missing and where to set it.
 *
 * These references must be written out in full rather than looked up
 * dynamically: Next.js inlines NEXT_PUBLIC_* variables by matching the literal
 * text `process.env.NEXT_PUBLIC_...` at build time, so `process.env[name]`
 * would silently be undefined in the browser bundle.
 */
export function getSupabaseEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Supabase environment configuration is incomplete.\n${details}\n\n` +
        "Set these in your hosting platform's environment variables, or copy .env.example to .env.local for local development.",
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * Public origin of the deployment.
 *
 * Read without validation and with a sensible default, because it is used by
 * metadata at module scope on every page. A wrong value produces a wrong
 * canonical URL, which is worth a warning rather than a failed build.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** Absolute URL builder for canonical links, sitemap entries and share links. */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${suffix}`;
}
