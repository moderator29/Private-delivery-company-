import { expect, test } from "@playwright/test";

import { TRACKING_PAYMENT_HOLD, collectConsoleErrors, main } from "./fixtures";

/**
 * A shipment stopped because its invoice is unpaid.
 *
 * What is protected here is mostly what the page does NOT say. A held shipment
 * has no schedule, so no date and no delivery window may appear where the
 * estimate sits: a visitor who reads a date off a held shipment will plan
 * around a day on which nothing is going to happen.
 */
test.describe("a shipment held for payment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/track/${TRACKING_PAYMENT_HOLD}`);
  });

  test("states the hold and its cause in the status itself", async ({
    page,
  }) => {
    await expect(
      page.getByText("Delivery On Hold — Waiting On Payment").first(),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The outstanding balance on the invoice below has not been received",
      ),
    ).toBeVisible();
  });

  test("puts the hold where the delivery date sits, not a date", async ({
    page,
  }) => {
    const estimate = page.getByTestId("delivery-estimate");

    await expect(estimate).toContainText("On Hold");
    // The window line is a dash, and no date survives in the row at all.
    await expect(estimate).toContainText("—");
    await expect(estimate).not.toContainText(/\d/);
    await expect(main(page).getByText("By 8:00 PM")).toHaveCount(0);
  });

  test("still shows the invoice that has to be paid to lift the hold", async ({
    page,
  }) => {
    await expect(page.getByText("Customs Clearance Fee")).toBeVisible();
    await expect(page.getByText("Import Processing Fee")).toBeVisible();
  });

  test("renders without console errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Tracking Result" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
});
