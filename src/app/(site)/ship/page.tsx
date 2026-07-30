import type { Metadata } from "next";

import { PageHero, Prose } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import {
  AlertIcon,
  BoxIcon,
  CalendarIcon,
  CheckIcon,
  CustomsIcon,
  MapPinIcon,
  ScaleIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Send a shipment",
  description:
    "How to book a SwiftTrack collection from Dubai: what we need from you, how packaging and customs paperwork work, and what happens after pickup.",
  alternates: { canonical: absoluteUrl("/ship") },
};

const STEPS = [
  {
    step: "01",
    title: "Tell us about the shipment",
    body: "Contents, weight, dimensions, where it is going and when it needs to arrive. If you are not sure whether something can be carried to a particular country, ask us before you pack it.",
    detail: [
      "Origin and destination addresses",
      "Contents and declared value",
      "Approximate weight and dimensions",
      "Any deadline you are working to",
    ],
  },
  {
    step: "02",
    title: "We confirm service and paperwork",
    body: "We come back with the service levels that fit your deadline and the documentation the destination country requires. Nothing is collected until you have confirmed both.",
    detail: [
      "Service level and delivery estimate",
      "Customs documents required",
      "Restrictions on the route",
      "Collection window",
    ],
  },
  {
    step: "03",
    title: "Collection and first scan",
    body: "A SwiftTrack courier collects the shipment, checks the packaging against the route, and scans it into the network. Your tracking number becomes live at that moment.",
    detail: [
      "Packaging checked at the door",
      "Waybill attached and scanned",
      "Tracking number active",
      "Receipt issued to the sender",
    ],
  },
  {
    step: "04",
    title: "Track it through to delivery",
    body: "Every handover adds a scan to the tracking page. If an exception occurs, it appears on the timeline with the reason, and an operator picks it up.",
    detail: [
      "Scan at every handover",
      "Exceptions shown with a reason",
      "Delivery confirmation scan",
      "Rate the delivery afterwards",
    ],
  },
];

const PREPARATION = [
  {
    icon: BoxIcon,
    title: "Packaging",
    body: "Use a box rated for the weight, with at least five centimetres of cushioning around the contents on every side. Reused boxes are fine if the walls are still rigid and old labels are removed. Documents travel in a rigid envelope.",
  },
  {
    icon: ScaleIcon,
    title: "Weight and dimensions",
    body: "Measure the packed shipment, not the contents. We reweigh at the gateway, and where the volumetric weight is higher than the actual weight, the volumetric figure applies. You will see the figure we used on the shipment record.",
  },
  {
    icon: CustomsIcon,
    title: "Customs paperwork",
    body: "International shipments need an accurate description of the contents and a declared value. Understating value to reduce duty is the single most common cause of a shipment being held, and we will not do it.",
  },
  {
    icon: ShieldIcon,
    title: "Declared value and cover",
    body: "Declare what the contents are actually worth. Cover is optional, arranged before collection, and is limited by our Terms of Service. Some categories cannot be covered at all.",
  },
];

const RESTRICTED = [
  "Cash, bearer instruments and negotiable securities",
  "Weapons, ammunition and their components",
  "Explosives, compressed gases and flammable liquids",
  "Illegal substances of any kind",
  "Live animals",
  "Perishable goods without prior agreement",
  "Human remains",
  "Counterfeit goods",
];

export default function ShipPage() {
  return (
    <>
      <PageHero
        eyebrow="Ship with us"
        title="Booking a collection takes one conversation"
        highlight="one conversation"
        description={
          <>
            SwiftTrack does not yet take online bookings. Shipments are booked with our operations
            team so the route, the paperwork and the packaging are agreed before anything is
            collected. It is slower to start and considerably faster to finish.
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" size="lg">
            Book a collection
          </ButtonLink>
          <ButtonLink href="/services" size="lg" variant="secondary">
            Compare services
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="The process"
          title="From first message to delivery scan"
          description="Four stages. You are told what happens at each one before it happens."
        />

        <ol className="mt-12 flex flex-col gap-5">
          {STEPS.map((item, index) => (
            <Reveal key={item.step} delay={index * 60}>
              <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-bold tracking-widest text-brand-600">
                      {item.step}
                    </span>
                    <h2 className="text-xl font-bold text-ink-900">{item.title}</h2>
                  </div>
                  <Prose className="mt-3">
                    <p>{item.body}</p>
                  </Prose>
                </div>

                <ul className="flex flex-col gap-2.5 rounded-card bg-ink-50 p-5">
                  {item.detail.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-go-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </ol>
      </Container>

      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Preparing your shipment"
            title="Four things worth getting right before we arrive"
            description="Most delays we see start at the packing table, not in transit."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PREPARATION.map((item, index) => (
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
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                <AlertIcon className="size-6" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900">
                What we cannot carry
              </h2>
            </div>
            <Prose className="mt-4">
              <p>
                This list is not exhaustive and it is not the whole story: what may be carried also
                depends on the destination country and the service level. Some items are prohibited
                everywhere, others only on certain routes.
              </p>
              <p>
                If there is any doubt about an item, ask before booking. A shipment stopped at a
                border costs everyone more than a five minute conversation.
              </p>
            </Prose>
          </div>

          <Card className="p-6">
            <ul className="flex flex-col gap-3">
              {RESTRICTED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>

      <Container className="pb-20">
        <Card className="grid gap-6 bg-ink-900 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-control bg-white/10 text-brand-300">
                <MapPinIcon className="size-5" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Collections from Dubai
              </h2>
            </div>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-300">
              We collect across Dubai and the neighbouring emirates. Outside that area, talk to us
              about drop off at the Jebel Ali gateway or a partner collection.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-400">
              <CalendarIcon className="size-4" />
              {BRAND.supportHours}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <ButtonLink href="/contact" size="lg" fullWidth>
              Book a collection
            </ButtonLink>
            <ButtonLink href="/business" size="lg" variant="secondary" fullWidth>
              Shipping regularly?
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </>
  );
}
