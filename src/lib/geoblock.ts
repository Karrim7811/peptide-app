// EU member states + EEA (Iceland, Liechtenstein, Norway).
// GDPR applies the moment a user is located in any of these jurisdictions.
// Until we ship the full compliance package (DPA with processors, cookie
// banner, data export / deletion endpoints, EU representative if processing
// at scale), we geoblock at the edge — see CLAUDE.md S16.11.
//
// UK is post-Brexit but retains UK GDPR. Switzerland has FADP. Both create
// similar compliance surface. Including them keeps the block conservative;
// remove from the list when we are ready to enter those markets.
export const BLOCKED_COUNTRIES: ReadonlySet<string> = new Set([
  // EU-27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA
  'IS', 'LI', 'NO',
  // UK and Switzerland — UK GDPR + Swiss FADP
  'GB', 'CH',
])

export function isBlockedCountry(country: string | undefined | null): boolean {
  return !!country && BLOCKED_COUNTRIES.has(country.toUpperCase())
}
