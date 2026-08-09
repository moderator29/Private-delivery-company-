import { expect, test } from "@playwright/test";

import { TRACKING_PAID, collectConsoleErrors, main } from "./fixtures";

/**
 * A shipment whose invoice has been paid.
 *
 * The assertions that matter most here are the negative ones. Once the money is
 * in, the wallet address and the "I've Sent Payment" button must be gone: a
 * recipient who sees them on a settled shipment can reasonably conclude the
 * first payment did not land, and Bitcoin sent twice is gone twice.
 */
test.describe("a shipment that has been paid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/track/${TRACKING_PAID}`);
  });

  test("shows a receipt in place of the invoice", async ({ page }) => {
    const receipt = page.getByTestId("payment-receipt");
    await expect(receipt).toBeVisible();
    await expect(
      receipt.getByRole("heading", { name: "Payment Received" }),
    ).toBeVisible();
    await expect(receipt.getByTestId("paid-badge")).toContainText("Paid in full");
    await expect(receipt).toContainText("Nothing further is owed");

    // The invoice card, the wallet and the button are all gone.
    await expect(page.getByTestId("invoice-card")).toHaveCount(0);
    await expect(page.getByTestId("wallet-address")).toHaveCount(0);
    await expect(page.getByTestId("sent-payment-button")).toHaveCount(0);
    await expect(page.getByTestId("confirm-payment-dialog")).toHaveCount(0);
  });

  test("keeps the breakdown of what was paid, in the past tense", async ({
    page,
  }) => {
    const receipt = page.getByTestId("payment-receipt");
    const items = receipt.getByTestId("receipt-items");

    await expect(items.getByText("Customs Clearance Fee")).toBeVisible();
    await expect(items.getByText("USD 1,500")).toBeVisible();
    await expect(items.getByText("Import Processing Fee")).toBeVisible();
    await expect(items.getByText("Documentation Fee")).toBeVisible();

    await expect(receipt.getByTestId("receipt-total")).toHaveText("USD 3,000");
    await expect(receipt).toContainText("Total Paid");
    // Nothing on the page may still describe the amount as outstanding.
    await expect(main(page).getByText("Total Amount Due")).toHaveCount(0);
  });

  test("dates the payment and names how it was made", async ({ page }) => {
    const receipt = page.getByTestId("payment-receipt");
    await expect(receipt.getByTestId("receipt-received-at")).toHaveAttribute(
      "datetime",
      /^2026-08-09T/,
    );
    await expect(receipt).toContainText("Bitcoin (BTC)");
  });

  test("carries on showing the shipment as on its way", async ({ page }) => {
    await expect(page.getByTestId("arrival-countdown")).toBeVisible();
    await expect(page.getByText("In transit").first()).toBeVisible();
  });

  test("renders without console errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.reload();
    await expect(page.getByTestId("payment-receipt")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
