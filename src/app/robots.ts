import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Individual tracking pages and the operations area are not for
        // indexing. Both also send noindex headers, so this is belt and braces.
        disallow: ["/admin", "/admin/", "/track/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
