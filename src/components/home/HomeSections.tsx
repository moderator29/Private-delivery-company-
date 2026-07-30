import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import {
  ArrowRightIcon,
  BoxIcon,
  ClockIcon,
  MapPinIcon,
  RouteIcon,
  ShieldIcon,
  SupportIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

/**
 * Why a customer would choose SwiftTrack. Written as commitments about how the
 * service behaves, not as statistics: this business has not published audited
 * numbers, so quoting any would be an invention.
 */
const VALUE_PROPS = [
  {
    icon: ShieldIcon,
    title: "Private by default",
    body: "Shipment contents, addresses and contact details stay with the people who need them. Public tracking shows the route and the scans, never the personal details behind them.",
  },
  {
    icon: RouteIcon,
    title: "A tracking record you can check",
    body: "Every scan is timestamped and placed. When an estimate changes, the reason appears on the timeline instead of the date quietly moving.",
  },
  {
    icon: TruckIcon,
    title: "Handled through one gateway",
    body: "Collection, export handling and linehaul all run through our own Dubai facility, so a shipment does not change hands between companies before it has even left the country.",
  },
  {
    icon: SupportIcon,
    title: "Support that can see the shipment",
    body: "Our team works from the same operational record you see, plus the internal notes, so you get an answer rather than a status page read back to you.",
  },
];

export function ValueProps() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Why SwiftTrack"
          title="Built for shipments that actually matter"
          description="A smaller, private network with fewer handoffs and a clearer record of what happened to your package."
          align="center"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUE_PROPS.map((prop) => (
            <Card key={prop.title} className="p-6">
              <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                <prop.icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{prop.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{prop.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

const PROCESS = [
  {
    step: "01",
    title: "Booked and labelled",
    body: "We create the shipment, generate a tracking number and schedule the pickup window.",
  },
  {
    step: "02",
    title: "Collected",
    body: "A SwiftTrack courier collects the shipment and records the first scan at the Dubai gateway.",
  },
  {
    step: "03",
    title: "Cleared and flown",
    body: "Export documentation is presented, the shipment departs on linehaul, and it is scanned again on arrival in the destination country.",
  },
  {
    step: "04",
    title: "Delivered",
    body: "The final courier completes delivery and the shipment is closed with a delivery scan.",
  },
];

export function ProcessSteps() {
  return (
    <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Four stages, each one scanned"
          description="Nothing appears on your tracking page until it has actually happened."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((item) => (
            <li key={item.step}>
              <Card className="h-full p-5">
                <span className="text-sm font-bold tracking-widest text-brand-600">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const SERVICE_PREVIEW = [
  {
    icon: BoxIcon,
    title: "Parcel delivery",
    body: "Standard and express handling for boxes, envelopes and padded parcels.",
  },
  {
    icon: ClockIcon,
    title: "Priority and same day",
    body: "Time critical movements within a metro area or between nearby regions.",
  },
  {
    icon: MapPinIcon,
    title: "Managed freight",
    body: "Larger consignments handled as a single tracked shipment with a scheduled delivery appointment.",
  },
];

export function ServicePreview() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Services"
            title="Choose the level of urgency"
            description="Every service level uses the same network and the same tracking record."
            className="max-w-xl"
          />
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            All services
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {SERVICE_PREVIEW.map((service) => (
            <Card key={service.title} className="p-6">
              <span className="flex size-11 items-center justify-center rounded-control bg-ink-50 text-ink-600">
                <service.icon className="size-6" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{service.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function SupportBand() {
  return (
    <section className="pb-4">
      <Container>
        <div className="overflow-hidden rounded-card border border-ink-200 bg-ink-900">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                A shipment that needs attention?
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-300">
                Our support team can look into a shipment that has stalled, been marked delayed, or
                needs a delivery change. They work from the same operational record you see, plus
                the internal notes. Have the tracking number ready.
              </p>
              <p className="mt-4 text-sm text-ink-400">{BRAND.supportHours}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="/contact" size="lg" fullWidth>
                Contact support
              </ButtonLink>
              <ButtonLink href="/support" size="lg" variant="secondary" fullWidth>
                Tracking help
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
