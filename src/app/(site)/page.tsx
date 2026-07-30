import type { Metadata } from "next";

import { EditorialSection } from "@/components/home/EditorialSection";
import { Hero } from "@/components/home/Hero";
import {
  ProcessSteps,
  ServicePreview,
  SupportBand,
  ValueProps,
} from "@/components/home/HomeSections";
import { PerformancePanel } from "@/components/home/PerformancePanel";
import { QuickActions } from "@/components/home/QuickActions";
import { Container, SectionHeading } from "@/components/ui/Surface";
import { absoluteUrl } from "@/lib/env";

/**
 * Revalidated every five minutes. The performance figures come from the
 * database, so a permanently static page would freeze them at build time, while
 * rendering on every request would cost a query for a number that changes
 * slowly.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  description:
    "SwiftTrack is a Dubai based private delivery company. Track a shipment, see every scan on its route, and get a clear delivery estimate.",
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickActions />
      <ValueProps />
      <ProcessSteps />

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our record"
            title="Numbers from our own database, not a brochure"
            description="Computed live from completed shipments and customer ratings each time this page is served. When there is not enough data behind a figure, we say so instead of publishing one."
            align="center"
          />
          <div className="mt-12">
            <PerformancePanel />
          </div>
        </Container>
      </section>

      <EditorialSection />
      <ServicePreview />
      <SupportBand />
    </>
  );
}
