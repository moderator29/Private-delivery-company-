import type { Metadata } from "next";

import { PageHero, Prose } from "@/components/layout/PageHero";
import { PerformancePanel } from "@/components/home/PerformancePanel";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import {
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  CustomsIcon,
  EyeIcon,
  ListIcon,
  ScaleIcon,
  ShieldIcon,
  SupportIcon,
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
  title: "Business solutions",
  description:
    "SwiftTrack for businesses shipping regularly from Dubai: account handling, scheduled collections, customs support and an operations contact who knows your traffic.",
  alternates: { canonical: absoluteUrl("/business") },
};

const SECTORS = [
  {
    icon: BuildingIcon,
    title: "Professional services",
    body: "Contracts, signed originals and closing documents where the deadline is the whole point. Same day inside the Emirates, priority handling across borders, and a delivery record you can put in a file.",
  },
  {
    icon: ScaleIcon,
    title: "Trading and distribution",
    body: "Samples, spare parts and replacement stock moving out of Jebel Ali. Consolidated linehaul keeps the cost sensible, and one waybill per consignment keeps the paperwork manageable.",
  },
  {
    icon: ShieldIcon,
    title: "Regulated and high value",
    body: "Shipments that need documented custody rather than a signature at the end. Every handover is scanned by the person taking responsibility, and the audit trail is available on request.",
  },
];

const ACCOUNT_FEATURES = [
  {
    icon: ClockIcon,
    title: "Scheduled collections",
    body: "A standing pickup window at your address, so shipments leave on a rhythm instead of a phone call.",
  },
  {
    icon: SupportIcon,
    title: "A named operations contact",
    body: "One person who knows your routes, your usual paperwork and which of your shipments cannot slip.",
  },
  {
    icon: CustomsIcon,
    title: "Customs documentation support",
    body: "We prepare export documentation for your regular lanes and flag the requirements that change before they hold a shipment up.",
  },
  {
    icon: ListIcon,
    title: "Consolidated records",
    body: "Shipment history for your account, exportable for reconciliation, with the same scan detail your customers see.",
  },
  {
    icon: EyeIcon,
    title: "Shareable tracking",
    body: "Send your customer a tracking link rather than a screenshot. It shows them the route and the scans without exposing your account.",
  },
  {
    icon: ShieldIcon,
    title: "Handling agreements",
    body: "Where your goods need particular handling, we agree it once and it applies to every shipment on the account.",
  },
];

const ONBOARDING = [
  {
    title: "Tell us what you ship",
    body: "Volumes, destinations, typical contents and the deadlines that actually matter to your business.",
  },
  {
    title: "We map the lanes",
    body: "We work out which service level fits each lane, what customs documentation each destination needs, and where a partner is involved.",
  },
  {
    title: "Agree handling and terms",
    body: "Packaging standards, collection windows, escalation contacts and commercial terms are agreed in writing before the first shipment.",
  },
  {
    title: "Start with one lane",
    body: "We would rather prove the busiest lane works than switch everything at once. Volume moves across when the record justifies it.",
  },
];

export default function BusinessPage() {
  return (
    <>
      <PageHero
        eyebrow="For business"
        title="For companies whose shipments have consequences"
        highlight="have consequences"
        description={
          <>
            If a missed delivery costs you a contract, a customer or a production run, the courier
            is not a commodity. SwiftTrack business accounts are built for regular traffic out of{" "}
            {BRAND.headquarters.city} where the record matters as much as the parcel.
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" size="lg">
            Talk to our team
          </ButtonLink>
          <ButtonLink href="/services" size="lg" variant="secondary">
            Compare services
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Who we work with"
          title="Three kinds of traffic we handle well"
          description="We are not the right courier for everything. These are the shipments our network is actually built around."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {SECTORS.map((sector, index) => (
            <Reveal key={sector.title} delay={index * 70}>
              <Card className="h-full p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <sector.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{sector.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{sector.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="What an account includes"
            title="The things that stop being your problem"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ACCOUNT_FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 50}>
                <Card className="h-full p-6">
                  <span className="flex size-11 items-center justify-center rounded-control bg-white text-brand-600 shadow-subtle">
                    <feature.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{feature.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <SectionHeading
              eyebrow="Getting started"
              title="Four steps, no long procurement cycle"
              description="Most accounts move their first shipment within a week of the first conversation."
            />
            <Prose className="mt-6">
              <p>
                We do not publish a rate card, because a meaningful price depends on the lane, the
                weight profile and how predictable your volume is. What we will do is give you a
                figure you can plan against rather than a headline that changes at invoice time.
              </p>
            </Prose>
            <ButtonLink href="/contact" size="lg" className="mt-6">
              Start a conversation
            </ButtonLink>
          </div>

          <ol className="flex flex-col gap-4">
            {ONBOARDING.map((step, index) => (
              <Reveal key={step.title} delay={index * 60}>
                <Card className="flex gap-4 p-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.body}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>

      <section className="border-t border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our record"
            title="Judge us on the numbers we actually have"
            description="Computed live from our operational database when this page loads. If a figure is not there yet, it is because the deliveries behind it have not happened."
          />
          <div className="mt-10">
            <PerformancePanel />
          </div>

          <Card className="mt-10 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
              <CheckIcon className="size-5 text-go-600" />
              What we will not tell you
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">
              We do not publish customer counts, parcel volumes, industry awards or partnership
              claims that we cannot evidence, and we do not quote a delivery success rate that
              includes only the shipments that went well. If a number appears on this site, it comes
              from the database above and you are welcome to ask how it is calculated.
            </p>
          </Card>
        </Container>
      </section>
    </>
  );
}
