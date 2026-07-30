import { expect, test } from "@playwright/test";

/**
 * An unauthorised visitor must not reach admin data.
 *
 * The redirect is only the outermost of three layers: each admin page also
 * calls requireAdmin() in the request that reads data, and Row Level Security
 * sits under that. These tests cover the layer a browser can observe.
 */
test.describe("unauthorised access to the admin area", () => {
  const guarded = ["/admin", "/admin/shipments", "/admin/shipments/new"];

  for (const path of guarded) {
    test(`redirects a signed-out visitor from ${path} to the sign-in page`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(`/admin/login\\?next=${encodeURIComponent(path)}$`));
      await expect(page.getByRole("heading", { name: "Operations sign in" })).toBeVisible();
    });
  }

  test("never renders operational data on the way to the sign-in page", async ({ page }) => {
    await page.goto("/admin/shipments");

    const body = await page.locator("body").innerText();
    // The one shipment in the fixtures must not appear anywhere in the response
    // a signed-out visitor receives.
    expect(body).not.toContain("STX9");
    expect(body).not.toContain("Andrew Goodson");
  });

  test("keeps the sign-in page itself reachable", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Operations sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("keeps the admin area out of the search index", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
