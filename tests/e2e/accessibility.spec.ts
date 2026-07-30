import { expect, test } from "@playwright/test";

import { PUBLIC_PATHS, TRACKING_IN_TRANSIT, main } from "./fixtures";

test.describe("keyboard access", () => {
  test("the skip link is the first tab stop and becomes visible when focused", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    await expect(focused).toHaveText("Skip to main content");
    await expect(focused).toHaveAttribute("href", "#main");

    // Hidden until focused, and it must genuinely occupy space once it is.
    const box = await focused.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(1);
    expect(box!.height).toBeGreaterThan(1);
  });

  test("the skip link moves focus past the navigation to the main content", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/#main");
    await expect(page.locator("main#main")).toBeVisible();
  });

  test("the skip link is present on every public page", async ({ page }) => {
    for (const path of PUBLIC_PATHS) {
      await page.goto(path);
      await expect(
        page.getByRole("link", { name: "Skip to main content" }),
      ).toBeAttached();
    }
  });

  test("the tracking field is reachable and submittable from the keyboard", async ({
    page,
  }) => {
    await page.goto("/track");

    // The tracking page autofocuses its field, since that is its only purpose.
    await expect(main(page).getByTestId("tracking-input")).toBeFocused();
    await page.keyboard.type(TRACKING_IN_TRANSIT);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  });

  test("the page declares its language", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
