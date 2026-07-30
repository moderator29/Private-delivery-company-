import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ShipmentForm } from "@/components/admin/ShipmentForm";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { canWrite, requireAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "New shipment" };

export default async function NewShipmentPage() {
  const profile = await requireAdmin();

  // A viewer has no business on this page at all, so they are sent back rather
  // than shown a form every field of which would be rejected on submit.
  if (!canWrite(profile.role)) redirect("/admin/shipments");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/shipments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
        >
          <ChevronLeftIcon className="size-4" />
          Back to shipments
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">New shipment</h1>
        <p className="mt-1 text-sm text-ink-600">
          A tracking ID is allocated on save. Add the first tracking event afterwards to make the
          shipment visible on public tracking.
        </p>
      </div>

      <ShipmentForm />
    </div>
  );
}
