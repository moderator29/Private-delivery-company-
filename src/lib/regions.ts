/**
 * Service regions.
 *
 * The picker is a real preference, not decoration: choosing a region persists a
 * cookie and swaps the support number and hours shown in the header, footer and
 * contact page to the desk that actually covers that region.
 *
 * Language is listed per region because that is what a visitor expects to see,
 * but the site is published in English only today. The picker says so rather
 * than offering a language that would not change anything, which is the whole
 * difference between a preference and a prop.
 */

export interface Region {
  code: string;
  /** ISO country code, used for the flag. */
  country: string;
  name: string;
  /** Local desk covering this region. */
  supportPhone: string;
  supportHours: string;
  timeZoneLabel: string;
  languages: string[];
  /** The home market gets a note in the picker. */
  isHome?: boolean;
}

export const REGIONS: Region[] = [
  {
    code: "AE",
    country: "AE",
    name: "United Arab Emirates",
    supportPhone: "+971 4 555 0142",
    supportHours: "Sunday to Thursday, 8:00 AM to 8:00 PM GST",
    timeZoneLabel: "GST",
    languages: ["English"],
    isHome: true,
  },
  {
    code: "US",
    country: "US",
    name: "United States",
    supportPhone: "+1 (888) 555 0142",
    supportHours: "Monday to Friday, 8:00 AM to 8:00 PM ET",
    timeZoneLabel: "ET",
    languages: ["English"],
  },
  {
    code: "GB",
    country: "GB",
    name: "United Kingdom",
    supportPhone: "+44 20 7555 0142",
    supportHours: "Monday to Friday, 8:00 AM to 6:00 PM GMT",
    timeZoneLabel: "GMT",
    languages: ["English"],
  },
  {
    code: "IN",
    country: "IN",
    name: "India",
    supportPhone: "+91 22 5555 0142",
    supportHours: "Monday to Saturday, 9:00 AM to 7:00 PM IST",
    timeZoneLabel: "IST",
    languages: ["English"],
  },
];

export const REGION_COOKIE = "swifttrack_region";
export const DEFAULT_REGION = REGIONS[0];

export function findRegion(code: string | null | undefined): Region {
  if (!code) return DEFAULT_REGION;
  const upper = code.trim().toUpperCase();
  return REGIONS.find((region) => region.code === upper) ?? DEFAULT_REGION;
}
