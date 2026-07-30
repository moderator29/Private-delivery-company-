import type { Metadata } from "next";

import { PageHero, Prose } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import {
  BoxIcon,
  CheckIcon,
  ClockIcon,
  CustomsIcon,
  PlaneIcon,
  ScaleIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Delivery services",
  description:
    "SwiftTrack service levels for international and regional delivery from Dubai: standard, express, priority, same day and managed freight, each with the same tracking record.",
  alternates: { canonical: absoluteUrl("/services") },
};

const SERVICES = [
  {
    icon: BoxIcon,
    name: "Standard Delivery",
    summary: "The everyday service for documents and parcels that need to arrive reliably.",
    detail:
      "Consolidated linehaul from Dubai with scheduled departures. Best value for shipments where a predictable date matters more than the fastest possible one.",
    points: [
      "Documents, envelopes and parcels",
      "Consolidated international linehaul",
      "Scan record at every handover",
      "Delivery estimate confirmed at booking",
    ],
  },
  {
    icon: ClockIcon,
    name: "Express Delivery",
    summary: "Priority handling on the first available departure.",
    detail:
      "Your shipment skips consolidation and moves on the next scheduled linehaul. Suited to contracts, replacement parts and anything with a deadline attached.",
    points: [
      "Next available departure",
      "Priority customs presentation",
      "Delivery window on the tracking page",
      "Proactive exception handling",
    ],
  },
  {
    icon: PlaneIcon,
    name: "Priority Delivery",
    summary: "Our fastest cross border service, monitored shipment by shipment.",
    detail:
      "Dedicated handling from collection through to final delivery, with an operations contact who follows the shipment rather than a queue of tickets.",
    points: [
      "Dedicated handling end to end",
      "Named operations contact",
      "Escalation before the estimate slips",
      "Signature on delivery",
    ],
  },
  {
    icon: TruckIcon,
    name: "Same Day Delivery",
    summary: "Point to point within the Dubai metro area.",
    detail:
      "Collected and delivered the same working day inside Dubai and the neighbouring emirates. Useful for legal documents, medical items and time critical replacements.",
    points: [
      "Dubai and neighbouring emirates",
      "Collection within the booked window",
      "Direct courier, no consolidation",
      "Live scan record from pickup",
    ],
  },
  {
    icon: ScaleIcon,
    name: "Managed Freight",
    summary: "Larger consignments handled as one tracked shipment.",
    detail:
      "Palletised and oversized goods moved under a single waybill, with the same tracking page a small parcel gets. Handling requirements are agreed before collection.",
    points: [
      "Palletised and oversized goods",
      "One waybill, one tracking record",
      "Handling requirements agreed up front",
      "Scheduled delivery appointment",
    ],
  },
];

const HANDLING = [
  {
    icon: ShieldIcon,
    title: "Chain of custody",
    body: "Each handover is scanned by the person taking responsibility for the package, so the record shows who held it and when, not just that it moved.",
  },
  {
    icon: CustomsIcon,
    title: "Customs documentation",
    body: "We prepare and present the export and import paperwork for the shipments we carry. Duties and taxes assessed by the destination authority remain payable by the party named at booking.",
  },
  {
    icon: BoxIcon,
    title: "Packaging review",
    body: "At collection our courier checks that the packaging suits the contents and the route. If it does not, we say so before the shipment enters the network.",
  },
  {
    icon: ClockIcon,
    title: "Exception handling",
    body: "When something goes wrong, the reason appears on the tracking timeline and the shipment is flagged to an operator, rather than the estimated date quietly moving.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="One network, five levels of urgency"
        highlight="five levels"
        description={
          <>
            Every SwiftTrack service moves through the same Dubai gateway and produces the same
            tracking record. What changes between them is how quickly the shipment departs, how
            closely it is watched, and how much handling it needs on the way.
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/ship" size="lg">
            Send a shipment
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            Ask about a route
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-16 sm:py-20">
        <div className="flex flex-col gap-5">
          {SERVICES.map((service, index) => (
            <Reveal key={service.name} delay={index * 60}>
              <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                      <service.icon className="size-6" />
                    </span>
                    <h2 className="text-xl font-bold text-ink-900">{service.name}</h2>
                  </div>
                  <p className="mt-4 text-base font-medium text-ink-800">{service.summary}</p>
                  <Prose className="mt-2">
                    <p>{service.detail}</p>
                  </Prose>
                </div>

                <ul className="flex flex-col gap-2.5 rounded-card bg-ink-50 p-5">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-go-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="How we handle shipments"
            title="The parts that are the same on every service"
            description="Speed is the variable. Care and record keeping are not."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {HANDLING.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Card className="h-full p-6">
                  <span className="flex size-11 items-center justify-center rounded-control bg-white text-brand-600 shadow-subtle">
                    <item.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-ink-500">
            Service availability depends on the origin, the destination and the contents of the
            shipment. Confirm the route and any restrictions with our team before booking. Nothing
            on this page is a guarantee of a delivery date for a specific shipment.
          </p>
        </Container>
      </section>
    </>
  );
}
