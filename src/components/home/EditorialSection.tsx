import Link from "next/link";

import { SceneArt } from "@/components/art/SceneArt";
import { Container, SectionHeading } from "@/components/ui/Surface";
import { Reveal } from "@/components/ui/Motion";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * Editorial cards.
 *
 * Each one links to a page that exists and says something concrete. There is no
 * "coming soon" tile and no card that opens a dead route, which is the usual
 * failure mode of a section like this.
 */
const ENTRIES = [
  {
    href: "/ship",
    scene: "handover" as const,
    eyebrow: "Sending something",
    title: "What to get right before we knock",
    body: "Packaging, declared value and customs paperwork decide whether a shipment sails through a border or sits at it. Four things worth ten minutes.",
    cta: "How to prepare a shipment",
  },
  {
    href: "/services",
    scene: "airfreight" as const,
    eyebrow: "Crossing borders",
    title: "Five service levels, one tracking record",
    body: "Standard through to same day, plus managed freight. What changes is how fast it departs and how closely it is watched, never the quality of the record.",
    cta: "Compare service levels",
  },
  {
    href: "/business",
    scene: "gateway" as const,
    eyebrow: "Shipping regularly",
    title: "Accounts built around your lanes",
    body: "Scheduled collections, customs documentation prepared in advance, and an operations contact who knows which of your shipments cannot slip.",
    cta: "See business solutions",
  },
];

export function EditorialSection() {
  return (
    <section className="border-t border-ink-200 bg-ink-50 py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Worth reading"
            title="Shipping well is mostly knowing what matters"
            description="Three things our operations team explains most often."
            className="max-w-xl"
          />
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Read the help centre
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {ENTRIES.map((entry, index) => (
            <Reveal key={entry.href} delay={index * 80}>
              <Link
                href={entry.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-ink-300 hover:shadow-raised"
              >
                <div className="relative h-48 overflow-hidden">
                  <SceneArt
                    scene={entry.scene}
                    className="size-full transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.1em] text-brand-700 uppercase backdrop-blur-sm">
                    {entry.eyebrow}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg leading-snug font-bold text-ink-900">{entry.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-600">{entry.body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                    {entry.cta}
                    <ArrowRightIcon className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
