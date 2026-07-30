import Link from "next/link";

import { SwiftTrackMark } from "./SwiftTrackMark";
import { BRAND } from "@/lib/brand";

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { mark: number; wordmark: string; descriptor: string; gap: string }> =
  {
    sm: { mark: 26, wordmark: "text-lg", descriptor: "text-[6px]", gap: "gap-2" },
    md: { mark: 34, wordmark: "text-[1.375rem]", descriptor: "text-[7px]", gap: "gap-2.5" },
    lg: { mark: 46, wordmark: "text-3xl", descriptor: "text-[9px]", gap: "gap-3" },
  };

export interface SwiftTrackLogoProps {
  size?: LogoSize;
  tone?: "light" | "dark";
  /** Hides the "Private Delivery Company" descriptor in tight spaces. */
  showDescriptor?: boolean;
  className?: string;
}

/**
 * The wordmark lockup. "Swift" in graphite, "Track" in brand red, italic, with
 * the approved descriptor beneath.
 */
export function SwiftTrackLogo({
  size = "md",
  tone = "light",
  showDescriptor = true,
  className,
}: SwiftTrackLogoProps) {
  const scale = SIZES[size];
  const swiftColor = tone === "dark" ? "text-white" : "text-ink-800";
  const trackColor = tone === "dark" ? "text-brand-300" : "text-brand-600";
  const descriptorColor = tone === "dark" ? "text-ink-400" : "text-ink-500";

  return (
    <span className={`inline-flex items-center ${scale.gap} ${className ?? ""}`}>
      <SwiftTrackMark size={scale.mark} tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={`${scale.wordmark} font-extrabold italic tracking-tight ${swiftColor}`}
        >
          Swift<span className={trackColor}>Track</span>
        </span>
        {showDescriptor ? (
          <span
            className={`${scale.descriptor} mt-1 font-semibold tracking-[0.2em] ${descriptorColor}`}
          >
            {BRAND.descriptor.toUpperCase()}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** The logo as a home link, with an accessible name. Used in the site header. */
export function SwiftTrackLogoLink(props: SwiftTrackLogoProps & { href?: string }) {
  const { href = "/", ...logoProps } = props;
  return (
    <Link href={href} className="inline-flex rounded-md" aria-label={`${BRAND.name} home`}>
      <SwiftTrackLogo {...logoProps} />
    </Link>
  );
}
