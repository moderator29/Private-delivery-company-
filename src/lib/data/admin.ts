import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/types";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  isShipmentSortField,
  type ShipmentListQuery,
  type ShipmentSortField,
} from "@/lib/shipment-query";
import type { ShipmentStatus } from "@/lib/tracking/status";

export type AdminRole = Enums<"admin_role">;
export type ShipmentRow = Tables<"shipments">;
export type ShipmentEventRow = Tables<"shipment_events">;
export type AdminProfile = Tables<"admin_users">;

/**
 * Resolves the signed-in operator.
 *
 * Two conditions must both hold: a valid Supabase session, and an active row in
 * admin_users. Authenticating alone grants nothing, which is what makes a
 * leftover or self-registered auth account harmless.
 *
 * getUser() is used rather than getSession() because it validates the JWT with
 * the auth server instead of trusting the cookie contents.
 */
export async function getAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) return null;

  return profile;
}

/**
 * Server-side gate for every admin page and action.
 *
 * Middleware also redirects unauthenticated visitors away from /admin, but that
 * is a convenience for the user, not the security boundary. This check runs
 * inside the request that actually reads data, and RLS runs underneath it, so a
 * bypassed redirect still yields nothing.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

export function canWrite(role: AdminRole): boolean {
  return role === "owner" || role === "operator";
}

/** Thrown by actions when a viewer attempts a write. Rendered, never swallowed. */
export class PermissionDeniedError extends Error {
  constructor(message = "Your account has read-only access to this area.") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export async function requireWriteAccess(): Promise<AdminProfile> {
  const profile = await requireAdmin();
  if (!canWrite(profile.role)) throw new PermissionDeniedError();
  return profile;
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

export interface DashboardCounts {
  active: number;
  inTransit: number;
  outForDelivery: number;
  deliveredLast7Days: number;
  needsAttention: number;
  archived: number;
  total: number;
}

const ATTENTION_STATUSES: ShipmentStatus[] = ["delayed", "exception", "delivery_attempted"];
const MOVING_STATUSES: ShipmentStatus[] = ["picked_up", "in_transit", "arrived_at_facility"];

/**
 * Real counts, computed with head-only count queries so the dashboard never
 * transfers shipment rows it does not render.
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createSupabaseServerClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const countOf = async (build: (query: ReturnType<typeof baseQuery>) => unknown) => {
    const query = baseQuery();
    const { count, error } = (await build(query)) as { count: number | null; error: unknown };
    if (error) throw error;
    return count ?? 0;
  };

  function baseQuery() {
    return supabase.from("shipments").select("*", { count: "exact", head: true });
  }

  const [active, inTransit, outForDelivery, deliveredLast7Days, needsAttention, archived, total] =
    await Promise.all([
      countOf((q) => q.is("archived_at", null).not("status", "in", "(delivered,cancelled,returned)")),
      countOf((q) => q.is("archived_at", null).in("status", MOVING_STATUSES)),
      countOf((q) => q.is("archived_at", null).eq("status", "out_for_delivery")),
      countOf((q) => q.eq("status", "delivered").gte("delivered_at", sevenDaysAgo)),
      countOf((q) => q.is("archived_at", null).in("status", ATTENTION_STATUSES)),
      countOf((q) => q.not("archived_at", "is", null)),
      countOf((q) => q),
    ]);

  return {
    active,
    inTransit,
    outForDelivery,
    deliveredLast7Days,
    needsAttention,
    archived,
    total,
  };
}

// ---------------------------------------------------------------------------
// Shipment list
// ---------------------------------------------------------------------------

export interface ShipmentListResult {
  rows: ShipmentRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/**
 * Paginated, filterable shipment list.
 *
 * Search terms are passed as PostgREST filter values, not interpolated into SQL,
 * and commas are stripped because they would otherwise be read as filter
 * separators inside an `or` expression.
 */
export async function listShipments(query: ShipmentListQuery = {}): Promise<ShipmentListResult> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(5, Math.floor(query.pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  const sort: ShipmentSortField = isShipmentSortField(query.sort) ? query.sort : "created_at";
  const ascending = query.direction === "asc";

  let builder = supabase.from("shipments").select("*", { count: "exact" });

  const archived = query.archived ?? "active";
  if (archived === "active") builder = builder.is("archived_at", null);
  if (archived === "archived") builder = builder.not("archived_at", "is", null);

  if (query.status && query.status !== "all") {
    builder = builder.eq("status", query.status);
  }

  const search = query.search?.trim().replace(/[,()]/g, "");
  if (search) {
    const pattern = `%${search}%`;
    builder = builder.or(
      [
        `tracking_id.ilike.${pattern}`,
        `recipient_name.ilike.${pattern}`,
        `recipient_company.ilike.${pattern}`,
        `sender_name.ilike.${pattern}`,
        `sender_company.ilike.${pattern}`,
        `destination_city.ilike.${pattern}`,
        `origin_city.ilike.${pattern}`,
      ].join(","),
    );
  }

  const from = (page - 1) * pageSize;

  const { data, count, error } = await builder
    .order(sort, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw error;

  const total = count ?? 0;

  return {
    rows: data ?? [],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getShipmentById(id: string): Promise<ShipmentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getShipmentEvents(shipmentId: string): Promise<ShipmentEventRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface RecentActivityEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  entityType: string;
  createdAt: string;
  trackingId: string | null;
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, actor_email, entity_type, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const trackingId = typeof metadata.tracking_id === "string" ? metadata.tracking_id : null;
    return {
      id: row.id,
      action: row.action,
      actorEmail: row.actor_email,
      entityType: row.entity_type,
      createdAt: row.created_at,
      trackingId,
    };
  });
}
