/**
 * Environment configuration.
 *
 * Validated once, at the edge of the application, so a missing variable fails
 * with a clear message instead of an opaque runtime error deep in a request.
 *
 * Only NEXT_PUBLIC_* values may be read in client components. The service role
 * key is intentionally absent from this module: it is read exclusively by
 * src/lib/supabase/service.ts, which is server-only.
 */

import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short to be valid"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

function readPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `  - ${issue.message}`).join("\n");
    throw new Error(
      `Environment configuration is incomplete.\n${details}\n\nCopy .env.example to .env.local and fill in the values.`,
    );
  }

  return parsed.data;
}

export const env = readPublicEnv();

/** Absolute URL builder for canonical links, sitemap entries and share links. */
export function absoluteUrl(path = "/"): string {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
