// Shipping methods.
//
// The customer picks one at checkout, so this is a list, not a constant. The
// order records which was chosen — a dispute about when something should have
// arrived is unanswerable otherwise.
//
// ── Prices are deliberately null ──────────────────────────────────────────
//
// The carrier, the service and the transit window below are researched choices.
// The prices are not, and inventing them a second time would be worse than the
// first. Price your actual box, with your actual packing, at current commercial
// rates and set them here. Nothing can be ordered until they are set.
//
// ── The trap in offering overnight ────────────────────────────────────────
//
// Transit time starts when the parcel is handed over, not when the order is
// placed, and payment confirmation on the Zelle rail is manual — an order can
// sit in awaiting_payment until Karim next checks the bank. So a next-day
// SERVICE cannot honestly be sold as next-day DELIVERY on that rail. Either
// offer overnight only alongside BTCPay, which settles in minutes, or word every
// estimate as running from payment clearing rather than from checkout.
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
  /** In cents. Null until priced — see the note above. */
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
    priceCents: null,
    guaranteed: false,
  },
  {
    id: 'priority',
    label: 'Priority',
    carrier: 'USPS Priority Mail',
    transit: '1–3 business days',
    priceCents: null,
    guaranteed: false,
  },
  {
    id: 'overnight',
    label: 'Overnight',
    carrier: 'USPS Priority Mail Express',
    transit: 'next business day',
    priceCents: null,
    // The only one of the three the carrier actually guarantees, which is why it
    // is also the only one worth promising a date on.
    guaranteed: true,
  },
]

export function shippingMethod(id: string): ShippingMethod {
  const method = SHIPPING_METHODS.find((candidate) => candidate.id === id)
  if (!method) throw new Error(`no such shipping method: ${id}`)
  return method
}

/**
 * The methods that can currently be sold. Empty until prices are set, which is
 * what stops an unpriced method reaching a checkout screen.
 */
export function sellableMethods(): ShippingMethod[] {
  return SHIPPING_METHODS.filter((method) => method.priceCents !== null)
}
