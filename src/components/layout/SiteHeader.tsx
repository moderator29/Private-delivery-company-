"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { SwiftTrackLogoLink } from "@/components/brand/SwiftTrackLogo";
import { RegionDialog } from "@/components/layout/RegionDialog";
import { TrackingForm } from "@/components/tracking/TrackingForm";
import { ButtonLink } from "@/components/ui/Button";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PRIMARY_NAV, NAV_PANELS } from "@/lib/navigation";
import type { Region } from "@/lib/regions";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ region }: { region: Region }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("/track");
  const menuId = useId();

  // Navigating from inside the panel must close it, otherwise it stays over the
  // page the visitor just asked for.
  useEffect(() => {
    setMenuOpen(false);
    setOpenPanel(null);
  }, [pathname]);

  // The mobile drawer takes over the viewport, so the page behind it must not
  // scroll underneath.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setOpenPanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Two sizes, each in a wrapper. Putting `hidden lg:inline-flex` on the
            link itself would fight its own `inline-flex` base class, and
            Tailwind's utility order, not the attribute order, would decide. */}
        <span className="shrink-0 lg:hidden">
          <SwiftTrackLogoLink size="sm" />
        </span>
        <span className="hidden shrink-0 lg:block">
          <SwiftTrackLogoLink size="md" />
        </span>

        {/* Desktop navigation, with a drop panel for the sections that have
            somewhere further to go. */}
        <nav
          aria-label="Main"
          className="ml-auto hidden lg:block"
          onMouseLeave={() => setOpenPanel(null)}
        >
          <ul className="flex items-center gap-0.5">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const panel = NAV_PANELS[item.href];
              const expanded = openPanel === item.href;

              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-expanded={panel ? expanded : undefined}
                    onMouseEnter={() => setOpenPanel(panel ? item.href : null)}
                    onFocus={() => setOpenPanel(panel ? item.href : null)}
                    className={cn(
                      "relative flex h-[72px] items-center gap-1.5 px-3.5 text-[15px] font-semibold transition-colors",
                      active ? "text-brand-600" : "text-ink-600 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                    {panel ? (
                      <ChevronDownIcon
                        className={cn(
                          "size-4 text-ink-400 transition-transform duration-200",
                          expanded && "rotate-180",
                        )}
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-600 transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>

                  {panel && expanded ? (
                    <div className="absolute top-full left-0 z-50 w-[22rem] pt-1">
                      <div className="rounded-2xl border border-ink-200 bg-white p-2 shadow-raised motion-safe:animate-[fade-up_.18s_var(--ease-out-soft)_both]">
                        {panel.map((entry) => (
                          <Link
                            key={entry.href}
                            href={entry.href}
                            className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-ink-50"
                          >
                            <entry.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-ink-900">
                                {entry.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                                {entry.description}
                              </span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-3">
          <RegionDialog current={region} />

          {/* Wrapped rather than given `hidden sm:inline-flex` directly: the
              button's own `inline-flex` is the same CSS property, and Tailwind's
              utility order decides the winner, not the order in the attribute.
              Hiding the wrapper is unambiguous. */}
          <span className="hidden sm:block">
            <ButtonLink href="/admin/login" size="md" className="rounded-lg px-6">
              Sign In
            </ButtonLink>
          </span>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="inline-flex size-11 items-center justify-center rounded-control text-ink-700 hover:bg-ink-100 lg:hidden"
          >
            {menuOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
            <span className="sr-only-focusable absolute">
              {menuOpen ? "Close menu" : "Open menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer. Expandable sections, with the tracking field inline
          under Track so the most common task needs no second navigation. */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-ink-200 bg-white lg:hidden"
      >
        <nav aria-label="Main, mobile" className="px-4 pb-24 sm:px-6">
          <ul className="flex flex-col divide-y divide-ink-100">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const panel = NAV_PANELS[item.href];
              const expanded = openSection === item.href;

              return (
                <li key={item.href}>
                  <div className="flex items-stretch">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 flex-1 items-center text-[17px] font-bold transition-colors",
                        active ? "text-brand-600" : "text-ink-900",
                      )}
                    >
                      {item.label}
                    </Link>

                    {panel || item.href === "/track" ? (
                      <button
                        type="button"
                        onClick={() => setOpenSection(expanded ? null : item.href)}
                        aria-expanded={expanded}
                        className="inline-flex size-14 items-center justify-center text-ink-500"
                      >
                        <ChevronDownIcon
                          className={cn(
                            "size-5 transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        />
                        <span className="sr-only-focusable absolute">
                          {expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        </span>
                      </button>
                    ) : null}
                  </div>

                  {expanded && item.href === "/track" ? (
                    <div className="pb-5">
                      <TrackingForm size="md" />
                    </div>
                  ) : null}

                  {expanded && panel ? (
                    <ul className="flex flex-col gap-1 pb-4">
                      {panel.map((entry) => (
                        <li key={entry.href}>
                          <Link
                            href={entry.href}
                            className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-ink-50"
                          >
                            <entry.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-ink-900">
                                {entry.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                                {entry.description}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="/admin/login" fullWidth size="lg">
              Sign In
            </ButtonLink>
            <p className="text-center text-xs leading-relaxed text-ink-500">
              Sign in is for SwiftTrack operations staff. Tracking needs no account.
            </p>
          </div>
        </nav>
      </div>
    </header>
  );
}
