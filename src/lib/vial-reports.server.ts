// Janoshik report codes, keyed by vial slug.
//
// SERVER ONLY. Never import this from a 'use client' module, and never put a
// code into an API response. Each one resolves to a public Janoshik page that
// names the client, the manufacturer and a supplier-prefixed batch number, so
// publishing one publishes the supply chain. See decision D3 in
// docs/superpowers/specs/2026-09-04-peptide-shop-design.md.
//
// These lived on Vial in catalog.ts until 2026-09-04. catalog.ts is imported by
// nine client components, so all 27 were in the public bundle, rendering
// nothing.

export const REPORT_CODES: Record<string, string> = {
  '102107-RT_30_D14D7EHWHFH9': 'D14D7EHWHFH9',
  '102108-RT_60_8S1BF8KMN7IM': '8S1BF8KMN7IM',
  '102109-Tesa_10_6757MQWXFMZP': '6757MQWXFMZP',
  '102111-Motc_10_VJUDHK6MDGT3': 'VJUDHK6MDGT3',
  '102112-Ghk_cu_100_SYH79DCV36D1': 'SYH79DCV36D1',
  '102113-KLOW_80mg_XAKRSW4WN85N': 'XAKRSW4WN85N',
  '68244-T30_2W48EUV1JHUK': '2W48EUV1JHUK',
  '68243-R30_1WL2W46TW4DP': '1WL2W46TW4DP',
  '69769-HGH_24iu_B7EZMSYUP645': 'B7EZMSYUP645',
  '58538-Semaglutide_10_mg_UPNT8Z2I7C1K': 'UPNT8Z2I7C1K',
  '58539-Tirzepatide_15_mg_U4HBJNTSB74U': 'U4HBJNTSB74U',
  '63067-Semaglutide_20mg_Y2KNHJ2PWV1E': 'Y2KNHJ2PWV1E',
  '63068-Tirzepatide_30mg_LT78Z3CNK1EU': 'LT78Z3CNK1EU',
  '63069-Tirzepatide_60mg_JHRHW7ZN6YY5': 'JHRHW7ZN6YY5',
  '63070-Retatrutide_20mg_WPDWU5NYUUME': 'WPDWU5NYUUME',
  '63071-Retatrutide_30mg_CBRF2LN5Y16E': 'CBRF2LN5Y16E',
  '63073-Cagrilintide_5mg_KRHZKWLHPA4B': 'KRHZKWLHPA4B',
  '63074-BPC157_10mg_2ST291UD8DZM': '2ST291UD8DZM',
  '63075-TB500_10mg_EVT1A19Z6ZCT': 'EVT1A19Z6ZCT',
  '70680-R10_B42S8WIZGV9J': 'B42S8WIZGV9J',
  '70681-R20_7CCZE6G5K6W8': '7CCZE6G5K6W8',
  '70683-T60_M3Y3RA1QUDH4': 'M3Y3RA1QUDH4',
  '70756-Glow_70_Y2BRUZN3F7HG': 'Y2BRUZN3F7HG',
  '205037-Tr_10_mg_MDTR34NN18JH': 'MDTR34NN18JH',
  '205038-Tr_30mg_UZMJ2BZU2N7V': 'UZMJ2BZU2N7V',
  '205039-Tr_40mg_9XKFJS7PIVZL': '9XKFJS7PIVZL',
  '205040-Rt_10mg_MKF4CLBUWS7F': 'MKF4CLBUWS7F',
}
