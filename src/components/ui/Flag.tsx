import { countryName } from "@/lib/countries";

/**
 * Country flags drawn as small SVGs.
 *
 * Only the flags SwiftTrack actually shows are drawn. Anything else falls back
 * to a neutral badge with the country code, which is honest and legible rather
 * than a wrong or missing image. Emoji flags were avoided because they render
 * inconsistently across platforms and are invisible on most Windows browsers.
 */

const RATIO = { width: 24, height: 16 };

function FlagFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg
      viewBox={`0 0 ${RATIO.width} ${RATIO.height}`}
      width={RATIO.width}
      height={RATIO.height}
      role="img"
      aria-label={label}
      className="h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-black/10"
    >
      {children}
    </svg>
  );
}

export function Flag({ code, className }: { code: string | null | undefined; className?: string }) {
  const upper = code?.trim().toUpperCase() ?? "";
  const label = `${countryName(upper) ?? upper} flag`;

  if (upper === "AE") {
    return (
      <span className={className}>
        <FlagFrame label={label}>
          <rect width="24" height="5.34" fill="#00732f" />
          <rect y="5.34" width="24" height="5.33" fill="#ffffff" />
          <rect y="10.67" width="24" height="5.33" fill="#000000" />
          <rect width="6" height="16" fill="#ff0000" />
        </FlagFrame>
      </span>
    );
  }

  if (upper === "US") {
    return (
      <span className={className}>
        <FlagFrame label={label}>
          <rect width="24" height="16" fill="#ffffff" />
          {[0, 2, 4, 6, 8, 10, 12].map((offset) => (
            <rect key={offset} y={offset * (16 / 13)} width="24" height={16 / 13} fill="#b22234" />
          ))}
          <rect width="10" height={(16 / 13) * 7} fill="#3c3b6e" />
          {/* Stars are suggested at this size rather than counted out. */}
          {[1.6, 4, 6.4, 8].map((x) =>
            [1.4, 3.6, 5.8, 7.4].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" fill="#ffffff" />
            )),
          )}
        </FlagFrame>
      </span>
    );
  }

  if (upper === "GB") {
    return (
      <span className={className}>
        <FlagFrame label={label}>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#ffffff" strokeWidth="3.2" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.8" />
          <path d="M12 0v16M0 8h24" stroke="#ffffff" strokeWidth="5.2" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.1" />
        </FlagFrame>
      </span>
    );
  }

  if (!upper) return null;

  return (
    <span
      className={`inline-flex h-4 items-center rounded-[2px] bg-ink-100 px-1 text-[9px] font-bold text-ink-600 ring-1 ring-black/5 ${className ?? ""}`}
      aria-label={label}
      role="img"
    >
      {upper}
    </span>
  );
}
