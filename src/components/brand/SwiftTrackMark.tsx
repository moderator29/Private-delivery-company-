/**
 * The SwiftTrack mark: a delivery truck in motion with a destination pin.
 *
 * Drawn as geometry rather than shipped as a raster so it stays crisp at every
 * size, from a 20px inline mark to vehicle livery. The pin is drawn before the
 * cab so the cab overlaps its tail, which makes the two read as one object
 * instead of a sticker placed on top of a truck.
 *
 * `tone` switches only the parts that need to change for contrast on a dark
 * surface. Everything else, including the brand red, stays identical.
 */

export interface SwiftTrackMarkProps {
  /** Rendered height in pixels. Width follows the aspect ratio. */
  size?: number;
  tone?: "light" | "dark";
  className?: string;
}

export function SwiftTrackMark({ size = 34, tone = "light", className }: SwiftTrackMarkProps) {
  const trailerFill = tone === "dark" ? "#f7f8fa" : "#ffffff";
  const trailerStroke = tone === "dark" ? "#9aa3b2" : "#c2c9d4";
  const trailerDetail = tone === "dark" ? "#cbd1da" : "#e2e5eb";

  return (
    <svg
      height={size}
      width={size * (67 / 42)}
      viewBox="-1 -1 67 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Motion streaks, thin to thick, reading left to right. */}
      <path
        d="M1 16.2h10.5a1.7 1.7 0 0 1 0 3.4H1a1.7 1.7 0 0 1 0-3.4Z"
        fill="#d91f2e"
        opacity=".3"
      />
      <path
        d="M4.5 22.3h11a1.7 1.7 0 0 1 0 3.4h-11a1.7 1.7 0 0 1 0-3.4Z"
        fill="#d91f2e"
        opacity=".62"
      />
      <path d="M0 28.4h13a1.7 1.7 0 0 1 0 3.4H0a1.7 1.7 0 0 1 0-3.4Z" fill="#d91f2e" />

      {/* Destination pin, behind the cab. */}
      <path
        d="M51 0a7 7 0 0 0-7 7c0 4.7 5.9 10.2 6.5 10.8a.7.7 0 0 0 1 0C52.1 17.2 58 11.7 58 7a7 7 0 0 0-7-7Z"
        fill="#d91f2e"
      />
      <circle cx="51" cy="7" r="2.7" fill="#fff" />

      {/* Trailer. */}
      <rect
        x="17"
        y="13"
        width="26"
        height="21"
        rx="3"
        fill={trailerFill}
        stroke={trailerStroke}
        strokeWidth="1.8"
      />
      <path d="M17.9 20.5h24.2" stroke={trailerDetail} strokeWidth="1.6" />

      {/* Cab: roof, windshield, hood, bumper. */}
      <path d="M43 13h8.2l5.2 8.8H62a2 2 0 0 1 2 2V34H43V13Z" fill="#1e6fd9" />
      <path d="M46.6 15.4h4.2l3.7 6.2h-7.9v-6.2Z" fill="#8fbcf5" />
      <path d="M57.6 26h5.1a1 1 0 0 1 1 1v1.6h-6.1V26Z" fill="#155cba" />

      {/* Wheels. */}
      <circle cx="25" cy="34.6" r="4.9" fill="#232a34" />
      <circle cx="25" cy="34.6" r="1.9" fill="#9aa3b2" />
      <circle cx="36.5" cy="34.6" r="4.9" fill="#232a34" />
      <circle cx="36.5" cy="34.6" r="1.9" fill="#9aa3b2" />
      <circle cx="56.5" cy="34.6" r="4.9" fill="#232a34" />
      <circle cx="56.5" cy="34.6" r="1.9" fill="#9aa3b2" />
    </svg>
  );
}
