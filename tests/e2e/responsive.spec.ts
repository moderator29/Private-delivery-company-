import { expect, test } from "@playwright/test";

import { TRACKING_IN_TRANSIT, hasHorizontalOverflow } from "./fixtures";

/**
 * Nothing may scroll sideways.
 *
 * A tracking page carries a fixed width map, a long address and a wide summary
 * strip, which is exactly where horizontal overflow tends to appear first, so
 * it is checked alongside the home page at a phone, a tablet and a desktop
 * width.
 */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const PAGES = [
  { name: "home", path: "/" },
  { name: "tracking result", path: `/track/${TRACKING_IN_TRANSIT}` },
] as const;

for (const viewport of VIEWPORTS) {
  for (const target of PAGES) {
    test(`${target.name} has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(target.path);
      await page.waitForLoadState("networkidle");

      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
}

test("the tracking result stays readable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/track/${TRACKING_IN_TRANSIT}`);

  // The two column desktop layout must collapse rather than clip.
  await expect(page.getByTestId("tracking-id")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shipment Progress" }),
  ).toBeVisible();

  const box = await page.getByTestId("tracking-id").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
