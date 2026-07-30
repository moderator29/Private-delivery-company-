/**
 * Shipment list query shapes.
 *
 * These live outside src/lib/data/admin.ts because the filter controls are a
 * client component and that module is marked "server-only". Keeping the shared
 * constants here means the client can import them without dragging the data
 * layer, and its Supabase client, into the browser bundle.
 */

import type { ShipmentStatus } from "@/lib/tracking/status";

export const SHIPMENT_SORT_FIELDS = ["created_at", "updated_at", "estimated_delivery_date"] as const;
export type ShipmentSortField = (typeof SHIPMENT_SORT_FIELDS)[number];

export type ArchivedFilter = "active" | "archived" | "all";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface ShipmentListQuery {
  search?: string;
  status?: ShipmentStatus | "all";
  archived?: ArchivedFilter;
  sort?: ShipmentSortField;
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function isShipmentSortField(value: unknown): value is ShipmentSortField {
  return typeof value === "string" && (SHIPMENT_SORT_FIELDS as readonly string[]).includes(value);
}

export const SORT_LABELS: Record<ShipmentSortField, string> = {
  created_at: "Date created",
  updated_at: "Last updated",
  estimated_delivery_date: "Estimated delivery",
};
