import Image from "next/image";

import parcel from "../../../public/brand/parcel.png";

/**
 * The parcel shown at the top of the shipment details panel.
 *
 * The carton comes from the approved design, cut out so it sits on the card's
 * gradient without a plate behind it. The logo printed on it does not: the
 * source artwork is a low resolution crop, and its logo was smeared to the
 * point that "Swift" was unreadable and the descriptor line was mush. So the
 * panel was repainted and the real logo composited onto it in the face's
 * perspective, with the descriptor set as live text. See
 * scripts/rebuild-parcel.py, which regenerates the asset from the original.
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
