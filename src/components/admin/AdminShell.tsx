import Link from "next/link";

import { SwiftTrackLogoLink } from "@/components/brand/SwiftTrackLogo";
import { AdminNav } from "@/components/admin/AdminNav";
import { signOutAction } from "@/app/admin/login/actions";
import { LogOutIcon } from "@/components/ui/icons";
import type { AdminProfile } from "@/lib/data/admin";

const ROLE_LABELS: Record<AdminProfile["role"], string> = {
  owner: "Owner",
  operator: "Operator",
  viewer: "Read only",
};

/**
 * Operations chrome. Deliberately distinct from the customer facing header so
 * an operator always knows which side of the product they are looking at.
 */
export function AdminShell({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: React.ReactNode;
}) {
  const initials =
    (profile.full_name ?? profile.email)
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <SwiftTrackLogoLink size="sm" href="/admin" showDescriptor={false} />
          <span
            className="hidden rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-ink-600 uppercase sm:inline-flex"
            data-testid="admin-badge"
          >
            Operations
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-800">
                {profile.full_name ?? profile.email}
              </p>
              <p className="text-xs text-ink-500">{ROLE_LABELS[profile.role]}</p>
            </div>

            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
            >
              {initials}
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
              >
                <LogOutIcon className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>

        <AdminNav />
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-ink-200 bg-white py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-ink-500 sm:px-6 lg:px-8">
          <p>SwiftTrack operations. Every change you make here is recorded in the audit log.</p>
          <Link href="/" className="font-semibold text-ink-600 hover:text-brand-600">
            View public site
          </Link>
        </div>
      </footer>
    </div>
  );
}
