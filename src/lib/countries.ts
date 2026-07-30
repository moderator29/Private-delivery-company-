/**
 * ISO 3166-1 alpha-2 codes to display names, for the countries SwiftTrack
 * currently serves plus the major destinations.
 *
 * Kept as a small explicit map rather than pulling in a full country package:
 * the list is short, it is the same list the admin form offers, and it means a
 * typo in a country code shows up as an unmapped code rather than silently
 * rendering a wrong name.
 */

export const COUNTRY_NAMES: Record<string, string> = {
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  IE: "Ireland",
  FR: "France",
  DE: "Germany",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  CH: "Switzerland",
  SE: "Sweden",
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  PH: "Philippines",
  SG: "Singapore",
  MY: "Malaysia",
  CN: "China",
  HK: "Hong Kong",
  JP: "Japan",
  KR: "South Korea",
  AU: "Australia",
  NZ: "New Zealand",
  ZA: "South Africa",
  EG: "Egypt",
  NG: "Nigeria",
  KE: "Kenya",
  TR: "Turkey",
  JO: "Jordan",
  LB: "Lebanon",
  BR: "Brazil",
  MX: "Mexico",
};

/** Short forms used where a full name would wrap awkwardly, such as map labels. */
const SHORT_NAMES: Record<string, string> = {
  AE: "UAE",
  US: "USA",
  GB: "UK",
};

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return COUNTRY_NAMES[upper] ?? upper;
}

export function countryShortName(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return SHORT_NAMES[upper] ?? COUNTRY_NAMES[upper] ?? upper;
}

/** Sorted options for the admin country selects. */
export const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));
