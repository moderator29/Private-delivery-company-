import type { Metadata } from "next";
import Link from "next/link";

import { TrackingForm } from "@/components/tracking/TrackingForm";
import { TrackingResult } from "@/components/tracking/TrackingResult";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Container } from "@/components/ui/Surface";
import { SearchIcon } from "@/components/ui/icons";
import { getRatingState } from "@/lib/data/ratings";
import { lookupShipment } from "@/lib/data/tracking";
import { absoluteUrl } from "@/lib/env";
import { formatTrackingId, normalizeTrackingId } from "@/lib/tracking/tracking-id";
import { STATUS_META } from "@/lib/tracking/status";

interface PageProps {
  params: Promise<{ trackingId: string }>;
}

/**
 * Rendered per request. Tracking data changes as scans arrive, so caching a
 * result would show a customer a stale position.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { trackingId } = await params;
  const normalized = normalizeTrackingId(decodeURIComponent(trackingId));

  return {
    title: `Tracking ${formatTrackingId(normalized) || "shipment"}`,
    description: "Current status, scan history and estimated delivery for a SwiftTrack shipment.",
    alternates: { canonical: absoluteUrl(`/track/${normalized}`) },
    // A tracking page is personal to whoever holds the number. Keeping it out of
    // search results stops individual shipments being indexed and discovered.
    robots: { index: false, follow: false },
  };
}

export default async function TrackingDetailPage({ params }: PageProps) {
  const { trackingId } = await params;
  const result = await lookupShipment(decodeURIComponent(trackingId));

  if (result.outcome === "found") {
    const { shipment } = result;
    // Only asked once we know the shipment exists, so an unknown tracking ID
    // costs a single query rather than two.
    const rating = await getRatingState(shipment.trackingId);

    return (
      <Container className="py-8 sm:py-10">
        <TrackingResult shipment={shipment} rating={rating} />

        <p className="sr-only-focusable absolute" role="status">
          Shipment {shipment.trackingId} is {STATUS_META[shipment.status].label}.
        </p>
      </Container>
    );
  }

  if (result.outcome === "rate_limited") {
    return (
      <TrackingProblem
        title="Too many lookups"
        alertTone="warning"
        alertTitle="Please wait a moment"
        message={`We limit how often tracking can be searched from one connection. Try again in about ${result.retryAfterSeconds} seconds.`}
      />
    );
  }

  if (result.outcome === "error") {
    return (
      <TrackingProblem
        title="Tracking is temporarily unavailable"
        alertTone="error"
        alertTitle="We could not reach the tracking service"
        message="This is a problem on our side, not with your tracking number. Please try again shortly."
      />
    );
  }

  // invalid_format and not_found are answered identically on purpose. Telling a
  // visitor that a well formed number does not exist would confirm which numbers
  // are real, which is exactly what an enumeration attempt is looking for.
  return (
    <TrackingProblem
      title="We could not find that shipment"
      alertTone="info"
      alertTitle="No shipment matches that tracking number"
      message="Check the number for typos. If it was created in the last few minutes, it may not be scanned into the network yet."
      showForm
    />
  );
}

function TrackingProblem({
  title,
  alertTone,
  alertTitle,
  message,
  showForm = false,
}: {
  title: string;
  alertTone: "info" | "warning" | "error";
  alertTitle: string;
  message: string;
  showForm?: boolean;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <SearchIcon className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>

        <Alert tone={alertTone} title={alertTitle} className="mt-6 text-left">
          {message}
        </Alert>

        {showForm ? (
          <Card className="mt-6 p-5 text-left sm:p-6">
            <TrackingForm size="md" />
          </Card>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/track" variant="secondary">
            Back to tracking
          </ButtonLink>
          <ButtonLink href="/support" variant="secondary">
            Tracking support
          </ButtonLink>
        </div>

        <p className="mt-6 text-sm text-ink-500">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-brand-600 hover:text-brand-700">
            Contact our support team
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
