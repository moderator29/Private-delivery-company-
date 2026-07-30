/**
 * The parcel shown at the top of the shipment details panel.
 *
 * Drawn rather than photographed so it stays sharp at any size, weighs about a
 * kilobyte, needs no network request and carries the brand mark without a
 * licence. The geometry is a closed carton seen slightly from above: a large
 * front face for the label, a shallow lid, and one side face for depth.
 *
 * Front face carries the SwiftTrack mark. Bottom right carries the standard
 * this-way-up and fragile handling pictograms next to a barcode block, which is
 * where they sit on a real shipping carton.
 */
export function ParcelIllustration({ label }: { label?: string | null }) {
  return (
    <svg
      viewBox="0 0 300 216"
      className="h-auto w-full max-w-[290px]"
      role="img"
      aria-label={label ? `SwiftTrack parcel marked ${label}` : "SwiftTrack parcel"}
    >
      <defs>
        {/* Three tones, lit from the upper left, so the faces separate without
            any outline. */}
        <linearGradient id="parcel-lid" x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#e8bd85" />
          <stop offset="100%" stopColor="#d8a465" />
        </linearGradient>
        <linearGradient id="parcel-face" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#dcab6f" />
          <stop offset="100%" stopColor="#c8945a" />
        </linearGradient>
        <linearGradient id="parcel-side" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#b8813f" />
          <stop offset="100%" stopColor="#a97535" />
        </linearGradient>
        <radialGradient id="parcel-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#14181f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#14181f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Contact shadow on the surface. */}
      <ellipse cx="150" cy="196" rx="104" ry="16" fill="url(#parcel-shadow)" />

      {/* Lid, seen at a shallow angle. */}
      <path d="M62 44 150 22l88 22-88 20-88-20Z" fill="url(#parcel-lid)" />
      {/* Tape seam across the lid. */}
      <path d="M150 22 62 44l88 20 88-20-88-22Z" fill="none" stroke="#c08d52" strokeWidth="1.2" />
      <path d="M106 33 194 55" stroke="#c08d52" strokeWidth="1.6" opacity=".55" />

      {/* Front face: the label surface. */}
      <path d="M62 44v104l88 26V64L62 44Z" fill="url(#parcel-face)" />
      {/* Right side face, for depth. */}
      <path d="M238 44v104l-88 26V64l88-20Z" fill="url(#parcel-side)" />

      {/* Vertical tape seam down the front. */}
      <path d="M106 55v107" stroke="#bd8b50" strokeWidth="1.4" opacity=".5" />

      {/* SwiftTrack mark, laid on the front face and sheared to sit flat on it. */}
      <g transform="translate(74 88) skewY(16) scale(0.94)">
        <g>
          <path d="M0 6h9.5a1.5 1.5 0 0 1 0 3H0a1.5 1.5 0 0 1 0-3Z" fill="#d91f2e" opacity=".45" />
          <path d="M3 11.4h9.5a1.5 1.5 0 0 1 0 3H3a1.5 1.5 0 0 1 0-3Z" fill="#d91f2e" />
          <text
            x="17"
            y="14"
            style={{ fontSize: 15.5, fontWeight: 800, fontStyle: "italic" }}
            fill="#4a3c2a"
          >
            Swift
          </text>
          <text
            x="55"
            y="14"
            style={{ fontSize: 15.5, fontWeight: 800, fontStyle: "italic" }}
            fill="#d91f2e"
          >
            Track
          </text>
          <text
            x="17"
            y="24"
            style={{ fontSize: 5, fontWeight: 600, letterSpacing: 1.35 }}
            fill="#7d6a4e"
          >
            PRIVATE DELIVERY COMPANY
          </text>
        </g>
      </g>

      {/* Handling pictograms, sheared onto the front face. */}
      <g
        transform="translate(74 132) skewY(16)"
        stroke="#7d6a4e"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".8"
      >
        {/* This way up. */}
        <rect x="0" y="0" width="16" height="16" rx="2" />
        <path d="M8 12.5V4M5.4 6.6 8 4l2.6 2.6" />
        {/* Keep dry. */}
        <rect x="21" y="0" width="16" height="16" rx="2" />
        <path d="M29 3.5c2.4 3 3.6 4.9 3.6 6.4a3.6 3.6 0 0 1-7.2 0c0-1.5 1.2-3.4 3.6-6.4Z" />
        {/* Fragile. */}
        <rect x="42" y="0" width="16" height="16" rx="2" />
        <path d="M47 4.8a3 3 0 0 1 6 0c0 2-3 2.4-3 4.2M50 12.6v.4" />
      </g>

      {/* Barcode block on the side face, sheared the opposite way. */}
      <g transform="translate(166 96) skewY(-16)">
        <rect x="0" y="0" width="60" height="34" rx="2" fill="#f3e7d3" opacity=".92" />
        {[3, 6, 8, 12, 15, 17, 21, 24, 28, 31, 35, 38, 42, 46, 49, 53].map((x, index) => (
          <rect
            key={x}
            x={x}
            y="5"
            width={index % 3 === 0 ? 2.3 : 1.2}
            height="19"
            fill="#4a3c2a"
          />
        ))}
        <rect x="3" y="27" width="50" height="2.4" rx="1.2" fill="#4a3c2a" opacity=".35" />
      </g>
    </svg>
  );
}
