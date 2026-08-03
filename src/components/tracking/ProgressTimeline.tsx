import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { isMoving, needsAttention } from "@/lib/tracking/status";
import {
  AlertIcon,
  CheckIcon,
  PlaneIcon,
  TruckIcon,
} from "@/components/ui/icons";
import type { ProgressStep } from "@/lib/tracking/status";

/**
 * "Shipment progress": recorded scans first, then the milestones still expected.
 *
 * Expected steps are visually muted, carry no timestamp, and are labelled
 * "Expected" for assistive technology. That distinction matters: presenting a
 * projection as a scan would tell a customer the package is somewhere it is not.
 */
export function ProgressTimeline({ steps }: { steps: ProgressStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-ink-500">
        No scan events have been recorded for this shipment yet. The first
        update appears here once the package is scanned into our network.
      </p>
    );
  }

  return (
    <ol className="px-4 py-2 sm:px-5">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const complete = step.state === "complete";
        const current = step.state === "current";

        // The current step is the one a customer reads as "where my package is
        // now", so it has to carry the status's own tone. Rendering a held or
        // failed shipment in the same green as one in motion, under a vehicle
        // icon, says the opposite of what the event says.
        const held = current && needsAttention(step.status);

        return (
          <li
            key={step.key}
            className="relative flex gap-4 pb-6 last:pb-2 motion-safe:animate-[fade-up_.45s_var(--ease-out-soft)_both]"
            style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
          >
            {/* Connector between markers. */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5 rounded-full",
                  step.projected ? "bg-ink-200" : "bg-go-500/40",
                )}
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                complete && "border-go-500 bg-white text-go-600",
                current && !held && "border-go-600 bg-go-600 text-white",
                held && "border-warn-600 bg-warn-600 text-white",
                step.projected && "border-ink-200 bg-white text-ink-300",
              )}
            >
              {current ? (
                held ? (
                  <AlertIcon className="size-4" />
                ) : isMoving(step.status) ? (
                  <PlaneIcon className="size-4" />
                ) : (
                  <TruckIcon className="size-4" />
                )
              ) : complete ? (
                <CheckIcon className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-ink-200" />
              )}
            </span>

            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1 pt-1.5">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    held
                      ? "text-warn-700"
                      : current
                        ? "text-go-700"
                        : step.projected
                          ? "text-ink-400"
                          : "text-ink-800",
                  )}
                >
                  {step.label}
                  {step.projected ? (
                    <span className="sr-only-focusable absolute">
                      {" "}
                      (expected, not yet scanned)
                    </span>
                  ) : null}
                </p>

                {step.occurredAt ? (
                  <p
                    className={cn(
                      "mt-0.5 text-sm",
                      held
                        ? "text-warn-700"
                        : current
                          ? "text-go-600"
                          : "text-ink-500",
                    )}
                  >
                    <time dateTime={step.occurredAt}>
                      {formatDateTime(step.occurredAt)}
                    </time>
                  </p>
                ) : (
                  // No scan, so no time. A dash keeps the row aligned with the
                  // recorded ones without printing a date nothing supports; the
                  // label above already carries "expected" for screen readers.
                  <p className="mt-0.5 text-sm text-ink-400" aria-hidden="true">
                    —
                  </p>
                )}

                {step.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    {step.description}
                  </p>
                ) : null}
              </div>

              {step.locationLabel ? (
                <p
                  className={cn(
                    "shrink-0 text-sm",
                    current ? "text-go-600" : "text-ink-500",
                  )}
                >
                  {step.locationLabel}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
