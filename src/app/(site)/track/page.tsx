import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrackingForm } from "@/components/tracking/TrackingForm";
import { Alert } from "@/components/ui/Alert";
import { Card, Container } from "@/components/ui/Surface";
import { ClockIcon, MapPinIcon, SupportIcon } from "@/components/ui/icons";
import { absoluteUrl } from "@/lib/env";
import { isValidTrackingId, normalizeTrackingId } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = {
  title: "Track a shipment",
  description:
    "Enter a SwiftTrack tracking number to see the current status, scan history and estimated delivery date for a shipment.",
  alternates: { canonical: absoluteUrl("/track") },
};

/**
 * The tracking entry page.
 *
 * The form submits here with GET, so a submission without JavaScript lands on
 * this route with ?id=. A valid ID redirects to the canonical /track/<id> URL,
 * which keeps one shareable address per shipment. An invalid one renders the
 * form again with an explanation rather than a dead end.
 */
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const submitted = typeof id === "string" ? id : "";
  const normalized = normalizeTrackingId(submitted);

  if (normalized && isValidTrackingId(normalized)) {
    redirect(`/track/${normalized}`);
  }

  const hasInvalidSubmission = submitted.trim().length > 0;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Track a shipment
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">
          Enter the tracking number from your shipping confirmation. It starts with ST and is
          twelve characters long.
        </p>

        {hasInvalidSubmission ? (
          <Alert tone="error" title="That does not look like a SwiftTrack tracking number" className="mt-6">
            Check the number and try again. Spaces and dashes are fine, we ignore them.
          </Alert>
        ) : null}

        <Card className="mt-6 p-5 sm:p-6">
          <TrackingForm autoFocus initialValue={hasInvalidSubmission ? submitted : ""} />
        </Card>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <HelpTile
            icon={<ClockIcon className="size-5" />}
            title="No updates yet?"
            body="A tracking number becomes active once the package receives its first scan in our network."
          />
          <HelpTile
            icon={<MapPinIcon className="size-5" />}
            title="Scan locations"
            body="Each entry shows where the package was scanned. SwiftTrack does not publish live GPS."
          />
          <HelpTile
            icon={<SupportIcon className="size-5" />}
            title="Need a person?"
            body="Our support team can look into a shipment that has not moved as expected."
          />
        </div>
      </div>
    </Container>
  );
}

function HelpTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card border border-ink-200 bg-ink-50/60 p-4">
      <span className="flex size-9 items-center justify-center rounded-control bg-white text-brand-600 shadow-subtle">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-ink-800">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}
