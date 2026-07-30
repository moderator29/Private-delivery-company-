import { expect, test } from "@playwright/test";

import { PUBLIC_PATHS, collectConsoleErrors } from "./fixtures";

test.describe("public pages", () => {
  for (const path of PUBLIC_PATHS) {
    test(`${path} returns 200 and renders without console errors`, async ({
      page,
    }) => {
      const errors = collectConsoleErrors(page);

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      // Every page must announce itself with exactly one top level heading.
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toBeVisible();

      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }

  test("every page has a title and a meta description", async ({ page }) => {
    for (const path of PUBLIC_PATHS) {
      await page.goto(path);
      expect(await page.title(), `title on ${path}`).not.toBe("");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.{20,}/,
        { timeout: 5_000 },
      );
    }
  });

  test("the header and footer are present on every page", async ({ page }) => {
    for (const path of PUBLIC_PATHS) {
      await page.goto(path);
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    }
  });

  test("robots.txt and the sitemap are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("User-Agent");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("an unknown URL renders the not-found page rather than an error", async ({
    page,
  }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
