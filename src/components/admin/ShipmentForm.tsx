"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createShipmentAction,
  updateShipmentAction,
  type ActionState,
} from "@/app/admin/(dashboard)/shipments/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Card, CardHeader } from "@/components/ui/Surface";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import type { ShipmentRow } from "@/lib/data/admin";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/tracking/payment";
import { SERVICE_LEVELS, SERVICE_LEVEL_LABELS } from "@/lib/tracking/shipment";

/** Declared here: a "use server" module may only export async functions. */
const INITIAL_STATE: ActionState = { status: "idle", message: null, fieldErrors: {} };

/** Numeric column to input value, without turning null into "null". */
function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function ShipmentForm({ shipment }: { shipment?: ShipmentRow }) {
  const editing = Boolean(shipment);
  const [state, formAction, pending] = useActionState(
    editing ? updateShipmentAction : createShipmentAction,
    INITIAL_STATE,
  );

  const error = (field: string) => state.fieldErrors[field];

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {shipment ? <input type="hidden" name="id" value={shipment.id} /> : null}

      {state.status === "error" && state.message ? (
        <Alert tone="error" title="Could not save">
          {state.message}
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Service"
          description={
            editing
              ? "The tracking ID cannot be changed once a shipment exists, because it is already on the label."
              : "The tracking ID is generated on save and carries the destination country code."
          }
        />
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field id="serviceLevel" label="Service level" required error={error("serviceLevel")}>
            {(props) => (
              <Select {...props} name="serviceLevel" defaultValue={shipment?.service_level ?? "standard"}>
                {SERVICE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {SERVICE_LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="packageType"
            label="Package type"
            hint="Document, Parcel, Pallet and so on."
            error={error("packageType")}
          >
            {(props) => (
              <TextInput {...props} name="packageType" defaultValue={shipment?.package_type ?? ""} />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Sender and origin" description="Contact details stay internal." />
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field id="senderName" label="Sender name" error={error("senderName")}>
            {(props) => (
              <TextInput {...props} name="senderName" defaultValue={shipment?.sender_name ?? ""} />
            )}
          </Field>
          <Field id="senderCompany" label="Sender company" error={error("senderCompany")}>
            {(props) => (
              <TextInput
                {...props}
                name="senderCompany"
                defaultValue={shipment?.sender_company ?? ""}
              />
            )}
          </Field>
          <Field id="senderEmail" label="Sender email" error={error("senderEmail")}>
            {(props) => (
              <TextInput
                {...props}
                name="senderEmail"
                type="email"
                defaultValue={shipment?.sender_email ?? ""}
              />
            )}
          </Field>
          <Field id="senderPhone" label="Sender phone" error={error("senderPhone")}>
            {(props) => (
              <TextInput
                {...props}
                name="senderPhone"
                type="tel"
                defaultValue={shipment?.sender_phone ?? ""}
              />
            )}
          </Field>

          <Field id="originCity" label="Origin city" required error={error("originCity")}>
            {(props) => (
              <TextInput
                {...props}
                name="originCity"
                required
                defaultValue={shipment?.origin_city ?? "Dubai"}
                invalid={Boolean(error("originCity"))}
              />
            )}
          </Field>
          <Field
            id="originState"
            label="Origin state or region"
            hint="Leave blank where the country has none."
            error={error("originState")}
          >
            {(props) => (
              <TextInput {...props} name="originState" defaultValue={shipment?.origin_state ?? ""} />
            )}
          </Field>
          <Field id="originCountry" label="Origin country" required error={error("originCountry")}>
            {(props) => (
              <Select {...props} name="originCountry" defaultValue={shipment?.origin_country ?? "AE"}>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="originPostalCode" label="Origin postal code" error={error("originPostalCode")}>
            {(props) => (
              <TextInput
                {...props}
                name="originPostalCode"
                defaultValue={shipment?.origin_postal_code ?? ""}
              />
            )}
          </Field>

          <Field
            id="originLatitude"
            label="Origin latitude"
            hint="Optional. Places the pin on the route map."
            error={error("originLatitude")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="originLatitude"
                inputMode="decimal"
                placeholder="25.2048"
                defaultValue={num(shipment?.origin_latitude)}
              />
            )}
          </Field>
          <Field id="originLongitude" label="Origin longitude" error={error("originLongitude")}>
            {(props) => (
              <TextInput
                {...props}
                name="originLongitude"
                inputMode="decimal"
                placeholder="55.2708"
                defaultValue={num(shipment?.origin_longitude)}
              />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Recipient and destination"
          description="The name and address here appear on the public tracking page. Phone and email never do."
        />
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Field id="recipientName" label="Recipient name" error={error("recipientName")}>
            {(props) => (
              <TextInput
                {...props}
                name="recipientName"
                defaultValue={shipment?.recipient_name ?? ""}
              />
            )}
          </Field>
          <Field id="recipientCompany" label="Recipient company" error={error("recipientCompany")}>
            {(props) => (
              <TextInput
                {...props}
                name="recipientCompany"
                defaultValue={shipment?.recipient_company ?? ""}
              />
            )}
          </Field>
          <Field id="recipientEmail" label="Recipient email" error={error("recipientEmail")}>
            {(props) => (
              <TextInput
                {...props}
                name="recipientEmail"
                type="email"
                defaultValue={shipment?.recipient_email ?? ""}
              />
            )}
          </Field>
          <Field id="recipientPhone" label="Recipient phone" error={error("recipientPhone")}>
            {(props) => (
              <TextInput
                {...props}
                name="recipientPhone"
                type="tel"
                defaultValue={shipment?.recipient_phone ?? ""}
              />
            )}
          </Field>

          <Field
            id="destinationAddressLine1"
            label="Address line 1"
            error={error("destinationAddressLine1")}
            className="sm:col-span-2"
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationAddressLine1"
                defaultValue={shipment?.destination_address_line1 ?? ""}
              />
            )}
          </Field>
          <Field
            id="destinationAddressLine2"
            label="Address line 2"
            error={error("destinationAddressLine2")}
            className="sm:col-span-2"
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationAddressLine2"
                defaultValue={shipment?.destination_address_line2 ?? ""}
              />
            )}
          </Field>

          <Field
            id="destinationCity"
            label="Destination city"
            required
            error={error("destinationCity")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationCity"
                required
                defaultValue={shipment?.destination_city ?? ""}
                invalid={Boolean(error("destinationCity"))}
              />
            )}
          </Field>
          <Field
            id="destinationState"
            label="Destination state or region"
            error={error("destinationState")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationState"
                defaultValue={shipment?.destination_state ?? ""}
              />
            )}
          </Field>
          <Field
            id="destinationCountry"
            label="Destination country"
            required
            hint="Also becomes the suffix of the tracking ID."
            error={error("destinationCountry")}
          >
            {(props) => (
              <Select
                {...props}
                name="destinationCountry"
                defaultValue={shipment?.destination_country ?? "US"}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            id="destinationPostalCode"
            label="Destination postal code"
            error={error("destinationPostalCode")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationPostalCode"
                defaultValue={shipment?.destination_postal_code ?? ""}
              />
            )}
          </Field>

          <Field
            id="destinationLatitude"
            label="Destination latitude"
            error={error("destinationLatitude")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationLatitude"
                inputMode="decimal"
                placeholder="25.7617"
                defaultValue={num(shipment?.destination_latitude)}
              />
            )}
          </Field>
          <Field
            id="destinationLongitude"
            label="Destination longitude"
            error={error("destinationLongitude")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="destinationLongitude"
                inputMode="decimal"
                placeholder="-80.1918"
                defaultValue={num(shipment?.destination_longitude)}
              />
            )}
          </Field>

          <Field
            id="paymentStatus"
            label="Recipient payment flow"
            hint="Setting this to awaiting an email makes the tracking page ask the recipient for one."
            error={error("paymentStatus")}
            className="sm:col-span-2"
          >
            {(props) => (
              <Select
                {...props}
                name="paymentStatus"
                defaultValue={shipment?.payment_status ?? ""}
              >
                <option value="">Not in the payment flow</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Package and delivery" />
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="pieceCount" label="Pieces" error={error("pieceCount")}>
            {(props) => (
              <TextInput
                {...props}
                name="pieceCount"
                inputMode="numeric"
                defaultValue={String(shipment?.piece_count ?? 1)}
              />
            )}
          </Field>
          <Field id="weightKg" label="Weight (kg)" error={error("weightKg")}>
            {(props) => (
              <TextInput
                {...props}
                name="weightKg"
                inputMode="decimal"
                defaultValue={num(shipment?.weight_kg)}
              />
            )}
          </Field>
          <Field id="lengthCm" label="Length (cm)" error={error("lengthCm")}>
            {(props) => (
              <TextInput
                {...props}
                name="lengthCm"
                inputMode="decimal"
                defaultValue={num(shipment?.length_cm)}
              />
            )}
          </Field>
          <Field id="widthCm" label="Width (cm)" error={error("widthCm")}>
            {(props) => (
              <TextInput
                {...props}
                name="widthCm"
                inputMode="decimal"
                defaultValue={num(shipment?.width_cm)}
              />
            )}
          </Field>
          <Field id="heightCm" label="Height (cm)" error={error("heightCm")}>
            {(props) => (
              <TextInput
                {...props}
                name="heightCm"
                inputMode="decimal"
                defaultValue={num(shipment?.height_cm)}
              />
            )}
          </Field>

          <Field
            id="estimatedDeliveryDate"
            label="Estimated delivery date"
            error={error("estimatedDeliveryDate")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="estimatedDeliveryDate"
                type="date"
                defaultValue={shipment?.estimated_delivery_date ?? ""}
              />
            )}
          </Field>
          <Field
            id="estimatedDeliveryWindow"
            label="Delivery window"
            hint='Free text, such as "By 8:00 PM".'
            error={error("estimatedDeliveryWindow")}
          >
            {(props) => (
              <TextInput
                {...props}
                name="estimatedDeliveryWindow"
                placeholder="By 8:00 PM"
                defaultValue={shipment?.estimated_delivery_window ?? ""}
              />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Internal notes"
          description="Operations only. Never shown on a tracking page."
        />
        <div className="px-5 py-5">
          <Field id="internalNotes" label="Notes" hideLabel error={error("internalNotes")}>
            {(props) => (
              <TextArea
                {...props}
                name="internalNotes"
                rows={4}
                placeholder="Gate code, handling requirements, customer context."
                defaultValue={shipment?.internal_notes ?? ""}
              />
            )}
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving" : editing ? "Save changes" : "Create shipment"}
        </Button>
        <Link
          href={shipment ? `/admin/shipments/${shipment.id}` : "/admin/shipments"}
          className="text-sm font-semibold text-ink-600 hover:text-ink-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
