"use client";

import { useActionState, useId, useState, type FormEvent } from "react";

import {
  submitRecipientEmailAction,
  type RecipientEmailFormState,
} from "@/app/(site)/track/[trackingId]/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { Card, CardHeader } from "@/components/ui/Surface";
import { CheckCircleIcon, LockIcon, MailIcon, SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { emailValidationMessage, isValidEmail } from "@/lib/tracking/payment";

/** Declared here: a "use server" module may only export async functions. */
const INITIAL_STATE: RecipientEmailFormState = { status: "idle", message: null, email: "" };

/**
 * Collects the recipient's email address on a shipment that is waiting for one.
 *
 * Two things make this reliable rather than merely pretty. The submit button is
 * disabled until the address could actually be one, so the common failure never
 * reaches the network. And the success state is driven by two independent
 * signals — `submitted`, which the server confirmed to this component, and the
 * shipment's own payment status, which arrives with the page — so it survives
 * the re-render that revalidation triggers, and it is already correct on a
 * shipment whose address was submitted in an earlier visit.
 *
 * The re-render is also what refreshes the timeline: the server action
 * revalidates the tracking path, so the new scan appears without a reload.
 */
export function RecipientEmailCard({
  trackingId,
  submitted,
}: {
  trackingId: string;
  /** True once the shipment's payment status says an address was received. */
  submitted: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitRecipientEmailAction, INITIAL_STATE);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const fieldId = useId();

  if (submitted || state.status === "saved") {
    return <EmailReceivedCard />;
  }

  const validationMessage = emailValidationMessage(email);
  const canSubmit = isValidEmail(email) && !pending;

  // The button is already disabled in both cases; this closes the gap where a
  // second Enter press lands between the click and React marking the action
  // pending, which is exactly how duplicate submissions happen.
  const guardSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!canSubmit) event.preventDefault();
  };

  return (
    <Card
      className="overflow-hidden motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]"
      data-testid="recipient-email-card"
    >
      <CardHeader
        title="Recipient Email Required"
        description="To receive your payment instructions and supporting shipment documentation, please provide your email address below."
      />

      <form action={formAction} onSubmit={guardSubmit} className="px-5 py-5" noValidate>
        <input type="hidden" name="trackingId" value={trackingId} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Field
            id={fieldId}
            label="Email address"
            required
            // Only the live check speaks here. Whatever the server said goes in
            // the alert below, so a rejected submission is stated once.
            error={touched ? validationMessage : null}
            className="min-w-0 flex-1"
          >
            {(props) => (
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-400" />
                <TextInput
                  {...props}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={254}
                  // The card only renders on a shipment that is asking for an
                  // address, so it is the one thing the page wants from the
                  // visitor and the cursor belongs in it.
                  autoFocus
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setTouched(true)}
                  disabled={pending}
                  invalid={Boolean(touched && validationMessage) || state.status === "error"}
                  className="pl-11"
                />
              </div>
            )}
          </Field>

          <Button
            type="submit"
            size="md"
            disabled={!canSubmit}
            // On a wide viewport the button sits beside the input, so it clears
            // the field's label: 1.25rem of label plus the 0.375rem gap above
            // the control.
            className="shrink-0 sm:mt-[1.625rem]"
            data-testid="recipient-email-submit"
          >
            {pending ? (
              <>
                <SpinnerIcon className="size-4 motion-safe:animate-spin" />
                Sending
              </>
            ) : (
              "Submit email"
            )}
          </Button>
        </div>

        {state.status === "error" && state.message ? (
          <Alert tone="error" className="mt-4">
            {state.message}
          </Alert>
        ) : null}

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <LockIcon className="mt-px size-3.5 shrink-0" />
          Your address is used only to send the documents for this shipment. It is
          never shown on this page and never published.
        </p>
      </form>
    </Card>
  );
}

/**
 * The confirmed state. Rendered instead of the form, never alongside it, so
 * there is no way to submit a second address by scrolling past the confirmation.
 */
function EmailReceivedCard() {
  return (
    <Card
      className={cn(
        "border-go-100 bg-gradient-to-br from-go-50 to-white",
        "motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]",
      )}
      // Announced without interrupting, which is the right weight for a
      // confirmation the visitor just asked for.
      role="status"
      data-testid="recipient-email-received"
    >
      <div className="flex gap-4 px-5 py-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-go-100 text-go-600 motion-safe:animate-[fade-in_.6s_var(--ease-out-soft)_.15s_both]">
          <CheckCircleIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-go-700">Email Received Successfully</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">Thank you.</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            Your email has been securely received.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            Payment instructions and supporting shipment documentation will be sent to
            your email shortly.
          </p>
        </div>
      </div>
    </Card>
  );
}
