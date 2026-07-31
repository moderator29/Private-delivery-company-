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

  /**
   * One mailbox for everything. The business has a single published address,
   * and routing privacy or business enquiries to made-up aliases nobody reads
   * would be worse than sending them all somewhere a person actually looks.
   */
  supportEmail: "swifttracksupport@gmail.com",
  privacyEmail: "swifttracksupport@gmail.com",
  businessEmail: "swifttracksupport@gmail.com",
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
 * The support address is real. The mailing address below it is not yet, so this
 * stays true until that is confirmed too. docs/LAUNCH_CHECKLIST.md tracks it.
 *
 * There is deliberately no telephone number anywhere: support is by email only,
 * and publishing a number nobody answers is worse than publishing none.
 */
export const BRAND_CONTACT_IS_PLACEHOLDER = true;
