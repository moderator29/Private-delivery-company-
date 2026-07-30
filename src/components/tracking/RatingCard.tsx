"use client";

import { useActionState, useState } from "react";

import { rateDeliveryAction, type RatingFormState } from "@/app/(site)/track/[trackingId]/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Surface";
import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const INITIAL: RatingFormState = { status: "idle", message: null };

const STAR_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Delivery rating, offered only on a delivered shipment that has not been rated.
 *
 * The stars are a radio group rather than buttons, so the whole control is
 * reachable and operable from the keyboard with arrow keys and reads correctly
 * to a screen reader. The visual stars are decorative; the radio labels carry
 * the meaning.
 */
export function RatingCard({ trackingId }: { trackingId: string }) {
  const [state, formAction, pending] = useActionState(rateDeliveryAction, INITIAL);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state.status === "saved") {
    return (
      <Card className="p-5">
        <Alert tone="success" title="Rating received">
          {state.message}
        </Alert>
      </Card>
    );
  }

  const active = hovered || selected;

  return (
    <Card>
      <CardHeader
        title="How was this delivery?"
        description="Your rating helps us hold the network to a standard."
      />

      <form action={formAction} className="px-5 py-4">
        <input type="hidden" name="trackingId" value={trackingId} />

        <fieldset onMouseLeave={() => setHovered(0)}>
          <legend className="text-sm font-medium text-ink-700">Your rating</legend>

          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                onMouseEnter={() => setHovered(value)}
                className={cn(
                  "cursor-pointer rounded-md p-1 transition-transform focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2",
                  "motion-safe:hover:scale-110",
                )}
              >
                <input
                  type="radio"
                  name="stars"
                  value={value}
                  checked={selected === value}
                  onChange={() => setSelected(value)}
                  className="sr-only-focusable absolute"
                />
                <StarIcon
                  filled={value <= active}
                  className={cn(
                    "size-8 transition-colors",
                    value <= active ? "text-warn-600" : "text-ink-300",
                  )}
                />
                <span className="sr-only-focusable absolute">
                  {value} {value === 1 ? "star" : "stars"}, {STAR_LABELS[value - 1]}
                </span>
              </label>
            ))}

            <span aria-live="polite" className="ml-2 text-sm font-medium text-ink-600">
              {active > 0 ? STAR_LABELS[active - 1] : ""}
            </span>
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor="rating-comment" className="text-sm font-medium text-ink-700">
            Anything you want to add? <span className="text-ink-400">(optional)</span>
          </label>
          <textarea
            id="rating-comment"
            name="comment"
            rows={3}
            maxLength={600}
            placeholder="The courier called ahead, which made it easy."
            className="mt-2 w-full rounded-control border border-ink-200 px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-ink-400"
          />
        </div>

        {state.status === "error" && state.message ? (
          <Alert tone="error" className="mt-4">
            {state.message}
          </Alert>
        ) : null}

        <Button type="submit" className="mt-4" disabled={pending || selected === 0}>
          {pending ? "Sending" : "Submit rating"}
        </Button>
      </form>
    </Card>
  );
}
