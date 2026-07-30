/**
 * Brand constants.
 *
 * Every customer-facing occurrence of the company name, descriptor, address or
 * support contact reads from here, so the identity cannot drift between the
 * header, the legal pages, the metadata and the admin area.
 *
 * The approved descriptor is "Private Delivery Company". "Delivery Services" is
 * not used anywhere.
 */

export const BRAND = {
  name: "SwiftTrack",
  legalName: "SwiftTrack Private Delivery Company",
  descriptor: "Private Delivery Company",
  tagline: "Private delivery, tracked end to end.",

  /** Head office and primary gateway. */
  headquarters: {
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
  },

  supportEmail: "support@swifttrack.example",
  privacyEmail: "privacy@swifttrack.example",
  businessEmail: "business@swifttrack.example",
  supportPhone: "+971 4 555 0142",
  supportHours: "Sunday to Thursday, 8:00 AM to 8:00 PM GST",

  mailingAddress: {
    line1: "Jebel Ali Free Zone, Building A4",
    line2: "Office 1204",
    city: "Dubai",
    postalCode: "P.O. Box 261204",
    country: "United Arab Emirates",
  },
} as const;

/**
 * The contact details above are placeholders for a business that has not
 * published its real ones yet. They deliberately use the reserved example.com
 * domain rather than a plausible-looking address, so nothing here can route a
 * real customer to a mailbox nobody reads.
 *
 * Replace them before launch. docs/LAUNCH_CHECKLIST.md tracks this.
 */
export const BRAND_CONTACT_IS_PLACEHOLDER = true;
