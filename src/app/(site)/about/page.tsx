import type { Metadata } from "next";

import { PageHero, Prose } from "@/components/layout/PageHero";
import { PerformancePanel } from "@/components/home/PerformancePanel";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import {
  BuildingIcon,
  EyeIcon,
  GlobeIcon,
  LeafIcon,
  LockIcon,
  RouteIcon,
  ShieldIcon,
  SupportIcon,
  TargetIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";

/**
 * Revalidated every five minutes. The performance figures come from the
 * database, so a permanently static page would freeze them at build time, while
 * rendering on every request would cost a query for a number that changes
 * slowly.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description:
    "SwiftTrack Private Delivery Company is a Dubai based courier network. Our vision, our mission, the standards we hold ourselves to and how the network is built.",
  alternates: { canonical: absoluteUrl("/about") },
};

const VALUES = [
  {
    icon: EyeIcon,
    title: "Say what actually happened",
    body: "A tracking page is a record, not a marketing surface. If a shipment is sitting in a facility, the timeline says so. We would rather show an uncomfortable truth than a comfortable guess, because a customer who is told the truth can make a decision.",
  },
  {
    icon: LockIcon,
    title: "Treat shipment data as private",
    body: "Addresses, contents and contact details belong to the people on the waybill. Access is limited to the operators who need it, every operator action is written to an audit trail, and we collect the minimum required to move a package.",
  },
  {
    icon: RouteIcon,
    title: "Own the whole route",
    body: "Fewer handovers means fewer places for a shipment to go quiet. We run collection, gateway handling and destination delivery ourselves wherever the volume supports it, and we name our partners where it does not.",
  },
  {
    icon: SupportIcon,
    title: "Answer with an operator, not a script",
    body: "Support sees the same operational record the customer sees, plus the internal notes. That means a question about a delayed shipment gets an answer about that shipment.",
  },
  {
    icon: ShieldIcon,
    title: "Build for the exception",
    body: "Most shipments are uneventful. The measure of a courier is what happens to the ones that are not: a customs hold, a wrong address, a missed delivery. Those cases get a person and a plan.",
  },
  {
    icon: LeafIcon,
    title: "Move deliberately",
    body: "Consolidated linehaul, right sized packaging and routes planned to avoid empty movements. Efficiency is not only an environmental question, it is why a smaller network can be competitive.",
  },
];

const NETWORK = [
  {
    icon: BuildingIcon,
    title: "Dubai gateway",
    body: "Our head office and primary sorting facility sit in the Jebel Ali free zone, next to the port and twenty minutes from Al Maktoum International. Everything we carry passes through here.",
  },
  {
    icon: GlobeIcon,
    title: "International linehaul",
    body: "Scheduled departures to North America, Europe, South Asia and the wider Gulf, with customs documentation prepared before the shipment leaves the building.",
  },
  {
    icon: RouteIcon,
    title: "Destination delivery",
    body: "Final delivery is handled by SwiftTrack couriers in the cities where we have coverage, and by named delivery partners elsewhere. The tracking record is continuous either way.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={`About ${BRAND.name}`}
        title="A private delivery company built around the tracking record"
        highlight="tracking record"
        description={
          <>
            SwiftTrack is a private courier network headquartered in {BRAND.headquarters.city},{" "}
            {BRAND.headquarters.country}. We move documents, parcels and freight out of the Gulf and
            into the places our customers do business, and we treat the record of that journey as
            part of the product rather than an afterthought.
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/services" size="lg">
            See our services
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            Talk to our team
          </ButtonLink>
        </div>
      </PageHero>

      {/* Vision and mission. */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8">
              <span className="flex size-12 items-center justify-center rounded-control bg-white text-brand-600 shadow-subtle">
                <EyeIcon className="size-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">Our vision</h2>
              <Prose className="mt-3">
                <p>
                  That sending something valuable across a border stops being an act of faith.
                </p>
                <p>
                  Most people have had the experience of watching a tracking page sit unchanged for
                  days with no explanation, and having no way to find out whether that silence is
                  routine or a problem. We think that is a solved problem being solved badly, and
                  that a courier which is honest about what it knows, and clear about what it does
                  not, is worth building.
                </p>
              </Prose>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="h-full p-8">
              <span className="flex size-12 items-center justify-center rounded-control bg-ink-900 text-white">
                <TargetIcon className="size-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">Our mission</h2>
              <Prose className="mt-3">
                <p>
                  To move every shipment we accept through a network we control, and to publish a
                  scan record accurate enough that a customer never needs to phone us to find out
                  where their package is.
                </p>
                <p>
                  In practice that means three commitments: no shipment enters the network without a
                  handling plan, no status appears on a tracking page that is not backed by a scan,
                  and no exception goes more than one working day without a person attached to it.
                </p>
              </Prose>
            </Card>
          </Reveal>
        </div>
      </Container>

      {/* Live performance, computed from real shipments. */}
      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Performance"
            title="Measured, not claimed"
            description="These figures are computed from the shipments in our own operational database at the moment you loaded this page. Nothing here is a marketing estimate, and when there is not enough data to publish a number, we say so."
          />
          <div className="mt-10">
            <PerformancePanel />
          </div>
        </Container>
      </section>

      {/* Values. */}
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="What we hold ourselves to"
          title="Six standards, written down so they can be checked"
          description="Values are only useful if they are specific enough to fail at."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 50}>
              <Card className="h-full p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <value.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{value.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Network. */}
      <section className="border-t border-ink-200 bg-ink-900 py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-300 uppercase">
              The network
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Built outward from one gateway
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              We would rather run a small network properly than a large one loosely. Dubai is the
              hinge: every shipment we carry is handled there, which is what makes a continuous
              scan record possible in the first place.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {NETWORK.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <div className="h-full rounded-card border border-white/10 bg-white/5 p-6">
                  <span className="flex size-11 items-center justify-center rounded-control bg-white/10 text-brand-300">
                    <item.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 rounded-card border border-white/10 bg-white/5 p-6">
            <h3 className="text-base font-semibold text-white">A note on what we are not</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">
              SwiftTrack is an independent private delivery company. We are not affiliated with,
              endorsed by, or acting on behalf of any postal authority, any global integrator, any
              government agency or any law enforcement body. Where a partner carrier handles part of
              a route, we name them rather than presenting their work as our own.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact strip. */}
      <Container className="py-16">
        <Card className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Registered office</h2>
            <address className="mt-2 text-sm leading-relaxed text-ink-600 not-italic">
              {BRAND.legalName}
              <br />
              {BRAND.mailingAddress.line1}, {BRAND.mailingAddress.line2}
              <br />
              {BRAND.mailingAddress.city}, {BRAND.mailingAddress.country}
              <br />
              {BRAND.mailingAddress.postalCode}
            </address>
          </div>
          <ButtonLink href="/contact" size="lg">
            Contact us
          </ButtonLink>
        </Card>
      </Container>
    </>
  );
}
