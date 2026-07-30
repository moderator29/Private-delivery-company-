import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Operations",
    template: "%s | SwiftTrack Operations",
  },
  // The whole operations area stays out of search indexes.
  robots: { index: false, follow: false },
};

/**
 * Metadata only. The authenticated chrome lives in the (dashboard) route group
 * below this, so /admin/login can render without a session while every page
 * inside the group is wrapped by AdminShell and gated by requireAdmin().
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
