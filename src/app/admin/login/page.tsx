import type { Metadata } from "next";
import Link from "next/link";

import { SwiftTrackLogo } from "@/components/brand/SwiftTrackLogo";
import { LoginForm } from "@/components/admin/LoginForm";
import { LockIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Operations sign in",
  description: "Sign in to the SwiftTrack operations dashboard.",
  // Staff sign-in has no business in a search index.
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50">
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <Link href="/" className="inline-flex rounded-md" aria-label={`${BRAND.name} home`}>
              <SwiftTrackLogo size="lg" />
            </Link>
          </div>

          <div className="mt-8 rounded-card border border-ink-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                <LockIcon className="size-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink-900">Operations sign in</h1>
                <p className="text-sm text-ink-500">SwiftTrack staff only.</p>
              </div>
            </div>

            <div className="mt-6">
              <LoginForm next={typeof next === "string" ? next : undefined} />
            </div>
          </div>

          <p className="mt-6 text-center text-sm leading-relaxed text-ink-500">
            This area is for SwiftTrack operations staff. If you are tracking a shipment, use the{" "}
            <Link href="/track" className="font-semibold text-brand-600 hover:text-brand-700">
              tracking page
            </Link>{" "}
            instead. No account is needed to track.
          </p>
        </div>
      </main>
    </div>
  );
}
