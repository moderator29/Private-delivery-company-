"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  submitPaymentNotificationAction,
  type PaymentNotificationFormState,
} from "@/app/(site)/track/[trackingId]/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Surface";
import {
  BitcoinIcon,
  CheckIcon,
  CopyIcon,
  LockIcon,
  ReceiptIcon,
  SearchIcon,
  SpinnerIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMoney, type Invoice } from "@/lib/tracking/payment";

/** Declared here: a "use server" module may only export async functions. */
const INITIAL_STATE: PaymentNotificationFormState = {
  status: "idle",
  message: null,
};

/**
 * The invoice and payment step, shown once the recipient's email is in.
 *
 * Everything it displays — the line items, the total, the method and the wallet
 * address — is passed in from the shipment record. Nothing about the amount or
 * the address is written into this component.
 *
 * The "I've Sent Payment" button does not claim payment has been received. It
 * opens a confirmation dialog, and submitting that dialog notifies operations
 * that the recipient reports having sent payment. The shipment moves to a
 * "reviewing_payment" state a person clears by hand; this component never says
 * the payment is verified.
 *
 * Like the email card, the submitted state is driven by two independent signals:
 * `submitted`, which the shipment's own payment status carries with the page,
 * and the action result. So it survives the re-render revalidation triggers and
 * is already correct on a shipment reported in an earlier visit.
 */
export function InvoiceCard({
  trackingId,
  invoice,
  methodLabel,
  walletAddress,
  submitted,
}: {
  trackingId: string;
  invoice: Invoice;
  /** How to name the payment method, e.g. "Bitcoin (BTC)". */
  methodLabel: string;
  /** The wallet address to pay to, or null when none is configured. */
  walletAddress: string | null;
  /** True once the shipment's payment status says a notification was received. */
  submitted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitPaymentNotificationAction,
    INITIAL_STATE,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const isSubmitted = submitted || state.status === "submitted";

  // Once the notification is in, the dialog has no reason to stay open. Closing
  // it here also covers the brief window before the server re-render swaps this
  // card for the status card.
  useEffect(() => {
    if (isSubmitted) setConfirmOpen(false);
  }, [isSubmitted]);

  if (isSubmitted) {
    return <PaymentUnderReviewCard />;
  }

  return (
    <Card
      className="overflow-hidden motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]"
      data-testid="invoice-card"
    >
      <CardHeader
        title="Invoice Summary"
        description="The charges due on this shipment, and how to pay them."
        action={
          <span className="bg-brand-50 text-brand-600 flex size-9 shrink-0 items-center justify-center rounded-full">
            <ReceiptIcon className="size-5" />
          </span>
        }
      />

      <div className="px-5 py-5">
        {/* Itemised charges. */}
        <dl className="divide-ink-100 divide-y" data-testid="invoice-items">
          {invoice.items.map((item) => (
            <div
              key={item.description}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <dt className="text-ink-600 text-sm">{item.description}</dt>
              <dd className="text-ink-800 text-right text-sm font-semibold" data-numeric>
                {formatMoney(invoice.currency, item.amount)}
              </dd>
            </div>
          ))}
        </dl>

        {/* Total. */}
        <div className="rounded-control bg-ink-50 mt-4 flex items-baseline justify-between gap-4 px-4 py-3">
          <span className="text-ink-700 text-sm font-semibold">Total Amount Due</span>
          <span
            className="text-ink-900 text-right text-xl font-bold tracking-tight"
            data-numeric
            data-testid="invoice-total"
          >
            {formatMoney(invoice.currency, invoice.total)}
          </span>
        </div>

        {/* Payment method. */}
        <div className="mt-5">
          <p className="text-ink-500 text-xs font-semibold tracking-[0.1em] uppercase">
            Payment Method
          </p>
          <p
            className="text-ink-900 mt-1.5 flex items-center gap-2 text-[15px] font-semibold"
            data-testid="payment-method"
          >
            <BitcoinIcon className="text-warn-600 size-5" />
            {methodLabel}
          </p>
        </div>

        {/* Wallet address, read only, with a copy control. */}
        {walletAddress ? <WalletAddressField address={walletAddress} /> : null}

        {/* Notify, guarded by a confirmation dialog. */}
        <form ref={formRef} action={formAction} className="mt-6">
          <input type="hidden" name="trackingId" value={trackingId} />

          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            data-testid="sent-payment-button"
          >
            {pending ? (
              <>
                <SpinnerIcon className="size-4 motion-safe:animate-spin" />
                Submitting
              </>
            ) : (
              "I've Sent Payment"
            )}
          </Button>

          <p className="text-ink-500 mt-3 flex items-start gap-2 text-xs leading-relaxed">
            <LockIcon className="mt-px size-3.5 shrink-0" />
            This tells our team you have sent payment. It does not confirm payment has been
            received. Every notification is reviewed by hand before shipment processing continues.
          </p>

          {state.status === "error" && state.message ? (
            <Alert tone="error" className="mt-4">
              {state.message}
            </Alert>
          ) : null}

          <dialog
            ref={dialogRef}
            onClose={() => setConfirmOpen(false)}
            onClick={(event) => {
              if (event.target === dialogRef.current) setConfirmOpen(false);
            }}
            aria-labelledby="confirm-payment-title"
            className="border-ink-200 shadow-raised backdrop:bg-ink-900/45 w-[min(30rem,calc(100vw-2rem))] rounded-2xl border bg-white p-0 backdrop:backdrop-blur-sm"
            data-testid="confirm-payment-dialog"
          >
            <div className="px-6 py-5">
              <h2
                id="confirm-payment-title"
                className="text-ink-900 text-lg font-bold tracking-tight"
              >
                Confirm Payment Notification
              </h2>
              <p className="text-ink-600 mt-2 text-sm leading-relaxed">
                Are you sure you want to notify us that you have sent payment? Your payment will be
                manually reviewed before shipment processing continues.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                {/* The one real submit. requestSubmit() fires the form's action
                    directly rather than relying on a native submit inside a
                    top-layer <dialog>, which dispatches unreliably. */}
                <Button
                  type="button"
                  onClick={() => formRef.current?.requestSubmit()}
                  disabled={pending}
                  data-testid="confirm-payment-submit"
                >
                  {pending ? (
                    <>
                      <SpinnerIcon className="size-4 motion-safe:animate-spin" />
                      Submitting
                    </>
                  ) : (
                    "Submit Notification"
                  )}
                </Button>
              </div>
            </div>
          </dialog>
        </form>
      </div>
    </Card>
  );
}

/**
 * The wallet address in a read-only field with a copy button.
 *
 * The clipboard API needs a secure context and a user gesture and can still be
 * refused, so failure is reported rather than swallowed. Success shows the small
 * confirmation the spec calls for.
 */
function WalletAddressField({ address }: { address: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <div className="mt-5">
      <p className="text-ink-500 text-xs font-semibold tracking-[0.1em] uppercase">
        Wallet Address
      </p>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="rounded-control border-ink-200 bg-ink-50 flex min-w-0 flex-1 items-center gap-2 border px-3.5 py-2.5">
          <WalletIcon className="text-ink-400 size-4 shrink-0" />
          <input
            type="text"
            readOnly
            value={address}
            aria-label="Bitcoin wallet address"
            data-testid="wallet-address"
            // Selecting the whole address on focus makes a manual copy easy when
            // the clipboard API is refused.
            onFocus={(event) => event.currentTarget.select()}
            className="text-ink-800 w-full min-w-0 truncate bg-transparent font-mono text-sm focus:outline-none"
            data-numeric
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={copy}
          className={cn("shrink-0", state === "copied" && "border-go-200 bg-go-50 text-go-700")}
          data-testid="copy-wallet-button"
        >
          {state === "copied" ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          {state === "copied" ? "Copied" : "Copy Address"}
        </Button>
      </div>

      {/* The small success (or failure) notification. Announced politely. */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 inline-flex items-center gap-1.5 text-xs font-medium",
          state === "copied" && "text-go-700",
          state === "failed" && "text-brand-700",
          state === "idle" && "sr-only-focusable absolute",
        )}
        data-testid="copy-wallet-status"
      >
        {state === "copied" ? (
          <>
            <CheckIcon className="size-3.5" />
            Bitcoin address copied successfully.
          </>
        ) : state === "failed" ? (
          "Copy was blocked. Select the address and press Ctrl+C."
        ) : (
          ""
        )}
      </p>
    </div>
  );
}

/**
 * The state after a notification is submitted. Rendered instead of the invoice,
 * never alongside it, so there is nothing to submit twice.
 *
 * It is careful not to imply payment is confirmed: the badge reads "Awaiting
 * Payment Review", the copy says a person will verify it, and the spinner is a
 * review-in-progress indicator, not a payment-clearing one.
 */
function PaymentUnderReviewCard() {
  return (
    <Card
      className={cn(
        "border-warn-100 from-warn-50 bg-gradient-to-br to-white",
        "motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]",
      )}
      role="status"
      data-testid="payment-under-review"
    >
      <div className="flex gap-4 px-5 py-5">
        <span className="bg-warn-100 text-warn-700 relative flex size-11 shrink-0 items-center justify-center rounded-full">
          <SearchIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-ink-900 text-base font-semibold">Payment Notification Submitted</h2>
            <span
              className="bg-warn-100 text-warn-700 ring-warn-200 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset"
              data-testid="review-badge"
            >
              <SpinnerIcon className="size-3.5 motion-safe:animate-spin" />
              Awaiting Payment Review
            </span>
          </div>

          <p className="text-ink-700 mt-1.5 text-sm leading-relaxed">
            Thank you. Your payment notification has been received and is awaiting manual review by
            our finance team. Shipment processing will continue after payment has been verified.
          </p>

          <p className="text-ink-500 mt-2.5 text-xs font-medium">
            Estimated review time: Usually within 1–6 hours.
          </p>
        </div>
      </div>
    </Card>
  );
}
