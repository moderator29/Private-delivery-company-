import { TrackingForm } from "@/components/tracking/TrackingForm";
import { ButtonLink } from "@/components/ui/Button";
import { AnimatedHeading } from "@/components/ui/Motion";
import { Container } from "@/components/ui/Surface";
import { GlobeIcon, LockIcon, RouteIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

const ASSURANCES = [
  { icon: RouteIcon, label: "Every handover scanned and timestamped" },
  { icon: LockIcon, label: "Private handling from collection to delivery" },
  { icon: GlobeIcon, label: "Dubai gateway, international reach" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-b from-ink-50 via-white to-white">
      {/* A single restrained accent wash. No floating blobs. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-brand-50/70 blur-3xl"
      />

      <Container className="relative py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-[0.1em] text-ink-600 uppercase shadow-subtle">
              <span className="size-1.5 rounded-full bg-brand-600" />
              {BRAND.headquarters.city} based private delivery company
            </p>

            <AnimatedHeading
              text="Deliveries handled privately, tracked end to end."
              highlight="end to end."
              className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-ink-900 sm:text-5xl"
            />

            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              SwiftTrack moves documents, parcels and freight out of {BRAND.headquarters.city} to
              the places our customers do business, and publishes an honest record of every scan
              along the way.
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {ASSURANCES.map((item, index) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-sm text-ink-700 motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]"
                  style={{ animationDelay: `${420 + index * 90}ms` }}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-white text-brand-600 shadow-subtle ring-1 ring-ink-200">
                    <item.icon className="size-4" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/ship" size="lg">
                Send a shipment
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="secondary">
                Explore services
              </ButtonLink>
            </div>
          </div>

          {/* The tracking field is the primary action on this page, so it gets
              its own raised surface rather than sitting inline in the copy. */}
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-raised sm:p-6 motion-safe:animate-[fade-up_.6s_var(--ease-out-soft)_both] motion-safe:[animation-delay:180ms]">
            <h2 className="text-lg font-bold text-ink-900">Track a shipment</h2>
            <p className="mt-1 text-sm text-ink-600">
              Enter the tracking number from your shipping confirmation.
            </p>
            <TrackingForm size="md" className="mt-5" />
            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              Tracking numbers look like STX9 8475 6532 US. Spaces, dashes and lower case are all
              fine, we normalise them for you.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
