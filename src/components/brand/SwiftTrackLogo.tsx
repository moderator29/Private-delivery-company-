import Image from "next/image";
import Link from "next/link";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

import logoLight from "../../../public/brand/swifttrack-logo-light.png";
import logoDark from "../../../public/brand/swifttrack-logo-dark.png";

/**
 * The SwiftTrack logo.
 *
 * Uses the supplied brand artwork in two variants. The original is drawn for a
 * dark background: its wordmark and swoosh are silver, which disappears on
 * white. The light variant recolours only those desaturated pixels to graphite,
 * leaving the red wordmark, the blue cab and the red pin exactly as delivered.
 *
 * The artwork's own "Delivery Services" strapline is cropped off, because the
 * approved descriptor is "Private Delivery Company". It is set as live text
 * underneath instead, which also keeps it crisp at every size and readable to
 * screen readers.
 */

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { height: number; descriptor: string; gap: string }> = {
  sm: { height: 28, descriptor: "text-[5.5px]", gap: "mt-0.5" },
  md: { height: 36, descriptor: "text-[6.5px]", gap: "mt-1" },
  lg: { height: 52, descriptor: "text-[9px]", gap: "mt-1.5" },
};

/** Intrinsic aspect ratio of the cropped artwork. */
const ASPECT = 771 / 254;

export interface SwiftTrackLogoProps {
  size?: LogoSize;
  tone?: "light" | "dark";
  /** Hides the descriptor in tight spaces such as the admin header. */
  showDescriptor?: boolean;
  className?: string;
  /** Set on the logo that appears above the fold, so it is not lazy loaded. */
  priority?: boolean;
}

export function SwiftTrackLogo({
  size = "md",
  tone = "light",
  showDescriptor = true,
  className,
  priority,
}: SwiftTrackLogoProps) {
  const scale = SIZES[size];

  return (
    <span className={cn("inline-flex flex-col items-start", className)}>
      <Image
        src={tone === "dark" ? logoDark : logoLight}
        alt={`${BRAND.name} ${BRAND.descriptor}`}
        height={scale.height}
        width={Math.round(scale.height * ASPECT)}
        priority={priority}
        className="h-auto w-auto"
        style={{ height: scale.height, width: "auto" }}
      />
      {showDescriptor ? (
        <span
          aria-hidden="true"
          className={cn(
            scale.gap,
            scale.descriptor,
            "font-semibold tracking-[0.22em] whitespace-nowrap",
            tone === "dark" ? "text-ink-400" : "text-ink-500",
          )}
        >
          {BRAND.descriptor.toUpperCase()}
        </span>
      ) : null}
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
