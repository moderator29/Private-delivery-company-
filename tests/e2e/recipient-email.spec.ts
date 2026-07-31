import { expect, test } from "@playwright/test";

import {
  TRACKING_AWAITING_EMAIL,
  TRACKING_IN_TRANSIT,
  collectConsoleErrors,
  main,
} from "./fixtures";

/**
 * The mock rewrites its fixture when it accepts an address, exactly as the real
 * function rewrites the row. That makes this suite stateful: once a test has
 * submitted, the shipment stays submitted for the rest of the run. Everything
 * that needs the form therefore runs before the test that fills it in, and the
 * file is serial so a parallel worker cannot reorder them.
 */
test.describe.configure({ mode: "serial" });

test.describe("a shipment waiting for the recipient's email", () => {
  test("asks for the address, right under the status", async ({ page }) => {
    await page.goto(`/track/${TRACKING_AWAITING_EMAIL}`);

    const card = page.getByTestId("recipient-email-card");
    await expect(card).toBeVisible();
    await expect(
      card.getByRole("heading", { name: "Recipient Email Required" }),
    ).toBeVisible();
    await expect(
      card.getByText(
        "To receive your payment instructions and supporting shipment documentation",
      ),
    ).toBeVisible();

    const input = card.getByLabel("Email address");
    await expect(input).toHaveAttribute("placeholder", "Enter your email address");
    // The card is the one thing the page wants from the visitor, so it holds
    // the cursor on arrival.
    await expect(input).toBeFocused();
  });

  test("keeps the button disabled until the address could be real", async ({ page }) => {
    await page.goto(`/track/${TRACKING_AWAITING_EMAIL}`);

    const card = page.getByTestId("recipient-email-card");
    const input = card.getByLabel("Email address");
    const submit = page.getByTestId("recipient-email-submit");

    await expect(submit).toBeDisabled();

    await input.fill("someone@");
    await expect(submit).toBeDisabled();
    // Nothing is said while the field is still being typed into.
    await expect(card.getByText(/Enter a complete email address/)).toHaveCount(0);

    await input.blur();
    await expect(card.getByText(/Enter a complete email address/)).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await input.fill("someone@example.com");
    await expect(submit).toBeEnabled();
    await expect(card.getByText(/Enter a complete email address/)).toHaveCount(0);
  });

  test("is absent from a shipment that is not asking for an address", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByTestId("recipient-email-card")).toHaveCount(0);
    await expect(page.getByTestId("recipient-email-received")).toHaveCount(0);
  });

  test("confirms receipt and files the scan without a reload", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/track/${TRACKING_AWAITING_EMAIL}`);

    const timeline = page.locator("ol").filter({ hasText: "Shipment Information Received" });
    await expect(timeline.getByText("Recipient Email Received")).toHaveCount(0);

    await page.getByTestId("recipient-email-card").getByLabel("Email address").fill("  Ines.Duarte@Example.COM  ");
    await page.getByTestId("recipient-email-submit").click();

    const confirmation = page.getByTestId("recipient-email-received");
    await expect(confirmation).toBeVisible();
    await expect(
      confirmation.getByRole("heading", { name: "Email Received Successfully" }),
    ).toBeVisible();
    await expect(confirmation).toContainText("Your email has been securely received.");
    await expect(
      confirmation.getByText(
        "Payment instructions and supporting shipment documentation will be sent to your email shortly.",
      ),
    ).toBeVisible();

    // The form is replaced, not merely hidden, so there is nothing to submit twice.
    await expect(page.getByTestId("recipient-email-card")).toHaveCount(0);

    // The revalidation the action triggers is what puts the new scan in the
    // timeline. No navigation happened.
    await expect(timeline.getByText("Recipient Email Received")).toBeVisible();
    await expect(
      timeline.getByText(
        "The recipient securely submitted an email address. Payment documentation is now being prepared.",
      ),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("stays confirmed when the page is opened again", async ({ page }) => {
    await page.goto(`/track/${TRACKING_AWAITING_EMAIL}`);

    await expect(page.getByTestId("recipient-email-received")).toBeVisible();
    await expect(page.getByTestId("recipient-email-card")).toHaveCount(0);
  });

  test("never shows the address back to whoever holds the tracking number", async ({ page }) => {
    await page.goto(`/track/${TRACKING_AWAITING_EMAIL}`);

    const body = (await main(page).innerText()).toLowerCase();
    expect(body).not.toContain("ines.duarte@example.com");
  });
});
