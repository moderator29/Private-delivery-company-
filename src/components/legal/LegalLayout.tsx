import type { ReactNode } from "react";

import { PageHero } from "@/components/layout/PageHero";
import { Alert } from "@/components/ui/Alert";
import { Reveal } from "@/components/ui/Motion";
import { Card, Container } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { BRAND } from "@/lib/brand";
import { formatCalendarDate } from "@/lib/format";

export interface LegalSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  body: ReactNode;
}

/**
 * Shared shell for the Privacy Policy and Terms of Service.
 *
 * Legal text is normally a wall of grey. This gives each clause its own card, an
 * icon and a numbered anchor, plus a contents rail that follows the reader on
 * large screens. Sections animate in as they are reached, which is decoration
 * only: with reduced motion or without JavaScript everything is visible
 * immediately, because a legal document must never depend on script to be read.
 */
export function LegalLayout({
  eyebrow,
  title,
  highlight,
  summary,
  effectiveDate,
  sections,
  reviewNote,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  summary: ReactNode;
  effectiveDate: string;
  sections: LegalSection[];
  reviewNote: string;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} highlight={highlight} description={summary}>
        <p className="text-sm text-ink-500">
          Effective <time dateTime={effectiveDate}>{formatCalendarDate(effectiveDate)}</time> for{" "}
          {BRAND.legalName}.
        </p>
      </PageHero>

      <Container className="py-12 sm:py-16">
        <Alert tone="warning" title="Review status" className="mb-10">
          {reviewNote}
        </Alert>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-14">
          {/* Contents rail. */}
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.12em] text-ink-500 uppercase">
              On this page
            </p>
            <ol className="mt-4 flex flex-col gap-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-600"
                  >
                    <span className="mt-px w-5 shrink-0 text-right text-xs font-semibold text-ink-400 tabular-nums">
                      {index + 1}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 flex-col gap-5">
            {sections.map((section, index) => (
              <Reveal key={section.id} delay={Math.min(index, 5) * 40}>
                <Card
                  id={section.id}
                  // scroll-mt clears the sticky header when jumping to an anchor.
                  className="scroll-mt-28 p-6 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                      <section.icon className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.12em] text-ink-400 uppercase">
                        Section {index + 1}
                      </p>
                      <h2 className="mt-0.5 text-xl font-bold tracking-tight text-ink-900">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-5 flex flex-col gap-4 text-[15px] leading-[1.75] text-ink-600",
                      "[&_strong]:font-semibold [&_strong]:text-ink-800",
                      "[&_a]:font-semibold [&_a]:text-brand-600 hover:[&_a]:text-brand-700",
                      "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-1",
                      "[&_li]:relative [&_li]:pl-5",
                      "[&_li]:before:absolute [&_li]:before:top-[0.65em] [&_li]:before:left-0 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-brand-300",
                    )}
                  >
                    {section.body}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
