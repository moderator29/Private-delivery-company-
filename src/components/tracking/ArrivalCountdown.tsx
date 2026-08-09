"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Surface";
import { TruckIcon } from "@/components/ui/icons";
import { formatTimeRemaining } from "@/lib/format";

/**
 * "Arriving in 2 days 18 hours", counted against the shipment's committed
 * arrival instant.
 *
 * Two clocks are involved and they are deliberately kept apart. The server
 * renders the first value from `renderedAt`, its own clock at render time, and
 * hydration recomputes from those same two strings — so the markup the browser
 * receives and the markup React builds agree exactly, with no mismatch and no
 * flash of empty space. Only after mounting does it switch to the visitor's
 * clock and start ticking, which is what keeps a page left open overnight from
 * still claiming two days.
 *
 * It never counts past zero. Once the estimate has passed, the estimate is
 * simply wrong, and the honest thing is to stop promising and say the delivery
 * is due — an arrival is recorded by a scan, not by a timer running out.
 */
export function ArrivalCountdown({
  arrivesAt,
  renderedAt,
  /** The human estimate from the record, e.g. "August 12, 2026 · By 12:30 PM". */
  estimateLabel,
}: {
  arrivesAt: string;
  renderedAt: string;
  estimateLabel: string | null;
}) {
  const [remainingMs, setRemainingMs] = useState(
    () => Date.parse(arrivesAt) - Date.parse(renderedAt),
  );

  useEffect(() => {
    const target = Date.parse(arrivesAt);
    if (Number.isNaN(target)) return;

    const tick = () => setRemainingMs(target - Date.now());
    tick();
    // A minute is finer than the largest two units ever need, and cheap.
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [arrivesAt]);

  const remaining = formatTimeRemaining(remainingMs);

  return (
    <Card
      className="flex items-center gap-4 px-5 py-4 motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both] motion-safe:[animation-delay:90ms]"
      data-testid="arrival-countdown"
    >
      <span className="bg-go-50 text-go-700 flex size-11 shrink-0 items-center justify-center rounded-full">
        <TruckIcon className="size-5" />
      </span>

      <div className="min-w-0">
        <p className="text-ink-500 text-xs font-semibold tracking-[0.1em] uppercase">
          On its way
        </p>
        <p className="text-ink-900 mt-0.5 text-lg font-bold tracking-tight">
          {remaining ? (
            <>
              Arriving in{" "}
              <span className="text-go-700" data-testid="time-remaining">
                {remaining}
              </span>
            </>
          ) : (
            <span data-testid="time-remaining">Arriving today</span>
          )}
        </p>
        {estimateLabel ? (
          <p className="text-ink-500 mt-0.5 text-sm">
            Estimated <time dateTime={arrivesAt}>{estimateLabel}</time>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
