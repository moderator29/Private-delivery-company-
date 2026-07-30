import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container, SectionHeading } from "@/components/ui/Surface";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";
import { TRACKING_ID_LENGTH } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = {
  title: "Help and FAQ",
  description:
    "Answers to common questions about SwiftTrack tracking numbers, delivery estimates, customs, delays and how to reach a person.",
  alternates: { canonical: absoluteUrl("/help") },
};

interface FaqGroup {
  title: string;
  items: Array<{ question: string; answer: React.ReactNode }>;
}

const FAQ: FaqGroup[] = [
  {
    title: "Tracking",
    items: [
      {
        question: "What does a SwiftTrack tracking number look like?",
        answer: (
          <>
            It is {TRACKING_ID_LENGTH} characters: ST, then ten characters, then the two letter code
            of the destination country. On your confirmation it is printed in groups, like STX9 8475
            6532 US. You can type it with or without the spaces, in upper or lower case, and our
            search will find it either way.
          </>
        ),
      },
      {
        question: "My tracking number is not found. What now?",
        answer: (
          <>
            Two common causes. First, the shipment may have been created but not yet scanned into
            the network, which usually resolves within a few hours of collection. Second, one
            character may have been mistyped. Our search already corrects the usual confusions
            between the letter O and zero, and between I, L and one, so check the remaining
            characters against your confirmation before assuming the number is wrong.
          </>
        ),
      },
      {
        question: "Why has my tracking not updated in two days?",
        answer: (
          <>
            A shipment on international linehaul can legitimately go quiet between the departure scan
            and the arrival scan in the destination country, because there is no handover to record
            in between. A gap longer than the transit time shown on your tracking page is worth
            asking about. Contact support with your tracking number and we will look at the
            operational record behind it.
          </>
        ),
      },
      {
        question: "Does the tracking page show live GPS?",
        answer: (
          <>
            No, and we are deliberate about that. What you see is the last place the package was
            scanned, with a timestamp. The route map draws a line between origin and destination and
            places a marker according to how far through its milestones the shipment is. That marker
            is a progress summary, not a vehicle position. We would rather show you a scan you can
            rely on than a moving dot that is guesswork.
          </>
        ),
      },
      {
        question: "Can I share my tracking page?",
        answer: (
          <>
            Yes. Use the copy tracking link button on the tracking page. Anyone with that link can
            see the shipment, so treat it the way you would treat the tracking number itself. We do
            not allow search engines to index individual tracking pages.
          </>
        ),
      },
    ],
  },
  {
    title: "Delivery",
    items: [
      {
        question: "How accurate is the estimated delivery date?",
        answer: (
          <>
            It is our operations team&rsquo;s best estimate given the service level and the route, and it
            is set when the shipment is booked. It is an estimate rather than a guarantee. If it
            changes, the reason appears on your tracking timeline rather than the date silently
            moving.
          </>
        ),
      },
      {
        question: "What happens if nobody is there to receive the delivery?",
        answer: (
          <>
            The courier records a delivery attempt, which appears on your tracking page, and the
            shipment returns to the local facility for another attempt. After repeated unsuccessful
            attempts the shipment is held and, if it still cannot be delivered, returned to the
            sender. The exact number of attempts depends on the destination.
          </>
        ),
      },
      {
        question: "Can I change the delivery address after booking?",
        answer: (
          <>
            Sometimes, and it depends how far the shipment has travelled. An address change before
            export is usually straightforward. After a shipment has cleared into the destination
            country, changes are limited by what the destination operation allows. Contact support
            with the tracking number as early as you can.
          </>
        ),
      },
      {
        question: "Who pays customs duties and taxes?",
        answer: (
          <>
            Duties and taxes assessed by the destination country are payable by the party named as
            responsible at booking, which is usually the recipient. These are set by the destination
            authority, not by SwiftTrack, and they are separate from what you pay us to carry the
            shipment.
          </>
        ),
      },
    ],
  },
  {
    title: "Problems",
    items: [
      {
        question: "My shipment is marked as an exception. What does that mean?",
        answer: (
          <>
            An exception means something needs resolving before the shipment can continue. Common
            causes are an incomplete address, a customs query about the declared contents, or a
            package that needs repacking. The timeline entry states the reason, and the shipment is
            assigned to an operator rather than sitting in a queue.
          </>
        ),
      },
      {
        question: "My package arrived damaged.",
        answer: (
          <>
            Tell us as soon as you can, and keep the packaging. Photographs of the outer packaging,
            the inner packaging and the contents make a claim considerably easier to resolve. Claim
            time limits and liability caps are set out in our{" "}
            <Link href="/legal/terms">Terms of Service</Link>.
          </>
        ),
      },
      {
        question: "How do I make a complaint?",
        answer: (
          <>
            Contact us with the tracking number and what went wrong. A complaint goes to an operator
            rather than an automated queue, and you will get a named reply. If you are not satisfied
            with the outcome, say so in the same thread and it will be escalated.
          </>
        ),
      },
    ],
  },
  {
    title: "Privacy and account",
    items: [
      {
        question: "Who can see my shipment details?",
        answer: (
          <>
            Anyone holding the tracking number can see the tracking page, which includes the sender
            and recipient details shown on the waybill. Phone numbers, email addresses and internal
            operational notes are never published. Full details are in our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>.
          </>
        ),
      },
      {
        question: "Do I need an account to track a shipment?",
        answer: (
          <>
            No. Tracking is open to anyone with the number. The sign in link in our header is for
            SwiftTrack operations staff, not for customers. Customer accounts are something we plan
            to add, and we will announce it when it is real rather than putting a placeholder here.
          </>
        ),
      },
      {
        question: "Can I have my data deleted?",
        answer: (
          <>
            You can ask, and we will do what the law and our record keeping obligations allow.
            Shipment records tied to completed deliveries are retained for a defined period for
            customs, tax and dispute purposes. Write to {BRAND.privacyEmail} and we will explain what
            can be removed and what cannot.
          </>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="Answers to the questions we are actually asked"
        highlight="actually asked"
        description="If the answer you need is not here, our support team reads every message and replies as a person."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/track" size="lg">
            Track a shipment
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            Contact support
          </ButtonLink>
        </div>
      </PageHero>

      <Container className="py-16 sm:py-20">
        <div className="flex flex-col gap-14">
          {FAQ.map((group) => (
            <section key={group.title}>
              <SectionHeading eyebrow="FAQ" title={group.title} />

              <div className="mt-8 flex flex-col gap-3">
                {group.items.map((item, index) => (
                  <Reveal key={item.question} delay={index * 40}>
                    {/* Native disclosure: keyboard operable and announced correctly
                        with no JavaScript, and it still works if scripting fails. */}
                    <details className="group rounded-card border border-ink-200 bg-white shadow-subtle open:shadow-card">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <ChevronDownIcon className="size-5 shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-ink-100 px-5 py-4 text-[15px] leading-relaxed text-ink-600 [&_a]:font-semibold [&_a]:text-brand-600 hover:[&_a]:text-brand-700">
                        {item.answer}
                      </div>
                    </details>
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Card className="mt-16 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Still stuck?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
              Send us the tracking number and what you are seeing. Our support hours are{" "}
              {BRAND.supportHours}.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/support" variant="secondary" size="lg">
              Tracking support
            </ButtonLink>
            <ButtonLink href="/contact" size="lg">
              Contact us
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </>
  );
}
