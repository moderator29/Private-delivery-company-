import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ShipmentForm } from "@/components/admin/ShipmentForm";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { canWrite, getShipmentById, requireAdmin } from "@/lib/data/admin";
import { formatTrackingId } from "@/lib/tracking/tracking-id";

export const metadata: Metadata = { title: "Edit shipment" };

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAdmin();
  if (!canWrite(profile.role)) redirect("/admin/shipments");

  const { id } = await params;
  const shipment = await getShipmentById(id);
  if (!shipment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/shipments/${shipment.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
        >
          <ChevronLeftIcon className="size-4" />
          Back to shipment
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">
          Edit {formatTrackingId(shipment.tracking_id)}
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Status and location are derived from tracking events, so they are changed by adding an
          event rather than edited here.
        </p>
      </div>

      <ShipmentForm shipment={shipment} />
    </div>
  );
}
