"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Select, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { SHIPMENT_STATUSES, STATUS_META } from "@/lib/tracking/status";
import {
  SHIPMENT_SORT_FIELDS,
  SORT_LABELS,
  type ShipmentSortField,
} from "@/lib/shipment-query";

/**
 * Filters drive the URL rather than component state, so a filtered view is
 * shareable, bookmarkable and survives a refresh. The form also submits with
 * GET, so it works without JavaScript.
 */
export function ShipmentFilters({
  search,
  status,
  archived,
  sort,
  direction,
}: {
  search: string;
  status: string;
  archived: string;
  sort: ShipmentSortField;
  direction: "asc" | "desc";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(search);

  // Keeps the field in step when the URL changes from elsewhere, such as the
  // browser back button or a dashboard stat card link.
  useEffect(() => {
    setTerm(search);
  }, [search]);

  function apply(overrides: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (!value || value === "all" || value === "active") next.delete(key);
      else next.set(key, value);
    }
    // Any filter change invalidates the current page number.
    next.delete("page");
    const query = next.toString();
    router.push(query ? `/admin/shipments?${query}` : "/admin/shipments");
  }

  const hasFilters =
    Boolean(search) || status !== "all" || archived !== "active" || sort !== "created_at";

  return (
    <form
      method="get"
      action="/admin/shipments"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ q: term.trim() });
      }}
      className="flex flex-col gap-3 rounded-card border border-ink-200 bg-white p-4 shadow-card lg:flex-row lg:items-end"
    >
      <div className="flex-1">
        <label htmlFor="shipment-search" className="text-sm font-medium text-ink-700">
          Search
        </label>
        <div className="relative mt-1.5">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink-400" />
          <TextInput
            id="shipment-search"
            name="q"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Tracking ID, recipient, sender or city"
            className="pl-11"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="filter-status" className="text-sm font-medium text-ink-700">
            Status
          </label>
          <Select
            id="filter-status"
            name="status"
            value={status}
            onChange={(event) => apply({ status: event.target.value })}
            className="mt-1.5"
          >
            <option value="all">All statuses</option>
            {SHIPMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-archived" className="text-sm font-medium text-ink-700">
            Visibility
          </label>
          <Select
            id="filter-archived"
            name="archived"
            value={archived}
            onChange={(event) => apply({ archived: event.target.value })}
            className="mt-1.5"
          >
            <option value="active">Active only</option>
            <option value="archived">Archived only</option>
            <option value="all">Active and archived</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="text-sm font-medium text-ink-700">
            Sort by
          </label>
          <Select
            id="filter-sort"
            name="sort"
            value={`${sort}:${direction}`}
            onChange={(event) => {
              const [nextSort, nextDirection] = event.target.value.split(":");
              apply({ sort: nextSort, dir: nextDirection });
            }}
            className="mt-1.5"
          >
            {SHIPMENT_SORT_FIELDS.map((field) =>
              (["desc", "asc"] as const).map((dir) => (
                <option key={`${field}:${dir}`} value={`${field}:${dir}`}>
                  {SORT_LABELS[field]}, {dir === "desc" ? "newest first" : "oldest first"}
                </option>
              )),
            )}
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setTerm("");
              router.push("/admin/shipments");
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}
