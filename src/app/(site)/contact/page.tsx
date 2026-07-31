import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container } from "@/components/ui/Surface";
import { BuildingIcon, ClockIcon, MailIcon, SupportIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact SwiftTrack Private Delivery Company in Dubai about a shipment, a collection or a business account.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Send us a message and a person will answer"
        highlight="a person"
        description="Our support team works from the same operational record you see on the tracking page, plus the internal notes behind it."
      />

      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ink-900">Message us</h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Fields marked with an asterisk are required.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <Reveal>
              <Card className="p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <SupportIcon className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink-900">Support</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
                  <ClockIcon className="size-4 text-ink-400" />
                  {BRAND.supportHours}
                </p>

                <div className="mt-4 flex flex-col gap-2.5 text-sm">
                  <a
                    href={`mailto:${BRAND.supportEmail}`}
                    className="inline-flex items-center gap-2 font-semibold text-ink-800 hover:text-brand-600"
                  >
                    <MailIcon className="size-4 text-ink-400" />
                    {BRAND.supportEmail}
                  </a>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={70}>
              <Card className="p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-ink-100 text-ink-600">
                  <BuildingIcon className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink-900">Head office</h2>
                <address className="mt-2 text-sm leading-relaxed text-ink-600 not-italic">
                  {BRAND.legalName}
                  <br />
                  {BRAND.mailingAddress.line1}
                  <br />
                  {BRAND.mailingAddress.line2}
                  <br />
                  {BRAND.mailingAddress.city}, {BRAND.mailingAddress.country}
                  <br />
                  {BRAND.mailingAddress.postalCode}
                </address>
              </Card>
            </Reveal>

            <Reveal delay={140}>
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-ink-900">Other enquiries</h2>
                <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                  <li>
                    <span className="text-ink-500">Business accounts: </span>
                    <a
                      href={`mailto:${BRAND.businessEmail}`}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {BRAND.businessEmail}
                    </a>
                  </li>
                  <li>
                    <span className="text-ink-500">Privacy and data: </span>
                    <a
                      href={`mailto:${BRAND.privacyEmail}`}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {BRAND.privacyEmail}
                    </a>
                  </li>
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-ink-600">
                  Looking for a shipment? The{" "}
                  <Link
                    href="/support"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    tracking support page
                  </Link>{" "}
                  explains what each status means, and often answers the question faster than we can.
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </Container>
    </>
  );
}
