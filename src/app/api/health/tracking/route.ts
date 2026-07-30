import { NextResponse } from "next/server";

import { describeSupabaseEnv } from "@/lib/env";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

/**
 * Diagnostic endpoint for the public tracking path.
 *
 * "We could not reach the tracking service" is the right message for a
 * customer and a useless one for whoever has to fix it: a missing variable, a
 * variable under a different name, a wrong project URL and a revoked grant all
 * look identical from the outside. This says which.
 *
 * It exposes nothing sensitive. The project host is already in the browser
 * bundle, the key is never read here in any form, and the probe uses a tracking
 * number that cannot exist, so it reveals nothing about real shipments. What
 * comes back is the shape of the configuration and the database's own error
 * code.
 */

// Configuration is read per request, so this must never be cached or
// prerendered — a cached "not configured" would outlive the fix.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// A well formed tracking number that the format allows and no shipment uses.
// track_shipment() validates the format before touching the table, so this
// exercises the whole path and still returns nothing.
const PROBE_ID = "ST0000000000ZZ";

export async function GET() {
  const env = describeSupabaseEnv();

  const body: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    configured: env.configured,
    urlSource: env.urlSource,
    keySource: env.keySource,
    supabaseHost: env.host,
    problems: env.problems,
  };

  if (!env.configured) {
    body.tracking = "unavailable";
    body.hint =
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY on the hosting platform. " +
      "Server rendering reads them per request, so this endpoint reflects a change without a redeploy.";
    return json(body, 503);
  }

  try {
    const supabase = createSupabaseAnonClient();
    const { error } = await supabase.rpc("track_shipment", {
      p_tracking_id: PROBE_ID,
    });

    if (error) {
      body.tracking = "failed";
      body.error = { code: error.code ?? null, message: error.message };
      body.hint =
        error.code === "PGRST202"
          ? "The database has no track_shipment function. Apply supabase/migrations in order."
          : "The project answered but refused the call. Check that migration 0004 granted execute on track_shipment to anon.";
      return json(body, 503);
    }

    body.tracking = "ok";
    return json(body, 200);
  } catch (cause) {
    body.tracking = "unreachable";
    body.error = {
      message: cause instanceof Error ? cause.message : "Unknown error",
    };
    body.hint =
      "The project URL resolved but could not be reached. Check it names a live project.";
    return json(body, 503);
  }
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
