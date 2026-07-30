import { expect, test } from "@playwright/test";

import { TRACKING_IN_TRANSIT } from "./fixtures";

test.describe("the tracking form on the home page", () => {
  test("navigates to the shipment when a valid number is submitted", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("tracking-input").first().fill(TRACKING_IN_TRANSIT);
    await page.getByTestId("track-submit").first().click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByTestId("tracking-id")).toHaveText("STX9 8475 6532 US");
  });

  test("accepts the spaced form a customer copies from an email", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("tracking-input").first().fill("stx9 8475 6532 us");
    await page.getByTestId("track-submit").first().click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("shows an inline error for junk and stays on the page", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("tracking-input").first().fill("not-a-tracking-number");
    await page.getByTestId("track-submit").first().click();

    const error = page.getByRole("alert").filter({ hasText: "A SwiftTrack tracking number is 14" });
    await expect(error).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("asks for a number when the field is empty, without navigating", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("track-submit").first().click();

    await expect(page.getByText("Enter a tracking number to continue.")).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("clears the error as soon as the visitor starts correcting it", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("tracking-input").first();
    await input.fill("junk");
    await page.getByTestId("track-submit").first().click();
    await expect(page.getByRole("alert")).toBeVisible();

    await input.fill(TRACKING_IN_TRANSIT);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("associates the error with the field for assistive technology", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("tracking-input").first();
    await input.fill("junk");
    await page.getByTestId("track-submit").first().click();

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "tracking-number-error");
  });
});

test.describe("the tracking form without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("still works as a GET form that redirects to the shipment", async ({ page }) => {
    // The form posts to /track with ?id=, which is the no-JS fallback path.
    await page.goto("/");
    await page.getByTestId("tracking-input").first().fill(TRACKING_IN_TRANSIT);
    await page.getByTestId("track-submit").first().click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("explains an invalid number on the tracking page", async ({ page }) => {
    await page.goto("/track?id=junk");
    await expect(
      page.getByText("That does not look like a SwiftTrack tracking number"),
    ).toBeVisible();
  });
});
