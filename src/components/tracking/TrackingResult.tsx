import type { ReactNode } from "react";

import { CopyButton } from "@/components/tracking/CopyButton";
import { InvoiceCard } from "@/components/tracking/InvoiceCard";
import { ParcelIllustration } from "@/components/tracking/ParcelIllustration";
import { ProgressTimeline } from "@/components/tracking/ProgressTimeline";
import { RatingCard } from "@/components/tracking/RatingCard";
import { RecipientEmailCard } from "@/components/tracking/RecipientEmailCard";
import { RouteMap } from "@/components/tracking/RouteMap";
import { Alert } from "@/components/ui/Alert";
import { Flag } from "@/components/ui/Flag";
import { Card, CardHeader } from "@/components/ui/Surface";
import {
  BoxIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PlaneIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/ui/icons";
import { absoluteUrl } from "@/lib/env";
import {
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatDaysLabel,
  formatWeight,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { PAYMENT_METHOD_LABELS } from "@/lib/tracking/payment";
import type { TrackedShipment } from "@/lib/tracking/shipment";
import {
  STATUS_META,
  isMoving,
  needsAttention,
  type StatusTone,
} from "@/lib/tracking/status";
import { formatTrackingId } from "@/lib/tracking/tracking-id";

export function TrackingResult({
  shipment,
  rating,
}: {
  shipment: TrackedShipment;
  rating: { canRate: boolean; rated: boolean; stars: number | null };
}) {
  const meta = STATUS_META[shipment.status];
  const shareUrl = absoluteUrl(`/track/${shipment.trackingId}`);
  const delivered = shipment.status === "delivered";

  // The recipient payment flow. The email step runs while an address is being
  // collected; once it is in (email_received), and from then on, the invoice and
  // payment step take over. "reviewing_payment" is still past the email step, so
  // the email card stays in its received state rather than asking again.
  const emailStep =
    shipment.paymentStatus === "awaiting_recipient_email" ||
    shipment.paymentStatus === "email_received" ||
    shipment.paymentStatus === "reviewing_payment";
  const emailReceived =
    shipment.paymentStatus === "email_received" ||
    shipment.paymentStatus === "reviewing_payment";
  // The invoice shows only after the address is in, and only when the shipment
  // actually carries one.
  const showInvoice = emailReceived && shipment.invoice !== null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header row: result title with live status, and the tracking ID card. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)] lg:items-start">
        <div className="motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-[26px] font-bold tracking-tight text-ink-900 sm:text-3xl">
              Tracking Result
            </h1>
            <StatusPulse
              label={meta.label}
              tone={meta.tone}
              animate={isMoving(shipment.status)}
            />
          </div>
          <p className="mt-1.5 text-[15px] text-ink-600">{meta.description}</p>
        </div>

        <Card className="flex items-center justify-between gap-3 px-5 py-4 motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:60ms]">
          <div className="min-w-0">
            <span className="text-sm text-ink-500">Tracking ID:&nbsp;</span>
            <span
              className="text-[17px] font-bold tracking-wide text-ink-900"
              data-numeric
              data-testid="tracking-id"
            >
              {formatTrackingId(shipment.trackingId)}
            </span>
          </div>
          <CopyButton
            value={shipment.trackingId}
            label="Copy tracking number"
          />
        </Card>
      </div>

      {needsAttention(shipment.status) ? (
        <Alert
          tone="warning"
          title={`This shipment is marked ${meta.label.toLowerCase()}`}
        >
          Our operations team is working on it. Contact support with your
          tracking number if you need an update sooner.
        </Alert>
      ) : null}

      {/* Directly under the status, because on a shipment that is asking for an
          address this is the one thing the page wants the visitor to do. Once
          the address is in, the invoice and payment step follow immediately
          below it. */}
      {emailStep ? (
        <RecipientEmailCard trackingId={shipment.trackingId} submitted={emailReceived} />
      ) : null}

      {showInvoice && shipment.invoice ? (
        <InvoiceCard
          trackingId={shipment.trackingId}
          invoice={shipment.invoice}
          methodLabel={
            shipment.paymentMethod
              ? PAYMENT_METHOD_LABELS[shipment.paymentMethod]
              : "Bitcoin (BTC)"
          }
          walletAddress={shipment.paymentWalletAddress}
          submitted={shipment.paymentStatus === "reviewing_payment"}
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)] lg:items-start">
        {/* Left column: route map and progress. */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:120ms]">
            <RouteMap shipment={shipment} />
          </div>

          <Card className="motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:180ms]">
            <CardHeader
              title="Shipment Progress"
              description="Confirmed scans, followed by the milestones still expected."
            />
            <ProgressTimeline steps={shipment.progress} />
          </Card>

          {rating.canRate ? (
            <RatingCard trackingId={shipment.trackingId} />
          ) : null}

          {rating.rated && rating.stars ? (
            <Card className="flex items-center gap-3 px-5 py-4">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <StarIcon
                    key={value}
                    filled={value <= (rating.stars ?? 0)}
                    className={cn(
                      "size-5",
                      value <= (rating.stars ?? 0)
                        ? "text-warn-600"
                        : "text-ink-300",
                    )}
                  />
                ))}
              </span>
              <p className="text-sm text-ink-600">
                This delivery was rated {rating.stars} out of 5. Thank you for
                the feedback.
              </p>
            </Card>
          ) : null}
        </div>

        {/* Right column: parcel, parties and details. */}
        <div className="flex min-w-0 flex-col gap-5 motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:120ms]">
          <Card className="overflow-hidden">
            <div className="flex justify-center bg-gradient-to-b from-white to-ink-50 px-5 pt-5 pb-2">
              <ParcelIllustration label={shipment.package.packageType} />
            </div>

            <div className="px-5 pb-5">
              <PartyBlock
                role="From"
                name={shipment.sender.name}
                company={shipment.sender.company}
                lines={shipment.sender.addressLines}
                countryCode={shipment.sender.countryCode}
              />

              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 border-t border-dashed border-ink-200" />
                <PlaneIcon className="size-[18px] text-ink-400" />
                <span className="h-px flex-1 border-t border-dashed border-ink-200" />
              </div>

              <PartyBlock
                role="To"
                name={shipment.recipient.name}
                company={shipment.recipient.company}
                lines={shipment.recipient.addressLines}
                countryCode={shipment.recipient.countryCode}
              />

              <dl className="mt-5 border-t border-ink-100">
                <DetailRow label="Service Type">
                  {shipment.serviceLevelLabel}
                </DetailRow>
                <DetailRow label="Package Type">
                  {shipment.package.packageType ?? "Not specified"}
                </DetailRow>
                {shipment.package.pieceCount &&
                shipment.package.pieceCount > 1 ? (
                  <DetailRow label="Pieces">
                    {shipment.package.pieceCount}
                  </DetailRow>
                ) : null}
                <DetailRow label="Weight">
                  {formatWeight(shipment.package.weightKg) ?? "Not recorded"}
                </DetailRow>
                {shipment.package.dimensionsLabel ? (
                  <DetailRow label="Dimensions">
                    {shipment.package.dimensionsLabel}
                  </DetailRow>
                ) : null}
                <DetailRow label="Status" tone={meta.tone}>
                  {meta.label}
                </DetailRow>
                {delivered && shipment.deliveredAt ? (
                  <DetailRow label="Delivered" tone="delivered">
                    <time dateTime={shipment.deliveredAt}>
                      {formatDateTime(shipment.deliveredAt)}
                    </time>
                  </DetailRow>
                ) : (
                  <DetailRow
                    label="Estimated Delivery"
                    tone={
                      needsAttention(shipment.status) ? "neutral" : "delivered"
                    }
                  >
                    <span className="block">
                      {formatCalendarDate(shipment.estimatedDeliveryDate) ??
                        "To be confirmed"}
                    </span>
                    {shipment.estimatedDeliveryWindow ? (
                      <span className="block font-semibold">
                        {shipment.estimatedDeliveryWindow}
                      </span>
                    ) : null}
                  </DetailRow>
                )}
              </dl>
            </div>
          </Card>

          <Card className="px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.1em] text-ink-500 uppercase">
              Latest scan location
            </p>
            <p className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-ink-800">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {shipment.currentLocationLabel ?? "No scan recorded yet"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Where the package was last scanned by our network. This is not a
              live position.
            </p>
          </Card>
        </div>
      </div>

      {/* Summary strip. */}
      <Card className="grid grid-cols-1 divide-y divide-ink-100 motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:240ms] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <SummaryStat
          icon={<CalendarIcon className="size-5" />}
          label="Ordered On"
        >
          <time dateTime={shipment.createdAt}>
            {formatDate(shipment.createdAt)}
          </time>
        </SummaryStat>
        <SummaryStat
          icon={<ClockIcon className="size-5" />}
          label={
            shipment.transitIsEstimate
              ? "Transit Time (planned)"
              : "Transit Time"
          }
        >
          {formatDaysLabel(shipment.transitDays) ?? "Not yet picked up"}
        </SummaryStat>
        <SummaryStat icon={<BoxIcon className="size-5" />} label="Tracking ID">
          <span data-numeric>{formatTrackingId(shipment.trackingId)}</span>
        </SummaryStat>
        <SummaryStat icon={<ShieldIcon className="size-5" />} label="Record">
          <span className="text-go-700">
            {shipment.events.length} confirmed{" "}
            {shipment.events.length === 1 ? "scan" : "scans"}
          </span>
        </SummaryStat>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Last updated{" "}
          <time dateTime={shipment.updatedAt}>
            {formatDateTime(shipment.updatedAt)}
          </time>
        </p>
        <CopyButton
          value={shareUrl}
          label="Copy tracking link"
          copiedLabel="Link copied"
          variant="button"
        />
      </div>
    </div>
  );
}

/**
 * Colours for the status chip and the Status detail row.
 *
 * Driven by the status's own tone rather than by "is it delivered", which is
 * what this used to ask. That question has only two answers, so every status
 * that was not "delivered" - including delayed, exception and a shipment held
 * for verification - rendered in the same green as one moving normally, over a
 * description explaining that something was wrong.
 */
const TONE_STYLES: Record<StatusTone, { dot: string; text: string }> = {
  neutral: { dot: "bg-ink-400", text: "text-ink-700" },
  moving: { dot: "bg-go-500", text: "text-go-700" },
  delivered: { dot: "bg-go-600", text: "text-go-700" },
  attention: { dot: "bg-warn-600", text: "text-warn-700" },
  stopped: { dot: "bg-brand-600", text: "text-brand-700" },
};

/** Status chip with a soft pulse, matching the reference header treatment. */
function StatusPulse({
  label,
  tone,
  animate,
}: {
  label: string;
  tone: StatusTone;
  /**
   * The pulse is a claim that something is happening right now, so it is tied
   * to the package actually being in motion. A held or delivered shipment shows
   * a still dot.
   */
  animate: boolean;
}) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[15px] font-semibold",
        style.text,
      )}
    >
      <span className="relative flex size-2.5">
        {animate ? (
          <span
            className={cn(
              "absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping",
              style.dot,
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2.5 rounded-full",
            style.dot,
          )}
        />
      </span>
      {label}
    </span>
  );
}

function PartyBlock({
  role,
  name,
  company,
  lines,
  countryCode,
}: {
  role: string;
  name: string | null;
  company: string | null;
  lines: string[];
  countryCode: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-ink-500">{role}</p>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-ink-900">
              {name ?? "Not provided"}
            </p>
            {company ? <p className="text-sm text-ink-600">{company}</p> : null}
            {lines.map((line) => (
              <p key={line} className="text-sm leading-relaxed text-ink-600">
                {line}
              </p>
            ))}
          </div>
        </div>
        <Flag code={countryCode} className="mt-1 shrink-0" />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  tone,
}: {
  label: string;
  children: ReactNode;
  /** Omitted for plain facts; a status tone for anything that carries meaning. */
  tone?: StatusTone;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-semibold",
          tone ? TONE_STYLES[tone].text : "text-ink-800",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-ink-50 text-ink-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="truncate text-sm font-semibold text-ink-800">
          {children}
        </p>
      </div>
    </div>
  );
}
