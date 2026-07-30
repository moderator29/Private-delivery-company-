import Image from "next/image";

import parcel from "../../../public/brand/parcel.png";

/**
 * The parcel shown at the top of the shipment details panel.
 *
 * This is the carton from the approved design, extracted from the source
 * artwork with the card background flood-filled away from the edges inward, so
 * the white shipping label on the box survives while everything around it goes
 * transparent. That lets it sit on the card's gradient without a visible plate
 * behind it.
 */
export function ParcelIllustration({ label }: { label?: string | null }) {
  return (
    <Image
      src={parcel}
      alt={label ? `SwiftTrack parcel marked ${label}` : "SwiftTrack parcel"}
      // Rendered at roughly a third of its intrinsic width, which keeps it sharp
      // on high density displays without shipping a larger file than needed.
      sizes="(max-width: 1024px) 60vw, 290px"
      className="h-auto w-full max-w-[290px]"
      priority={false}
    />
  );
}
