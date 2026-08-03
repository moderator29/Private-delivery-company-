import type { Metadata } from "next";

import { PageHero, Prose } from "@/components/layout/PageHero";
import { TrackingForm } from "@/components/tracking/TrackingForm";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import { ClockIcon, MailIcon, SupportIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";
import { STATUS_META, type ShipmentStatus } from "@/lib/tracking/status";

export const metadata: Metadata = {
  title: "Tracking support",
  description:
    "What each SwiftTrack shipment status means, what to do when tracking stops updating, and how to reach an operator about a specific shipment.",
  alternates: { canonical: absoluteUrl("/support") },
};

/** Every status a customer can encounter, with what to do about it. */
const STATUS_GUIDE: Array<{ status: ShipmentStatus; whatItMeans: string; whatToDo: string }> = [
  {
    status: "label_created",
    whatItMeans:
      "We have the shipment details and the waybill exists, but the package has not been collected yet.",
    whatToDo: "Nothing yet. The next scan happens when a courier collects the shipment.",
  },
  {
    status: "picked_up",
    whatItMeans: "A courier has collected the package and scanned it into the network.",
    whatToDo: "Nothing. The shipment is now moving toward the gateway.",
  },
  {
    status: "in_transit",
    whatItMeans:
      "The shipment has left the origin facility and is on linehaul. On international routes this is normally the longest gap between scans.",
    whatToDo:
      "Expect quiet here. Get in touch if it stays in transit noticeably longer than the transit time shown on your tracking page.",
  },
  {
    status: "arrived_at_facility",
    whatItMeans:
      "The shipment has arrived in the destination country and been scanned at a local facility. Customs processing happens around this point.",
    whatToDo:
      "If it sits here for several days, a customs query is the most likely cause. Contact us and we will check.",
  },
  {
    status: "out_for_delivery",
    whatItMeans: "The package is loaded on a delivery vehicle for delivery that day.",
    whatToDo: "Make sure someone can receive it, or arrange for it to be left safely.",
  },
  {
    status: "delivered",
    whatItMeans: "The shipment has been delivered and the delivery scan recorded.",
    whatToDo:
      "If you did not receive it, contact us the same day with the tracking number so we can trace the delivery scan.",
  },
  {
    status: "delivery_attempted",
    whatItMeans: "A courier tried to deliver and could not complete the delivery.",
    whatToDo:
      "Check the timeline entry for the reason. Contact us to arrange a redelivery or a different address.",
  },
  {
    status: "delayed",
    whatItMeans:
      "The shipment is running behind its original estimate. The estimate on your tracking page is updated when we know the new one.",
    whatToDo: "Contact us if the delay affects a deadline so we can look at options.",
  },
  {
    status: "exception",
    whatItMeans:
      "Something needs resolving before the shipment can continue, such as an incomplete address, a customs query or a packaging problem.",
    whatToDo:
      "Read the reason on the timeline. Most exceptions need an answer from the sender or recipient, so contact us promptly.",
  },
  {
    status: "payment_hold",
    whatItMeans:
      "An amount is outstanding on the shipment and the package is held until it is paid. Nothing moves and no delivery date is scheduled while the balance is open.",
    whatToDo:
      "Pay the invoice shown on your tracking page, then report the payment there. Delivery resumes once we confirm it.",
  },
  {
    status: "returned",
    whatItMeans:
      "The shipment is on its way back to the sender, usually after repeated failed deliveries or a customs refusal.",
    whatToDo: "Contact us if you want to arrange a new delivery attempt instead of a return.",
  },
  {
    status: "cancelled",
    whatItMeans: "The shipment was cancelled and will not be delivered.",
    whatToDo: "Contact us if this is unexpected.",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Tracking support"
        title="What your shipment status actually means"
        highlight="actually means"
        description="Every status a SwiftTrack shipment can carry, what it tells you, and whether it is worth contacting us about."
      >
        <Card className="max-w-2xl p-5 sm:p-6">
          <TrackingForm size="md" />
        </Card>
      </PageHero>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Status guide"
          title="Read the timeline before you call"
          description="Most questions we receive are answered by the entry already on the tracking page."
        />

        <div className="mt-12 flex flex-col gap-4">
          {STATUS_GUIDE.map((entry, index) => (
            <Reveal key={entry.status} delay={Math.min(index, 6) * 40}>
              <Card className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <StatusBadge status={entry.status} />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.1em] text-ink-500 uppercase">
                    What it means
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{entry.whatItMeans}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.1em] text-ink-500 uppercase">
                    What to do
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{entry.whatToDo}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-sm text-ink-500">
          {STATUS_GUIDE.length} of the {Object.keys(STATUS_META).length} statuses in our system are
          customer facing. The rest are internal handling states, such as the one a shipment carries
          before a waybill is issued, and are not shown on a public tracking page.
        </p>
      </Container>

      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <SectionHeading
                eyebrow="Contacting us"
                title="What to include so we can help on the first reply"
              />
              <Prose className="mt-6">
                <p>
                  <strong>Your tracking number.</strong> Without it we cannot look at the shipment,
                  and we will have to ask.
                </p>
                <p>
                  <strong>What you are seeing.</strong> The status on the page and the date of the
                  last scan tells us where to start.
                </p>
                <p>
                  <strong>What you need to happen.</strong> A redelivery, a new address, a customs
                  answer or simply a realistic date are all different conversations.
                </p>
                <p>
                  <strong>Any deadline.</strong> If the shipment has to arrive by a particular date,
                  say so in the first message rather than the third.
                </p>
              </Prose>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <SupportIcon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">Support hours</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
                  <ClockIcon className="size-4 text-ink-400" />
                  {BRAND.supportHours}
                </p>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <a
                    href={`mailto:${BRAND.supportEmail}`}
                    className="inline-flex items-center gap-2 font-semibold text-ink-800 hover:text-brand-600"
                  >
                    <MailIcon className="size-4 text-ink-400" />
                    {BRAND.supportEmail}
                  </a>
                </div>
              </Card>

              <ButtonLink href="/contact" size="lg" fullWidth>
                Send us a message
              </ButtonLink>
              <ButtonLink href="/help" size="lg" variant="secondary" fullWidth>
                Read the FAQ
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
