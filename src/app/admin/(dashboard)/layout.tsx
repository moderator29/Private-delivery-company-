import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/data/admin";

/**
 * Every page in this group is behind a real server-side check.
 *
 * Middleware also redirects unauthenticated visitors, but that is a convenience.
 * This runs in the request that renders the page, and Row Level Security runs
 * underneath every query it makes, so there are three independent layers.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
