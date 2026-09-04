// Janoshik report codes, keyed by lot.
//
// SERVER ONLY. Never import this from a 'use client' module and never put a
// code into an API response. Each resolves to a public Janoshik page naming the
// client, the manufacturer and a supplier-prefixed batch, so publishing one
// publishes the supply chain. Decision D3 in
// docs/superpowers/specs/2026-09-04-peptide-shop-design.md.
//
// Keyed by lot rather than slug because slugs used to END with the code, which
// leaked it right back into the bundle they were removed from. Lots are the
// durable identifier and carry nothing secret.

export const REPORT_CODES: Record<string, string> = {
  'JA-102107': 'D14D7EHWHFH9',
  'JA-102108': '8S1BF8KMN7IM',
  'JA-102109': '6757MQWXFMZP',
  'JA-102111': 'VJUDHK6MDGT3',
  'JA-102112': 'SYH79DCV36D1',
  'JA-102113': 'XAKRSW4WN85N',
  'JA-68244': '2W48EUV1JHUK',
  'JA-68243': '1WL2W46TW4DP',
  'JA-69769': 'B7EZMSYUP645',
  'JA-58538': 'UPNT8Z2I7C1K',
  'JA-58539': 'U4HBJNTSB74U',
  'JA-63067': 'Y2KNHJ2PWV1E',
  'JA-63068': 'LT78Z3CNK1EU',
  'JA-63069': 'JHRHW7ZN6YY5',
  'JA-63070': 'WPDWU5NYUUME',
  'JA-63071': 'CBRF2LN5Y16E',
  'JA-63073': 'KRHZKWLHPA4B',
  'JA-63074': '2ST291UD8DZM',
  'JA-63075': 'EVT1A19Z6ZCT',
  'JA-70680': 'B42S8WIZGV9J',
  'JA-70681': '7CCZE6G5K6W8',
  'JA-70683': 'M3Y3RA1QUDH4',
  'JA-70756': 'Y2BRUZN3F7HG',
  'JA-205037': 'MDTR34NN18JH',
  'JA-205038': 'UZMJ2BZU2N7V',
  'JA-205039': '9XKFJS7PIVZL',
  'JA-205040': 'MKF4CLBUWS7F',
}
