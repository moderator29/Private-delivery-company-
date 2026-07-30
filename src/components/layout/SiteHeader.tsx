"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { SwiftTrackLogoLink } from "@/components/brand/SwiftTrackLogo";
import { ButtonLink } from "@/components/ui/Button";
import { CloseIcon, GlobeIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PRIMARY_NAV } from "@/lib/navigation";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  // Navigating from inside the mobile panel must close it, otherwise the panel
  // stays over the page the visitor just asked for.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <SwiftTrackLogoLink size="sm" className="shrink-0 lg:hidden" />
        <SwiftTrackLogoLink size="md" className="hidden shrink-0 lg:inline-flex" />

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-[72px] items-center px-4 text-[15px] font-semibold transition-colors",
                      active ? "text-brand-600" : "text-ink-600 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                    {/* The active underline from the brand reference. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-600 transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          {/* Language indicator, not a switcher: the site is published in
              English only, so a dropdown here would be a control that does
              nothing. It becomes a real control when a second locale ships. */}
          <span className="hidden items-center gap-1.5 pr-2 text-sm font-semibold text-ink-600 xl:inline-flex">
            <GlobeIcon className="size-[18px] text-ink-400" />
            EN
          </span>

          <ButtonLink href="/admin/login" size="md" className="hidden rounded-lg px-6 sm:inline-flex">
            Sign In
          </ButtonLink>

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

      {/* Rendered but hidden when closed, so the panel keeps its DOM position
          for assistive technology and the aria-controls reference stays valid. */}
      <div id={menuId} hidden={!menuOpen} className="border-t border-ink-200 bg-white lg:hidden">
        <nav aria-label="Main, mobile" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-control px-3 text-base font-semibold",
                      active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-ink-100 pt-3">
              <ButtonLink href="/admin/login" fullWidth size="md">
                Sign In
              </ButtonLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
