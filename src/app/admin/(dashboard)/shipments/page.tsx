import type { Metadata } from "next";
import Link from "next/link";

import { ShipmentFilters } from "@/components/admin/ShipmentFilters";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surface";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArchiveIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { formatCalendarDate, formatDateTime } from "@/lib/format";
import { canWrite, listShipments, requireAdmin } from "@/lib/data/admin";
import {
  DEFAULT_PAGE_SIZE,
  isShipmentSortField,
  type ShipmentSortField,
} from "@/lib/shipment-query";
import { isShipmentStatus, type ShipmentStatus } from "@/lib/tracking/status";
import { formatTrackingId } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = { title: "Shipments" };

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const profile = await requireAdmin();
  const params = await searchParams;

  const search = single(params.q)?.trim() ?? "";
  const statusParam = single(params.status);
  const status: ShipmentStatus | "all" = isShipmentStatus(statusParam) ? statusParam : "all";

  const archivedParam = single(params.archived);
  const archived: "active" | "archived" | "all" =
    archivedParam === "archived" || archivedParam === "all" ? archivedParam : "active";

  const sortParam = single(params.sort);
  const sort: ShipmentSortField = isShipmentSortField(sortParam) ? sortParam : "created_at";

  const direction = single(params.dir) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(single(params.page) ?? "1", 10) || 1);

  const result = await listShipments({
    search,
    status,
    archived,
    sort,
    direction,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const writable = canWrite(profile.role);

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status !== "all") next.set("status", status);
    if (archived !== "active") next.set("archived", archived);
    if (sort !== "created_at") next.set("sort", sort);
    if (direction !== "desc") next.set("dir", direction);
    if (page > 1) next.set("page", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }

    const query = next.toString();
    return query ? `/admin/shipments?${query}` : "/admin/shipments";
  };

  const from = (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Shipments</h1>
          <p className="mt-1 text-sm text-ink-600">
            {result.total === 0
              ? "No shipments match these filters."
              : `${result.total} shipment${result.total === 1 ? "" : "s"} match these filters.`}
          </p>
        </div>

        {writable ? (
          <ButtonLink href="/admin/shipments/new" size="md">
            <PlusIcon className="size-4" />
            New shipment
          </ButtonLink>
        ) : null}
      </div>

      <ShipmentFilters
        search={search}
        status={status}
        archived={archived}
        sort={sort}
        direction={direction}
      />

      {result.rows.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-base font-semibold text-ink-800">Nothing here</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            {search || status !== "all" || archived !== "active"
              ? "No shipment matches the current search and filters. Try clearing them."
              : "No shipments have been created yet."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {search || status !== "all" || archived !== "active" ? (
              <ButtonLink href="/admin/shipments" variant="secondary" size="md">
                Clear filters
              </ButtonLink>
            ) : null}
            {writable ? (
              <ButtonLink href="/admin/shipments/new" size="md">
                Create a shipment
              </ButtonLink>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Table on wide screens, stacked cards on narrow ones. Both render the
              same data; neither is hidden content for the other. */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-xs tracking-wide text-ink-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Tracking ID
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Route
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Recipient
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Est. delivery
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {result.rows.map((shipment) => (
                  <tr key={shipment.id} className="transition-colors hover:bg-ink-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/shipments/${shipment.id}`}
                        className="font-semibold text-ink-900 hover:text-brand-600"
                        data-numeric
                      >
                        {formatTrackingId(shipment.tracking_id)}
                      </Link>
                      {shipment.archived_at ? (
                        <span className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                          <ArchiveIcon className="size-3.5" />
                          Archived
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {shipment.origin_city} to {shipment.destination_city}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {shipment.recipient_name ?? shipment.recipient_company ?? "Not recorded"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={shipment.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {formatCalendarDate(shipment.estimated_delivery_date) ?? "Not set"}
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">
                      <time dateTime={shipment.updated_at}>
                        {formatDateTime(shipment.updated_at)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-ink-100 lg:hidden">
            {result.rows.map((shipment) => (
              <li key={shipment.id}>
                <Link
                  href={`/admin/shipments/${shipment.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-ink-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-ink-900" data-numeric>
                      {formatTrackingId(shipment.tracking_id)}
                    </span>
                    <StatusBadge status={shipment.status} size="sm" />
                  </div>
                  <p className="text-sm text-ink-600">
                    {shipment.origin_city} to {shipment.destination_city}
                  </p>
                  <p className="text-sm text-ink-500">
                    {shipment.recipient_name ?? shipment.recipient_company ?? "Recipient not recorded"}
                  </p>
                  <p className="text-xs text-ink-400">
                    Updated{" "}
                    <time dateTime={shipment.updated_at}>
                      {formatDateTime(shipment.updated_at)}
                    </time>
                    {shipment.archived_at ? " - archived" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {result.pageCount > 1 ? (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-ink-50 px-5 py-3"
            >
              <p className="text-sm text-ink-600">
                Showing {from} to {to} of {result.total}
              </p>
              <div className="flex items-center gap-2">
                {result.page > 1 ? (
                  <ButtonLink
                    href={buildHref({ page: result.page - 1 })}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronLeftIcon className="size-4" />
                    Previous
                  </ButtonLink>
                ) : null}
                <span className="px-2 text-sm text-ink-500">
                  Page {result.page} of {result.pageCount}
                </span>
                {result.page < result.pageCount ? (
                  <ButtonLink
                    href={buildHref({ page: result.page + 1 })}
                    variant="secondary"
                    size="sm"
                  >
                    Next
                    <ChevronRightIcon className="size-4" />
                  </ButtonLink>
                ) : null}
              </div>
            </nav>
          ) : null}
        </Card>
      )}
    </div>
  );
}
