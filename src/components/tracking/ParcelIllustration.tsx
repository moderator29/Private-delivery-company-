/**
 * The parcel illustration shown at the top of the shipment details panel.
 *
 * Drawn rather than photographed so it stays sharp at any size, weighs a
 * fraction of an image, needs no network request and adapts its label to the
 * shipment. The handling marks are the standard "this way up" and "fragile"
 * pictograms, and a barcode block stands in for the waybill label.
 */
export function ParcelIllustration({ label }: { label?: string | null }) {
  return (
    <svg
      viewBox="0 0 280 190"
      className="h-auto w-full max-w-[280px]"
      role="img"
      aria-label={label ? `Parcel marked ${label}` : "SwiftTrack parcel"}
    >
      <defs>
        <linearGradient id="parcel-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3b071" />
          <stop offset="100%" stopColor="#d19a58" />
        </linearGradient>
        <linearGradient id="parcel-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9a463" />
          <stop offset="100%" stopColor="#c68f4d" />
        </linearGradient>
        <linearGradient id="parcel-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8823f" />
          <stop offset="100%" stopColor="#a97536" />
        </linearGradient>
      </defs>

      {/* Contact shadow. */}
      <ellipse cx="140" cy="176" rx="96" ry="9" fill="#14181f" opacity="0.08" />

      {/* Lid. */}
      <path d="M42 52 140 24l98 28-98 28-98-28Z" fill="url(#parcel-top)" />
      {/* Front and side faces. */}
      <path d="M42 52v78l98 28V80L42 52Z" fill="url(#parcel-front)" />
      <path d="M238 52v78l-98 28V80l98-28Z" fill="url(#parcel-side)" />

      {/* Centre tape seam. */}
      <path d="M140 24 42 52l98 28 98-28-98-28Z" fill="none" stroke="#b8823f" strokeWidth="1.5" />
      <path d="M140 80v78" stroke="#b8823f" strokeWidth="1.5" opacity="0.7" />

      {/* SwiftTrack mark on the front face. */}
      <g transform="translate(56 96) scale(0.62)">
        <path d="M0 8.5h11a1.7 1.7 0 0 1 0 3.4H0a1.7 1.7 0 0 1 0-3.4Z" fill="#d91f2e" opacity=".45" />
        <path d="M4 14.6h11a1.7 1.7 0 0 1 0 3.4H4a1.7 1.7 0 0 1 0-3.4Z" fill="#d91f2e" />
        <text
          x="20"
          y="16"
          style={{ fontSize: 17, fontWeight: 800, fontStyle: "italic" }}
          fill="#3c3227"
        >
          Swift
        </text>
        <text
          x="63"
          y="16"
          style={{ fontSize: 17, fontWeight: 800, fontStyle: "italic" }}
          fill="#d91f2e"
        >
          Track
        </text>
        <text
          x="20"
          y="27"
          style={{ fontSize: 6.2, fontWeight: 600, letterSpacing: 1.6 }}
          fill="#6b5b45"
        >
          PRIVATE DELIVERY COMPANY
        </text>
      </g>

      {/* Handling pictograms. */}
      <g stroke="#6b5b45" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.75">
        <rect x="56" y="132" width="17" height="17" rx="2" />
        <path d="M64.5 145v-8M62 139.5l2.5-2.5 2.5 2.5" />
        <rect x="79" y="132" width="17" height="17" rx="2" />
        <path d="M87.5 145v-8M85 139.5l2.5-2.5 2.5 2.5" />
        <rect x="102" y="132" width="17" height="17" rx="2" />
        <path d="M107 137.5a3.5 3.5 0 0 1 7 0c0 2-3.5 2.5-3.5 4.5M110.5 145v.4" />
      </g>

      {/* Waybill barcode block on the side face. */}
      <g transform="translate(168 108)" opacity="0.85">
        <rect x="-4" y="-8" width="58" height="34" rx="2" fill="#f2e6d4" opacity="0.85" />
        {[0, 3, 5, 9, 12, 14, 18, 21, 25, 28, 32, 35, 39, 43, 46].map((x, index) => (
          <rect
            key={x}
            x={x}
            y="-4"
            width={index % 3 === 0 ? 2.2 : 1.1}
            height="20"
            fill="#3c3227"
          />
        ))}
      </g>
    </svg>
  );
}
