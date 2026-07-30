import { cookies } from "next/headers";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { findRegion, REGION_COOKIE } from "@/lib/regions";

/**
 * Shell for every public page. The admin area has its own layout so operations
 * chrome never appears on a customer facing page and vice versa.
 *
 * The region cookie is read here rather than in the header component so the
 * first paint already carries the visitor's choice, with no flash of the default.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const region = findRegion(cookieStore.get(REGION_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader region={region} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter region={region} />
    </div>
  );
}
