"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { addEventAction, type ActionState } from "@/app/admin/(dashboard)/shipments/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Card, CardHeader } from "@/components/ui/Surface";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { DISPLAY_TIME_ZONE, DISPLAY_TIME_ZONE_LABEL } from "@/lib/format";
import {
  JOURNEY_MILESTONES,
  SHIPMENT_STATUSES,
  STATUS_META,
  type ShipmentStatus,
} from "@/lib/tracking/status";

/** Declared here: a "use server" module may only export async functions. */
const INITIAL_STATE: ActionState = { status: "idle", message: null, fieldErrors: {} };

/**
 * Suggested titles per status, so an operator recording a routine scan does not
 * have to invent wording and the public timeline stays consistent between
 * shipments. Every one is still editable.
 */
const TITLE_SUGGESTIONS: Partial<Record<ShipmentStatus, string>> = {
  ...Object.fromEntries(
    JOURNEY_MILESTONES.map((milestone) => [milestone.status, milestone.label]),
  ),
  created: "Shipment Created",
  delivery_attempted: "Delivery Attempted",
  delayed: "Shipment Delayed",
  exception: "Exception Raised",
  returned: "Returned to Sender",
  cancelled: "Shipment Cancelled",
};

function titleFor(status: ShipmentStatus): string {
  return TITLE_SUGGESTIONS[status] ?? STATUS_META[status].label;
}

/** "now" formatted for datetime-local, in the operations timezone. */
function nowInDisplayZone(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Adding an event is how a status change is recorded. The shipment's status,
 * current location and delivery timestamps are derived from its events by a
 * database trigger, so there is no separate "update status" control that could
 * disagree with the timeline.
 */
export function AddEventForm({
  shipmentId,
  defaultCity,
  defaultCountry,
}: {
  shipmentId: string;
  defaultCity: string;
  defaultCountry: string;
}) {
  const [state, formAction, pending] = useActionState(addEventAction, INITIAL_STATE);
  const [status, setStatus] = useState<ShipmentStatus>("in_transit");
  const [title, setTitle] = useState(titleFor("in_transit"));
  const [occurredAt, setOccurredAt] = useState("");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Set on the client only: computing "now" during server rendering would
  // produce a hydration mismatch and a value that is already stale.
  useEffect(() => {
    setOccurredAt(nowInDisplayZone());
  }, []);

  const error = (field: string) => state.fieldErrors[field];

  return (
    <Card>
      <CardHeader
        title="Add a tracking event"
        description={`Recorded in ${DISPLAY_TIME_ZONE_LABEL}. The newest event sets the shipment's status and location.`}
      />

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          setSaved(true);
          setOccurredAt(nowInDisplayZone());
        }}
        className="flex flex-col gap-5 px-5 py-5"
        noValidate
      >
        <input type="hidden" name="shipmentId" value={shipmentId} />

        {state.status === "error" && state.message ? (
          <Alert tone="error">{state.message}</Alert>
        ) : saved && state.status === "idle" ? (
          <Alert tone="success">Event added. The public tracking page now reflects it.</Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="event-status" label="Status" required error={error("status")}>
            {(props) => (
              <Select
                {...props}
                name="status"
                value={status}
                onChange={(event) => {
                  const next = event.target.value as ShipmentStatus;
                  setStatus(next);
                  setTitle(titleFor(next));
                }}
              >
                {SHIPMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_META[value].label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="event-occurredAt"
            label={`When it happened (${DISPLAY_TIME_ZONE_LABEL})`}
            required
            error={error("occurredAt")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="occurredAt"
                type="datetime-local"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                invalid={Boolean(error("occurredAt"))}
              />
            )}
          </Field>
        </div>

        <Field
          id="event-title"
          label="Title"
          required
          hint="Shown on the public timeline."
          error={error("title")}
        >
          {(props) => (
            <TextInput
              {...props}
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              invalid={Boolean(error("title"))}
            />
          )}
        </Field>

        <Field
          id="event-description"
          label="Description"
          hint="Optional. One line explaining what happened."
          error={error("description")}
        >
          {(props) => <TextArea {...props} name="description" rows={2} maxLength={500} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="event-facility" label="Facility" error={error("facilityLabel")}>
            {(props) => (
              <TextInput {...props} name="facilityLabel" placeholder="SwiftTrack Dubai Gateway" />
            )}
          </Field>
          <Field id="event-city" label="City" error={error("city")}>
            {(props) => <TextInput {...props} name="city" defaultValue={defaultCity} />}
          </Field>
          <Field id="event-state" label="State or region" error={error("state")}>
            {(props) => <TextInput {...props} name="state" />}
          </Field>
          <Field id="event-country" label="Country" error={error("country")}>
            {(props) => (
              <Select {...props} name="country" defaultValue={defaultCountry}>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-control bg-ink-50 p-3.5">
          <input
            type="checkbox"
            name="isPublic"
            value="true"
            defaultChecked
            className="mt-0.5 size-4 rounded border-ink-300 text-brand-600"
          />
          <span className="text-sm text-ink-700">
            <span className="font-semibold">Show on the public tracking page</span>
            <span className="mt-0.5 block text-ink-500">
              Uncheck for an internal note. Internal events never appear on public tracking, but
              they do set the shipment status if they are the newest event.
            </span>
          </span>
        </label>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding" : "Add event"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
