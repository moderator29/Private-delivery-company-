import Link from "next/link";

import { SwiftTrackLogo } from "@/components/brand/SwiftTrackLogo";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { FOOTER_NAV } from "@/lib/navigation";
import { DEFAULT_REGION, type Region } from "@/lib/regions";

export function SiteFooter({ region = DEFAULT_REGION }: { region?: Region }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <SwiftTrackLogo size="lg" />
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              A private delivery company for shipments that need careful handling and a tracking
              record you can rely on.
            </p>

            <div className="mt-5 flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="inline-flex items-center gap-2 text-ink-700 hover:text-brand-600"
              >
                <MailIcon className="size-4 text-ink-400" />
                {BRAND.supportEmail}
              </a>
              <a
                href={`tel:${region.supportPhone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 text-ink-700 hover:text-brand-600"
              >
                <PhoneIcon className="size-4 text-ink-400" />
                {region.supportPhone}
              </a>
              <span className="text-xs text-ink-500">
                {region.name} desk - {region.supportHours}
              </span>
            </div>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-500 uppercase">
                {group.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink-700 hover:text-brand-600">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink-200 pt-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {BRAND.legalName}. All rights reserved.
          </p>
          <address className="not-italic">
            {BRAND.mailingAddress.line1}, {BRAND.mailingAddress.city},{" "}
            {BRAND.mailingAddress.country}
          </address>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-400">
          SwiftTrack is an independent private delivery company. It is not affiliated with, endorsed
          by, or acting on behalf of USPS, UPS, FedEx, DHL, any government agency, or any law
          enforcement body.
        </p>
      </div>
    </footer>
  );
}
