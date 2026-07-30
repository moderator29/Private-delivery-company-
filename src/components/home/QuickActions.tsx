import Link from "next/link";

import { Container } from "@/components/ui/Surface";
import { ArrowRightIcon, BoxIcon, SearchIcon, SupportIcon, TruckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * The four things a visitor actually comes here to do, as full width tiles
 * directly under the hero.
 *
 * The primary tile is filled rather than outlined, so the most common action is
 * unmistakable at a glance instead of being one of four identical boxes.
 */
const ACTIONS = [
  {
    href: "/track",
    label: "Track",
    body: "Find a shipment by its number",
    icon: SearchIcon,
    primary: true,
  },
  {
    href: "/ship",
    label: "Ship",
    body: "Book a collection from Dubai",
    icon: BoxIcon,
    primary: false,
  },
  {
    href: "/services",
    label: "Services",
    body: "Compare delivery speeds",
    icon: TruckIcon,
    primary: false,
  },
  {
    href: "/support",
    label: "Support",
    body: "Understand a status",
    icon: SupportIcon,
    primary: false,
  },
];

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="relative z-10 -mt-8 sm:-mt-10">
      <Container>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className={cn(
                  "group flex h-full flex-col justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 sm:p-5",
                  action.primary
                    ? "border-brand-600 bg-brand-600 text-white shadow-[0_10px_28px_-12px_rgba(217,31,46,0.75)] hover:bg-brand-700"
                    : "border-ink-200 bg-white text-ink-900 shadow-card hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-raised",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl transition-colors",
                    action.primary
                      ? "bg-white/15 text-white"
                      : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
                  )}
                >
                  <action.icon className="size-6" />
                </span>

                <span>
                  <span className="flex items-center gap-1.5 text-base font-bold sm:text-lg">
                    {action.label}
                    <ArrowRightIcon
                      className={cn(
                        "size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1",
                        action.primary ? "text-white/80" : "text-ink-400",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-relaxed sm:text-sm",
                      action.primary ? "text-white/85" : "text-ink-500",
                    )}
                  >
                    {action.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
