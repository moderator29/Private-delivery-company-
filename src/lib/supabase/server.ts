import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Request scoped Supabase client that carries the operator's session.
 *
 * Uses the publishable key, so every query it makes is still subject to Row
 * Level Security. Nothing here can read a table the signed-in operator is not
 * permitted to read.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server components cannot set cookies. Session refresh happens in
            // middleware, which can, so ignoring this is safe and expected.
          }
        },
      },
    },
  );
}

/**
 * Anonymous client for the public tracking lookup. Deliberately carries no
 * session, so a signed-in operator viewing a public tracking page sees exactly
 * what a visitor sees.
 */
export function createSupabaseAnonClient() {
  const env = getSupabaseEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No session is established for public reads.
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
