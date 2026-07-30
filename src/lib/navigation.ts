/**
 * Site navigation, defined once so the header, the footer and the sitemap can
 * never disagree about which pages exist.
 */

export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/track", label: "Track" },
  { href: "/ship", label: "Ship" },
  { href: "/services", label: "Services" },
  { href: "/business", label: "Business" },
  { href: "/support", label: "Support" },
];

export const FOOTER_NAV: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Shipping",
    items: [
      { href: "/track", label: "Track a shipment" },
      { href: "/ship", label: "Send a shipment" },
      { href: "/services", label: "Delivery services" },
      { href: "/business", label: "Business solutions" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About SwiftTrack" },
      { href: "/support", label: "Support centre" },
      { href: "/help", label: "Help and FAQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms of Service" },
    ],
  },
];

/** Every public route, used to generate the sitemap. */
export const PUBLIC_ROUTES = [
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

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/shipments", label: "Shipments" },
];
