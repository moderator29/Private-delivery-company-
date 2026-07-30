import { expect, test } from "@playwright/test";

import { TRACKING_IN_TRANSIT, main } from "./fixtures";

test.describe("the tracking form on the home page", () => {
  test("navigates to the shipment when a valid number is submitted", async ({
    page,
  }) => {
    await page.goto("/");

    await main(page).getByTestId("tracking-input").fill(TRACKING_IN_TRANSIT);
    await main(page).getByTestId("track-submit").click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByTestId("tracking-id")).toHaveText(
      "STX9 8475 6532 US",
    );
  });

  test("accepts the spaced form a customer copies from an email", async ({
    page,
  }) => {
    await page.goto("/");

    await main(page).getByTestId("tracking-input").fill("stx9 8475 6532 us");
    await main(page).getByTestId("track-submit").click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("shows an inline error for junk and stays on the page", async ({
    page,
  }) => {
    await page.goto("/");

    await main(page)
      .getByTestId("tracking-input")
      .fill("not-a-tracking-number");
    await main(page).getByTestId("track-submit").click();

    await expect(main(page).getByRole("alert")).toContainText(
      "A SwiftTrack tracking number is 14 characters",
    );
    await expect(page).toHaveURL("/");
  });

  test("asks for a number when the field is empty, without navigating", async ({
    page,
  }) => {
    await page.goto("/");

    await main(page).getByTestId("track-submit").click();

    await expect(main(page).getByRole("alert")).toHaveText(
      "Enter a tracking number to continue.",
    );
    await expect(page).toHaveURL("/");
  });

  test("clears the error as soon as the visitor starts correcting it", async ({
    page,
  }) => {
    await page.goto("/");

    const input = main(page).getByTestId("tracking-input");
    await input.fill("junk");
    await main(page).getByTestId("track-submit").click();
    await expect(main(page).getByRole("alert")).toBeVisible();

    await input.fill(TRACKING_IN_TRANSIT);
    await expect(main(page).getByRole("alert")).toHaveCount(0);
  });

  test("associates the error with the field for assistive technology", async ({
    page,
  }) => {
    await page.goto("/");

    const input = main(page).getByTestId("tracking-input");
    await input.fill("junk");
    await main(page).getByTestId("track-submit").click();

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      "tracking-number-error",
    );
  });
});

test.describe("the tracking form without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("still works as a GET form that redirects to the shipment", async ({
    page,
  }) => {
    // The form posts to /track with ?id=, which is the no-JS fallback path.
    await page.goto("/");
    await main(page).getByTestId("tracking-input").fill(TRACKING_IN_TRANSIT);
    await main(page).getByTestId("track-submit").click();

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("explains an invalid number on the tracking page", async ({ page }) => {
    await page.goto("/track?id=junk");
    await expect(
      page.getByText("That does not look like a SwiftTrack tracking number"),
    ).toBeVisible();
  });
});
