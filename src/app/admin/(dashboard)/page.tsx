import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Surface";
import {
  AlertIcon,
  ArchiveIcon,
  ArrowRightIcon,
  BoxIcon,
  CheckCircleIcon,
  PlaneIcon,
  PlusIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import {
  canWrite,
  getDashboardCounts,
  getRecentActivity,
  listShipments,
  requireAdmin,
} from "@/lib/data/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTrackingId } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = { title: "Overview" };

/** Counts change as operators work, so this is never cached. */
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "shipments.created": "created a shipment",
  "shipments.updated": "updated a shipment",
  "shipments.archived": "archived a shipment",
  "shipments.restored": "restored a shipment",
  "shipments.status_changed": "changed a shipment status",
  "shipment_events.created": "added a tracking event",
  "shipment_events.updated": "edited a tracking event",
  "shipment_events.deleted": "removed a tracking event",
};

export default async function AdminOverviewPage() {
  const profile = await requireAdmin();

  // Fetched together: three independent reads, one round trip of latency.
  const [counts, recent, activity] = await Promise.all([
    getDashboardCounts(),
    listShipments({ pageSize: 6, sort: "updated_at", direction: "desc" }),
    getRecentActivity(6),
  ]);

  const writable = canWrite(profile.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {profile.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Live counts from the operational database.
          </p>
        </div>

        {writable ? (
          <ButtonLink href="/admin/shipments/new" size="md">
            <PlusIcon className="size-4" />
            New shipment
          </ButtonLink>
        ) : null}
      </div>

      {!writable ? (
        <Card className="flex items-start gap-3 border-warn-100 bg-warn-50 p-4">
          <AlertIcon className="mt-0.5 size-5 shrink-0 text-warn-600" />
          <p className="text-sm text-warn-700">
            Your account has read-only access. You can view shipments and their history, but the
            create, edit and archive actions are unavailable.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active shipments"
          value={counts.active}
          icon={<BoxIcon className="size-5" />}
          href="/admin/shipments?archived=active"
          tone="default"
        />
        <StatCard
          label="In the network"
          value={counts.inTransit}
          icon={<PlaneIcon className="size-5" />}
          href="/admin/shipments?status=in_transit"
          tone="info"
        />
        <StatCard
          label="Out for delivery"
          value={counts.outForDelivery}
          icon={<TruckIcon className="size-5" />}
          href="/admin/shipments?status=out_for_delivery"
          tone="info"
        />
        <StatCard
          label="Needs attention"
          value={counts.needsAttention}
          icon={<AlertIcon className="size-5" />}
          href="/admin/shipments?status=exception"
          tone={counts.needsAttention > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Delivered, last 7 days"
          value={counts.deliveredLast7Days}
          icon={<CheckCircleIcon className="size-5" />}
          href="/admin/shipments?status=delivered"
          tone="success"
        />
        <StatCard
          label="Archived"
          value={counts.archived}
          icon={<ArchiveIcon className="size-5" />}
          href="/admin/shipments?archived=archived"
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Recently updated"
            description="The six shipments touched most recently."
            action={
              <Link
                href="/admin/shipments"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                All shipments
                <ArrowRightIcon className="size-4" />
              </Link>
            }
          />

          {recent.rows.length === 0 ? (
            <EmptyState
              title="No shipments yet"
              body={
                writable
                  ? "Create the first shipment to see it appear here."
                  : "Shipments appear here once an operator creates them."
              }
              action={writable ? { href: "/admin/shipments/new", label: "Create a shipment" } : undefined}
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.rows.map((shipment) => (
                <li key={shipment.id}>
                  <Link
                    href={`/admin/shipments/${shipment.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900" data-numeric>
                        {formatTrackingId(shipment.tracking_id)}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-ink-500">
                        {shipment.origin_city} to {shipment.destination_city}
                        {shipment.recipient_name ? ` - ${shipment.recipient_name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={shipment.status} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" description="From the audit log." />

          {activity.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="Every create, update and archive by an operator is written here."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {activity.map((entry) => (
                <li key={entry.id} className="px-5 py-3.5">
                  <p className="text-sm text-ink-800">
                    <span className="font-semibold">{entry.actorEmail ?? "System"}</span>{" "}
                    {ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.trackingId ? (
                      <>
                        {" "}
                        <span className="font-semibold" data-numeric>
                          {formatTrackingId(entry.trackingId)}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

const STAT_TONES = {
  default: "bg-ink-100 text-ink-600",
  info: "bg-sky-accent-50 text-sky-accent-600",
  warn: "bg-warn-50 text-warn-600",
  success: "bg-go-50 text-go-600",
} as const;

function StatCard({
  label,
  value,
  icon,
  href,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-ink-200 bg-white p-5 shadow-card transition-colors hover:border-ink-300"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex size-10 items-center justify-center rounded-control ${STAT_TONES[tone]}`}>
          {icon}
        </span>
        <ArrowRightIcon className="size-4 text-ink-300 transition-colors group-hover:text-brand-600" />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink-900" data-numeric>
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </Link>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{body}</p>
      {action ? (
        <ButtonLink href={action.href} variant="secondary" size="sm" className="mt-4">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
