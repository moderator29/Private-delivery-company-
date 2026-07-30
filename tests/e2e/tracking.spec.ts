import { expect, test } from "@playwright/test";

import {
  TRACKING_DELAYED,
  TRACKING_DELIVERED,
  TRACKING_IN_TRANSIT,
  TRACKING_UNKNOWN,
  collectConsoleErrors,
} from "./fixtures";

test.describe("tracking a valid shipment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("shows the current status and the grouped tracking ID", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tracking Result" })).toBeVisible();
    await expect(page.getByTestId("tracking-id")).toHaveText("STX9 8475 6532 US");
    // The status appears as the live chip beside the heading and again in the
    // detail table, so scope the assertion to the chip.
    await expect(page.getByText("In transit").first()).toBeVisible();
  });

  test("shows the route map with both endpoints", async ({ page }) => {
    const map = page.getByRole("img", { name: /Route map from .* to .*/ });
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute(
      "aria-label",
      /Dubai, United Arab Emirates.*Miami, Florida, United States/,
    );
    // Stated plainly on the page, because the marker is a progress summary.
    await expect(page.getByText("SwiftTrack does not publish live GPS positions.")).toBeVisible();
  });

  test("names the sender and the recipient", async ({ page }) => {
    await expect(page.getByText("Andrew Goodson")).toBeVisible();
    await expect(page.getByText("Rafael S Angarita")).toBeVisible();
    await expect(page.getByText("15440 SW 74th Circle Ct #604")).toBeVisible();
  });

  test("summarises the package and the delivery estimate", async ({ page }) => {
    await expect(page.getByText("Standard Delivery")).toBeVisible();
    await expect(page.getByText("0.05 kg")).toBeVisible();
    await expect(page.getByText("August 6, 2026")).toBeVisible();
    await expect(page.getByText("By 8:00 PM")).toBeVisible();
  });
});

test.describe("shipment progress", () => {
  test("lists recorded scans in order, then the milestones still expected", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);

    const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
    const steps = progress.locator("> li");

    await expect(steps).toHaveCount(7);
    await expect(steps.nth(0)).toContainText("Shipment Information Received");
    await expect(steps.nth(1)).toContainText("Picked Up");
    await expect(steps.nth(2)).toContainText("Departed Origin Facility");
    await expect(steps.nth(3)).toContainText("In Transit");
    await expect(steps.nth(4)).toContainText("Arrived at Destination Country");
    await expect(steps.nth(5)).toContainText("Out for Delivery");
    await expect(steps.nth(6)).toContainText("Delivered");
  });

  test("timestamps the recorded scans in chronological order", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);

    const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
    const stamps = await progress.locator("> li time").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("datetime") ?? ""),
    );

    expect(stamps).toHaveLength(4);
    const sorted = [...stamps].sort((a, b) => Date.parse(a) - Date.parse(b));
    expect(stamps).toEqual(sorted);
  });

  test("labels future milestones as expected rather than dating them", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);

    const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
    // Three milestones remain after "In Transit", each shown without a time.
    await expect(progress.getByText("Expected", { exact: true })).toHaveCount(3);

    const projected = progress.locator("> li").nth(6);
    await expect(projected).toContainText("Expected");
    await expect(projected.locator("time")).toHaveCount(0);
  });
});

test.describe("a delivered shipment", () => {
  test("shows the delivered state and the delivery time", async ({ page }) => {
    await page.goto(`/track/${TRACKING_DELIVERED}`);

    await expect(page.getByText("Delivered").first()).toBeVisible();
    await expect(page.getByText("The package has been delivered.")).toBeVisible();
    await expect(page.getByText("August 3, 2026 6:25 PM GST")).toBeVisible();
  });

  test("offers the rating form", async ({ page }) => {
    await page.goto(`/track/${TRACKING_DELIVERED}`);

    await expect(page.getByRole("heading", { name: "How was this delivery?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /5 stars/ })).toBeAttached();
    // The button stays disabled until a rating is chosen.
    const submit = page.getByRole("button", { name: "Submit rating" });
    await expect(submit).toBeDisabled();
    await page.getByRole("radio", { name: /4 stars/ }).check();
    await expect(submit).toBeEnabled();
  });

  test("stops projecting milestones once the journey is over", async ({ page }) => {
    await page.goto(`/track/${TRACKING_DELIVERED}`);

    const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
    await expect(progress.locator("> li")).toHaveCount(6);
    await expect(progress.getByText("Expected", { exact: true })).toHaveCount(0);
  });

  test("does not offer a rating form on a shipment still in transit", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByRole("heading", { name: "How was this delivery?" })).toHaveCount(0);
  });
});

test.describe("a shipment needing attention", () => {
  test("raises the alert and keeps the route marker still", async ({ page }) => {
    await page.goto(`/track/${TRACKING_DELAYED}`);

    const alert = page.getByRole("alert").filter({ hasText: "This shipment is marked delayed" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Contact support with your tracking number");

    // The delay itself is a recorded scan, so it appears in the timeline.
    await expect(page.getByText("Delayed in Transit")).toBeVisible();
  });

  test("does not raise the alert on a healthy shipment", async ({ page }) => {
    await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
    await expect(page.getByText(/This shipment is marked/)).toHaveCount(0);
  });
});

test.describe("an unknown tracking number", () => {
  test("shows the polished not-found state", async ({ page }) => {
    const response = await page.goto(`/track/${TRACKING_UNKNOWN}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "We could not find that shipment" })).toBeVisible();
    await expect(page.getByText("No shipment matches that tracking number")).toBeVisible();
    // A dead end is not acceptable: the visitor is offered another try.
    await expect(page.getByTestId("tracking-input")).toBeVisible();
    await expect(page.getByRole("link", { name: "Tracking support" })).toBeVisible();
  });

  test("leaks no database or infrastructure wording", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/track/${TRACKING_UNKNOWN}`);

    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const leak of [
      "supabase",
      "postgres",
      "postgrest",
      "sql",
      "database",
      "rpc",
      "null",
      "undefined",
      "stack",
      "pgrst",
    ]) {
      expect(body, `not-found page must not mention "${leak}"`).not.toContain(leak);
    }

    expect(errors).toEqual([]);
  });

  test("answers a malformed number exactly as it answers an unknown one", async ({ page }) => {
    // Distinguishing them would confirm which well formed numbers are real.
    await page.goto("/track/NOT-A-TRACKING-NUMBER");
    await expect(page.getByRole("heading", { name: "We could not find that shipment" })).toBeVisible();
  });
});
