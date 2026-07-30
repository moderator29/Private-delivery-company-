/**
 * Shared constants and helpers for the browser tests.
 *
 * The tracking IDs are the canonical (folded) forms served by
 * tests/mock-supabase.mjs. See the note there about why "STDELIVERED1US" is
 * looked up as "STDE11VERED1US".
 */

import type { ConsoleMessage, Page } from "@playwright/test";

export const TRACKING_IN_TRANSIT = "STX984756532US";
export const TRACKING_DELIVERED = "STDE11VERED1US";
export const TRACKING_DELAYED = "STDE1AYED123US";
export const TRACKING_UNKNOWN = "STZZ999999ZZUS";

/** Every page a visitor can reach without a tracking number or an account. */
export const PUBLIC_PATHS = [
  "/",
  "/track",
  "/ship",
  "/services",
  "/business",
  "/about",
  "/support",
  "/help",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
] as const;

/**
 * Collects console errors and page exceptions for the life of the page.
 *
 * React logs hydration and prop problems as console errors, so an empty list is
 * a meaningful signal that a page rendered cleanly rather than merely returning
 * a 200.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  return errors;
}

/** True when the document scrolls sideways, which no layout here should. */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    // One pixel of slack absorbs sub-pixel rounding at fractional zoom levels.
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}
