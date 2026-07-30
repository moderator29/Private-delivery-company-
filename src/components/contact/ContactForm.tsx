"use client";

import { useActionState } from "react";

import { submitContactAction, type ContactFormState } from "@/app/(site)/contact/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";

const SUBJECTS = [
  "Question about a shipment",
  "Shipment is delayed",
  "Delivery problem",
  "Damaged or missing item",
  "Book a collection",
  "Business account enquiry",
  "Privacy or data request",
  "Something else",
];

/**
 * Declared here rather than in the action module: a "use server" file may only
 * export async functions, so a constant exported from there reaches the client
 * as undefined.
 */
const INITIAL_STATE: ContactFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: {},
};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, INITIAL_STATE);

  if (state.status === "sent") {
    return (
      <Alert tone="success" title="Message received">
        {state.message}
      </Alert>
    );
  }

  const value = (field: string) => state.values[field] ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === "error" && state.message ? (
        <Alert tone="error" title="We could not send that">
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Your name" required error={state.fieldErrors.name}>
          {(props) => (
            <TextInput
              {...props}
              name="name"
              autoComplete="name"
              defaultValue={value("name")}
              invalid={Boolean(state.fieldErrors.name)}
            />
          )}
        </Field>

        <Field id="email" label="Email address" required error={state.fieldErrors.email}>
          {(props) => (
            <TextInput
              {...props}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={value("email")}
              invalid={Boolean(state.fieldErrors.email)}
            />
          )}
        </Field>

        <Field
          id="phone"
          label="Phone number"
          hint="Optional. Useful if the shipment is time critical."
          error={state.fieldErrors.phone}
        >
          {(props) => (
            <TextInput
              {...props}
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={value("phone")}
              invalid={Boolean(state.fieldErrors.phone)}
            />
          )}
        </Field>

        <Field
          id="trackingId"
          label="Tracking number"
          hint="Optional, but it gets you a faster answer."
          error={state.fieldErrors.trackingId}
        >
          {(props) => (
            <TextInput
              {...props}
              name="trackingId"
              placeholder="STAB 1234 CD56 US"
              autoComplete="off"
              defaultValue={value("trackingId")}
              invalid={Boolean(state.fieldErrors.trackingId)}
            />
          )}
        </Field>
      </div>

      <Field id="subject" label="What is this about?" required error={state.fieldErrors.subject}>
        {(props) => (
          <Select
            {...props}
            name="subject"
            defaultValue={value("subject") || SUBJECTS[0]}
            invalid={Boolean(state.fieldErrors.subject)}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id="message"
        label="Message"
        required
        hint="Tell us what you are seeing and what you need to happen."
        error={state.fieldErrors.message}
      >
        {(props) => (
          <TextArea
            {...props}
            name="message"
            rows={6}
            maxLength={4000}
            defaultValue={value("message")}
            invalid={Boolean(state.fieldErrors.message)}
          />
        )}
      </Field>

      {/* Honeypot. Hidden from people, tempting to bots. Not display:none, which
          some bots detect and skip. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending" : "Send message"}
        </Button>
        <p className="text-xs leading-relaxed text-ink-500">
          We use what you send here only to answer your enquiry.
        </p>
      </div>
    </form>
  );
}
