import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/env";
import { PUBLIC_ROUTES } from "@/lib/navigation";

/**
 * Only the public marketing and information pages. Individual tracking pages are
 * deliberately absent: they are personal to whoever holds the number, and each
 * one already sets robots noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/track" ? 0.9 : 0.6,
  }));
}
