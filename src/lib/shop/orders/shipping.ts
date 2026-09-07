// Shipping methods.
//
// The customer picks one at checkout, so this is a list, not a constant. The
// order records which was chosen — a dispute about when something should have
// arrived is unanswerable otherwise.
//
// ── Prices, set 2026-09-07 by Karim ───────────────────────────────────────
//
// $7.00 / $12.00 / $49.00. Flat per order, not per vial and not by zone: one
// number the buyer can see before they commit, and the spread between zones on
// a sub-pound parcel is smaller than the packing cost either way. Each tier
// covers USPS at current commercial rates plus the box; the two fast tiers also
// absorb the cold pack, which is why overnight is priced as the cold-chain
// option rather than as a convenience upsell.
//
// These are not quotes for a specific parcel. Re-price them against real
// postage once a few orders have shipped and the actual box weight is known —
// `orderTotals()` snapshots the charge onto the order, so changing a number
// here never rewrites what a past customer paid.
//
// ── The trap in offering overnight, and how it is handled ─────────────────
//
// Transit time starts when the parcel is handed over, not when the order is
// placed, and payment confirmation on the Zelle rail is manual — an order can
// sit in awaiting_payment until Karim next checks the bank. So a next-day
// SERVICE cannot honestly be sold as next-day DELIVERY on that rail.
//
// Resolved 2026-09-07: all three methods stay available on both rails, and
// every window is worded as running from PAYMENT CLEARING rather than from
// checkout. `transitFrom` below is that wording, and the checkout screen
// prints it under the method list. The alternative — hiding overnight unless
// BTCPay is selected — was considered and turned down: it makes the method
// list depend on the payment rail, and two selections that quietly change each
// other are worse than one honest sentence.
//
// ── Cold chain ────────────────────────────────────────────────────────────
//
// Lyophilized powder is stable at ambient for these transit windows; the 2–8 °C
// on the label is post-reconstitution storage. If a cold pack is added anyway —
// and buyers in this market expect one — it is only still cold on arrival at the
// faster end of this list, which is an argument for pricing overnight as the
// cold-chain option rather than as a convenience upsell.

export interface ShippingMethod {
  id: ShippingMethodId
  label: string
  carrier: string
  /** What the carrier promises, in business days, from handover. */
  transit: string
  /** In cents. Null means unsellable — see `sellableMethods`. */
  priceCents: number | null
  /** Whether the carrier guarantees the window or merely estimates it. */
  guaranteed: boolean
}

export type ShippingMethodId = 'standard' | 'priority' | 'overnight'

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    label: 'Standard',
    carrier: 'USPS Ground Advantage',
    transit: '2–5 business days',
    priceCents: 700,
    guaranteed: false,
  },
  {
    id: 'priority',
    label: 'Priority',
    carrier: 'USPS Priority Mail',
    transit: '1–3 business days',
    priceCents: 1200,
    guaranteed: false,
  },
  {
    id: 'overnight',
    label: 'Overnight',
    carrier: 'USPS Priority Mail Express',
    transit: 'next business day',
    priceCents: 4900,
    // The only one of the three the carrier actually guarantees, which is why it
    // is also the only one worth promising a date on.
    guaranteed: true,
  },
]

/**
 * When every transit window above starts.
 *
 * Printed wherever the windows are, because on the Zelle rail the gap between
 * "order placed" and "parcel handed over" is however long it takes someone to
 * check a bank account. A window quoted from checkout would be a promise the
 * slower rail cannot keep. See the note at the top of this file.
 */
export const TRANSIT_FROM =
  'Every window above starts when payment clears and the parcel is handed to USPS, not when the order is placed. On the Zelle rail that can be the next business day.'

export function shippingMethod(id: string): ShippingMethod {
  const method = SHIPPING_METHODS.find((candidate) => candidate.id === id)
  if (!method) throw new Error(`no such shipping method: ${id}`)
  return method
}

/**
 * The methods that can currently be sold. A method with no price is filtered
 * out rather than shown at zero, which is what stops an unpriced method
 * reaching a checkout screen. All three are priced as of 2026-09-07.
 */
export function sellableMethods(): ShippingMethod[] {
  return SHIPPING_METHODS.filter((method) => method.priceCents !== null)
}
