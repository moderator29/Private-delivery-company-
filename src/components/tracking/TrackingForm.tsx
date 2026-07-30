"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  isValidTrackingId,
  normalizeTrackingId,
  TRACKING_ID_LENGTH,
} from "@/lib/tracking/tracking-id";

/**
 * The tracking entry point.
 *
 * It is a real GET form pointed at /track, so it works with JavaScript disabled
 * and produces a shareable, bookmarkable URL. The client handler upgrades that
 * with instant inline validation and a client side navigation, but the server
 * route validates again and remains the authority.
 *
 * Layout: on mobile the field and the button stack full width. From small
 * screens up they merge into a single pill, with a wide red action so the
 * primary thing to do on the page is unmistakable.
 */
export function TrackingForm({
  size = "lg",
  autoFocus = false,
  initialValue = "",
  className,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  initialValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeTrackingId(value);

    if (!normalized) {
      setError("Enter a tracking number to continue.");
      return;
    }

    if (!isValidTrackingId(normalized)) {
      setError(
        `A SwiftTrack tracking number is ${TRACKING_ID_LENGTH} characters, starting with ST and ending in a country code.`,
      );
      return;
    }

    setError(null);
    router.push(`/track/${normalized}`);
  }

  const large = size === "lg";
  const inputId = "tracking-number";
  const errorId = "tracking-number-error";

  return (
    <form action="/track" method="get" onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink-700">
        Tracking number
      </label>

      <div
        className={cn(
          "mt-2 flex flex-col gap-2.5 rounded-2xl border bg-white transition-colors sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-1.5 sm:shadow-card",
          error ? "sm:border-brand-400" : "border-transparent sm:border-ink-200",
        )}
      >
        <div className="relative flex-1">
          <SearchIcon
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-400",
              large ? "left-5 size-5" : "left-4 size-[18px]",
            )}
          />
          <input
            id={inputId}
            name="id"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            // Set only on /track, where this field is the page's sole purpose.
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder="STX9 8475 6532 US"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full rounded-full border bg-white font-semibold tracking-wide text-ink-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none sm:border-transparent sm:shadow-none",
              large ? "h-14 pr-4 pl-13 text-base" : "h-12 pr-3.5 pl-11 text-[15px]",
              error ? "border-brand-400" : "border-ink-200",
            )}
            data-testid="tracking-input"
          />
        </div>

        <button
          type="submit"
          data-testid="track-submit"
          className={cn(
            "group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full bg-brand-600 font-semibold text-white shadow-[0_6px_16px_-6px_rgba(217,31,46,0.7)] transition-all duration-200 hover:bg-brand-700 hover:shadow-[0_10px_22px_-8px_rgba(217,31,46,0.8)] active:bg-brand-800",
            large ? "h-14 px-9 text-base sm:min-w-[13.5rem]" : "h-12 px-7 text-[15px] sm:min-w-[11rem]",
          )}
        >
          <SearchIcon
            className={cn(
              "transition-transform duration-200 motion-safe:group-hover:scale-110",
              large ? "size-5" : "size-[18px]",
            )}
          />
          Track Shipment
        </button>
      </div>

      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className={cn("mt-2.5 px-1 text-sm font-medium text-brand-700", !error && "hidden")}
      >
        {error}
      </p>
    </form>
  );
}
