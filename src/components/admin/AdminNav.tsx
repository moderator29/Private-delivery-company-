"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardIcon, ListIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: DashboardIcon, exact: true },
  { href: "/admin/shipments", label: "Shipments", icon: ListIcon, exact: false },
];

/**
 * Horizontal on every size rather than a collapsing sidebar. With two
 * destinations a drawer would be more chrome than navigation, and this stays
 * usable on a phone in a warehouse.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Operations" className="border-t border-ink-100">
      <ul className="mx-auto flex w-full max-w-7xl gap-1 px-2 sm:px-4 lg:px-6">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 items-center gap-2 px-3 text-sm font-semibold transition-colors",
                  active ? "text-brand-600" : "text-ink-600 hover:text-ink-900",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand-600 transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
