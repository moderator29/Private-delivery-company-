import { Card, CardHeader } from "@/components/ui/Surface";
import { CheckCircleIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { formatMoney, type Invoice } from "@/lib/tracking/payment";

/**
 * The receipt shown once payment has been confirmed received.
 *
 * It replaces the invoice rather than sitting beside it. A settled shipment
 * must not still show a wallet address and a "I've Sent Payment" button: that
 * is an invitation to pay a second time, and the money would be as gone as the
 * first.
 *
 * The same line items appear, because a recipient who paid three separate fees
 * is entitled to see what they paid for. What changes is the tense — "Total
 * Paid", not "Total Amount Due" — and that the figure is presented as settled
 * rather than owed.
 *
 * No interactivity, so this is a server component: there is nothing left for
 * the recipient to do here.
 */
export function PaymentReceipt({
  invoice,
  methodLabel,
  receivedAt,
}: {
  invoice: Invoice;
  /** How the payment was made, e.g. "Bitcoin (BTC)". */
  methodLabel: string;
  /** When the money was confirmed received. */
  receivedAt: string | null;
}) {
  return (
    <Card
      className="border-go-100 from-go-50 overflow-hidden bg-gradient-to-br to-white motion-safe:animate-[fade-up_.5s_var(--ease-out-soft)_both]"
      data-testid="payment-receipt"
    >
      <CardHeader
        title="Payment Received"
        description="This shipment is paid in full. Nothing further is owed."
        action={
          <span className="bg-go-100 text-go-700 flex size-9 shrink-0 items-center justify-center rounded-full">
            <CheckCircleIcon className="size-5" />
          </span>
        }
      />

      <div className="px-5 py-5">
        <span
          className="bg-go-100 text-go-800 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase"
          data-testid="paid-badge"
        >
          <CheckCircleIcon className="size-3.5" />
          Paid in full
        </span>

        {/* The same charges as the invoice, in the past tense. */}
        <dl className="divide-ink-100 mt-4 divide-y" data-testid="receipt-items">
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

        <div className="rounded-control border-go-100 mt-4 flex items-baseline justify-between gap-4 border bg-white px-4 py-3">
          <span className="text-ink-700 text-sm font-semibold">Total Paid</span>
          <span
            className="text-go-700 text-right text-xl font-bold tracking-tight"
            data-numeric
            data-testid="receipt-total"
          >
            {formatMoney(invoice.currency, invoice.total)}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-500 text-xs font-semibold tracking-[0.1em] uppercase">
              Paid With
            </dt>
            <dd className="text-ink-900 mt-1.5 text-[15px] font-semibold">{methodLabel}</dd>
          </div>
          {receivedAt ? (
            <div>
              <dt className="text-ink-500 text-xs font-semibold tracking-[0.1em] uppercase">
                Received
              </dt>
              <dd className="text-ink-900 mt-1.5 text-[15px] font-semibold">
                <time dateTime={receivedAt} data-testid="receipt-received-at">
                  {formatDateTime(receivedAt)}
                </time>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Card>
  );
}
