import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { setArchivedAction } from "@/app/admin/(dashboard)/shipments/actions";
import { AddEventForm } from "@/components/admin/AddEventForm";
import { CopyButton } from "@/components/tracking/CopyButton";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Surface";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  EyeIcon,
  LockIcon,
  PencilIcon,
  RestoreIcon,
} from "@/components/ui/icons";
import { countryName } from "@/lib/countries";
import {
  canWrite,
  getShipmentById,
  getShipmentEvents,
  requireAdmin,
} from "@/lib/data/admin";
import { absoluteUrl } from "@/lib/env";
import {
  formatCalendarDate,
  formatDateTime,
  formatWeight,
  joinParts,
} from "@/lib/format";
import { SERVICE_LEVEL_LABELS } from "@/lib/tracking/shipment";
import { STATUS_META } from "@/lib/tracking/status";
import { formatTrackingId } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = { title: "Shipment" };

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const profile = await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;

  const shipment = await getShipmentById(id);
  if (!shipment) notFound();

  const events = await getShipmentEvents(shipment.id);
  const writable = canWrite(profile.role);
  const publicUrl = absoluteUrl(`/track/${shipment.tracking_id}`);

  const notice =
    flags.created === "1"
      ? "Shipment created. Add the first tracking event to make it visible on public tracking."
      : flags.saved === "1"
        ? "Changes saved."
        : flags.archived === "1"
          ? "Shipment archived. It no longer appears on public tracking."
          : flags.restored === "1"
            ? "Shipment restored. It is visible on public tracking again."
            : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/shipments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
        >
          <ChevronLeftIcon className="size-4" />
          Back to shipments
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-2xl font-bold tracking-tight text-ink-900"
                data-numeric
                data-testid="admin-tracking-id"
              >
                {formatTrackingId(shipment.tracking_id)}
              </h1>
              <StatusBadge status={shipment.status} />
              {shipment.archived_at ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                  <ArchiveIcon className="size-3.5" />
                  Archived
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-ink-600">
              {STATUS_META[shipment.status].description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              value={publicUrl}
              label="Copy public tracking link"
              copiedLabel="Link copied"
              variant="button"
            />

            {!shipment.archived_at ? (
              <ButtonLink
                href={`/track/${shipment.tracking_id}`}
                variant="secondary"
                size="md"
                target="_blank"
                rel="noreferrer"
              >
                <EyeIcon className="size-4" />
                View public page
              </ButtonLink>
            ) : null}

            {writable ? (
              <ButtonLink
                href={`/admin/shipments/${shipment.id}/edit`}
                size="md"
              >
                <PencilIcon className="size-4" />
                Edit
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>

      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {!writable ? (
        <Alert tone="info" title="Read-only access">
          You can view this shipment and its history. Adding events, editing and
          archiving are unavailable on your account.
        </Alert>
      ) : null}

      {shipment.archived_at ? (
        <Alert tone="warning" title="This shipment is archived">
          Public tracking returns nothing for this tracking number. The record
          and its history are retained for audit.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {writable && !shipment.archived_at ? (
            <AddEventForm
              shipmentId={shipment.id}
              defaultCity={shipment.destination_city}
              defaultCountry={shipment.destination_country}
            />
          ) : null}

          <Card>
            <CardHeader
              title="Tracking events"
              description={
                events.length === 0
                  ? "No events recorded yet."
                  : `${events.length} event${events.length === 1 ? "" : "s"}, newest first. Status and location are derived from the newest event.`
              }
            />

            {events.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">
                Nothing yet. Adding the first event makes this shipment visible
                on public tracking.
              </p>
            ) : (
              <ol className="divide-y divide-ink-100">
                {events.map((event) => (
                  <li key={event.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink-900">
                            {event.title}
                          </p>
                          <StatusBadge status={event.status} size="sm" />
                          {!event.is_public ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
                              <LockIcon className="size-3" />
                              Internal
                            </span>
                          ) : null}
                        </div>
                        {event.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-ink-600">
                            {event.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right text-sm">
                        <p className="text-ink-700">
                          <time dateTime={event.occurred_at}>
                            {formatDateTime(event.occurred_at)}
                          </time>
                        </p>
                        <p className="text-ink-500">
                          {joinParts([
                            event.facility_label,
                            event.city,
                            event.state,
                            event.country,
                          ]) || "No location"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Route" />
            <dl className="px-5 py-4">
              <DetailRow label="Origin">
                {joinParts([shipment.origin_city, shipment.origin_state])}
                <span className="block text-xs font-normal text-ink-500">
                  {countryName(shipment.origin_country)}
                </span>
              </DetailRow>
              <DetailRow label="Destination">
                {joinParts([
                  shipment.destination_city,
                  shipment.destination_state,
                ])}
                <span className="block text-xs font-normal text-ink-500">
                  {countryName(shipment.destination_country)}
                </span>
              </DetailRow>
              <DetailRow label="Delivery address">
                {joinParts([
                  shipment.destination_address_line1,
                  shipment.destination_address_line2,
                  shipment.destination_postal_code,
                ]) || "Not recorded"}
              </DetailRow>
              <DetailRow label="Current location">
                {shipment.current_location_label ?? "No scan yet"}
              </DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Parties"
              description="Contact details are never published."
            />
            <dl className="px-5 py-4">
              <DetailRow label="Sender">
                {shipment.sender_name ??
                  shipment.sender_company ??
                  "Not recorded"}
              </DetailRow>
              <DetailRow label="Sender contact">
                {joinParts(
                  [shipment.sender_email, shipment.sender_phone],
                  " - ",
                ) || "Not recorded"}
              </DetailRow>
              <DetailRow label="Recipient">
                {shipment.recipient_name ??
                  shipment.recipient_company ??
                  "Not recorded"}
              </DetailRow>
              <DetailRow label="Recipient contact">
                {joinParts(
                  [shipment.recipient_email, shipment.recipient_phone],
                  " - ",
                ) || "Not recorded"}
              </DetailRow>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Package and dates" />
            <dl className="px-5 py-4">
              <DetailRow label="Service">
                {SERVICE_LEVEL_LABELS[shipment.service_level]}
              </DetailRow>
              <DetailRow label="Package type">
                {shipment.package_type ?? "Not set"}
              </DetailRow>
              <DetailRow label="Pieces">{shipment.piece_count}</DetailRow>
              <DetailRow label="Weight">
                {formatWeight(shipment.weight_kg) ?? "Not recorded"}
              </DetailRow>
              <DetailRow label="Estimated delivery">
                {formatCalendarDate(shipment.estimated_delivery_date) ??
                  "Not set"}
                {shipment.estimated_delivery_window ? (
                  <span className="block text-xs font-normal text-ink-500">
                    {shipment.estimated_delivery_window}
                  </span>
                ) : null}
              </DetailRow>
              <DetailRow label="Created">
                <time dateTime={shipment.created_at}>
                  {formatDateTime(shipment.created_at)}
                </time>
              </DetailRow>
              <DetailRow label="Last updated">
                <time dateTime={shipment.updated_at}>
                  {formatDateTime(shipment.updated_at)}
                </time>
              </DetailRow>
            </dl>
          </Card>

          {shipment.internal_notes ? (
            <Card>
              <CardHeader
                title="Internal notes"
                description="Operations only."
              />
              <p className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
                {shipment.internal_notes}
              </p>
            </Card>
          ) : null}

          {writable ? (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink-900">
                {shipment.archived_at ? "Restore shipment" : "Archive shipment"}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {shipment.archived_at
                  ? "Restoring makes this tracking number resolve on the public site again."
                  : "Archiving removes this shipment from public tracking. Nothing is deleted, and it can be restored."}
              </p>

              <form action={setArchivedAction} className="mt-4">
                <input type="hidden" name="id" value={shipment.id} />
                <input
                  type="hidden"
                  name="archive"
                  value={shipment.archived_at ? "false" : "true"}
                />
                <Button
                  type="submit"
                  variant={shipment.archived_at ? "secondary" : "danger"}
                  size="md"
                >
                  {shipment.archived_at ? (
                    <>
                      <RestoreIcon className="size-4" />
                      Restore shipment
                    </>
                  ) : (
                    <>
                      <ArchiveIcon className="size-4" />
                      Archive shipment
                    </>
                  )}
                </Button>
              </form>
            </Card>
          ) : null}

          <Link
            href={`/track/${shipment.tracking_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Open the customer view
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink-800">
        {children}
      </dd>
    </div>
  );
}
