import { expect, test } from "@playwright/test";

import {
  TRACKING_INVOICE,
  TRACKING_INVOICE_SUBMIT,
  TRACKING_IN_TRANSIT,
  collectConsoleErrors,
  main,
} from "./fixtures";

/**
 * The submit test mutates its shipment, exactly as the real function rewrites
 * the row. To keep that from making the suite fragile, the read-only checks use
 * TRACKING_INVOICE, which nothing mutates, and the submit test uses its own
 * TRACKING_INVOICE_SUBMIT. So a retry of the stateful test cannot break the
 * display tests, and the submit test itself tolerates finding the shipment
 * already reported.
 *
 * The tests are deliberately consolidated: every /track lookup shares one public
 * rate-limit bucket across the whole browser suite, so this file keeps its page
 * navigations to the minimum that still covers the flow.
 */
test.describe.configure({ mode: "serial" });

test.describe("a shipment with an outstanding invoice", () => {
  test("shows the invoice, copies the wallet, and guards the button with a dialog", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/track/${TRACKING_INVOICE}`);

    // The itemised invoice, all from the record.
    const card = page.getByTestId("invoice-card");
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: "Invoice Summary" })).toBeVisible();

    const items = page.getByTestId("invoice-items");
    await expect(items.getByText("Customs Clearance Fee")).toBeVisible();
    await expect(items.getByText("USD 1,500")).toBeVisible();
    await expect(items.getByText("Import Processing Fee")).toBeVisible();
    await expect(items.getByText("USD 1,400")).toBeVisible();
    await expect(items.getByText("Documentation Fee")).toBeVisible();
    await expect(items.getByText("USD 100")).toBeVisible();

    await expect(page.getByTestId("invoice-total")).toHaveText("USD 3,000");
    await expect(page.getByTestId("payment-method")).toContainText("Bitcoin (BTC)");

    // The wallet address is shown read-only and carries the configured value.
    const wallet = page.getByTestId("wallet-address");
    await expect(wallet).toHaveValue("bc1qn5q5m0z89wwuc3834393hh59f2454grzr6y7x2");
    await expect(wallet).toHaveAttribute("readonly", "");

    // Copying it confirms with the small notification and lands on the clipboard.
    await page.getByTestId("copy-wallet-button").click();
    await expect(page.getByTestId("copy-wallet-status")).toContainText(
      "Bitcoin address copied successfully.",
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "bc1qn5q5m0z89wwuc3834393hh59f2454grzr6y7x2",
    );

    // The button opens a confirmation dialog; Cancel submits nothing.
    const dialog = page.getByTestId("confirm-payment-dialog");
    await expect(dialog).toBeHidden();
    await page.getByTestId("sent-payment-button").click();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Confirm Payment Notification" }),
    ).toBeVisible();
    await expect(dialog.getByText(/manually reviewed before shipment processing/)).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("invoice-card")).toBeVisible();
    await expect(page.getByTestId("payment-under-review")).toHaveCount(0);

    // The recipient's own address is never shown back on the page.
    const body = (await main(page).innerText()).toLowerCase();
    expect(body).not.toContain("ines.duarte@example");
  });

  test("is absent from a shipment with no invoice", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByTestId("invoice-card")).toHaveCount(0);
    await expect(page.getByTestId("payment-under-review")).toHaveCount(0);
  });

  test("submits the notification, swaps in the review card, files the scan", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/track/${TRACKING_INVOICE_SUBMIT}`);

    const timeline = page.locator("ol").filter({ hasText: "Shipment Information Received" });

    // Only submit if the shipment has not already been reported. On a retry the
    // mock may already carry the notification, and the assertions below hold
    // either way — the point of the test is the end state, not that this run is
    // the one that produced it.
    const invoice = page.getByTestId("invoice-card");
    if (await invoice.isVisible()) {
      await expect(timeline.getByText("Payment Notification Submitted")).toHaveCount(0);

      await page.getByTestId("sent-payment-button").click();
      // Wait for the dialog to be fully shown before submitting: showModal() runs
      // in an effect after the open state flips, and clicking into that gap is a
      // race under load.
      const dialog = page.getByTestId("confirm-payment-dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByTestId("confirm-payment-submit").click();
    }

    // The invoice is replaced by the review status card, not hidden, so there is
    // nothing to submit twice. The transition waits on a server action and a
    // revalidation, so it is given room beyond the 5s default under CI load.
    const review = page.getByTestId("payment-under-review");
    await expect(review).toBeVisible({ timeout: 15_000 });
    await expect(
      review.getByRole("heading", { name: "Payment Notification Submitted" }),
    ).toBeVisible();
    await expect(review.getByTestId("review-badge")).toContainText("Awaiting Payment Review");
    await expect(review).toContainText("awaiting manual review by our finance team");
    await expect(review).toContainText("Usually within 1–6 hours");
    // It must not claim the payment is received or verified.
    await expect(review).not.toContainText(/payment (received|verified|confirmed)/i);

    await expect(page.getByTestId("invoice-card")).toHaveCount(0);

    // The revalidation puts the new scan in the timeline without a navigation.
    await expect(timeline.getByText("Payment Notification Submitted")).toBeVisible();
    await expect(
      timeline.getByText(
        "The recipient reported that payment has been sent. The payment notification is awaiting manual review.",
      ),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("stays in review when the page is opened again", async ({ page }) => {
    await page.goto(`/track/${TRACKING_INVOICE_SUBMIT}`);
    await expect(page.getByTestId("payment-under-review")).toBeVisible();
    await expect(page.getByTestId("invoice-card")).toHaveCount(0);
  });
});
