// Shipping methods.
//
// The customer picks one at checkout, so this is a list, not a constant. The
// order records which was chosen — a dispute about when something should have
// arrived is unanswerable otherwise.
//
// ── Local pickup is in this list, and that is the point ────────────────────
//
// Added 2026-09-19. Collecting in person is not shipping, but it IS the same
// choice: exactly one of these happens to an order, the buyer makes the choice
// in the same place, and the order has to record which. Modelling it as a
// fourth method means the total, the snapshot, the order row and the admin
// queue all keep working untouched; modelling it as a separate flag beside the
// method would have created a second dimension that every one of them has to
// remember to read, and a state where both are set.
//
// What genuinely differs is the address — a collected order has none — and
// that difference is carried by `fulfilment` below and enforced by a CHECK
// constraint in supabase/shop_orders_pickup_migration.sql, not by convention.
//
// ── Prices ────────────────────────────────────────────────────────────────
//
// $12.00 / $20.00 / $49.00, raised from $7 / $12 / $49 on 2026-09-09 by Karim.
// Flat per order, not per vial and not by zone: one number the buyer can see
// before they commit, and the spread between zones on a sub-pound parcel is
// smaller than the packing cost either way. Each tier covers USPS at current
// commercial rates plus the box; the two fast tiers also absorb the cold pack,
// which is why overnight is priced as the cold-chain option rather than as a
// convenience upsell.
//
// The original numbers were set on 2026-09-07 before any parcel had shipped and
// were deliberately marked as provisional. Standard and Priority went up first
// because they were the two carrying the least margin over real postage plus
// packing; overnight already priced the cold pack in and did not move.
//
// These are still not quotes for a specific parcel. Re-price them again against
// real postage once a few orders have shipped and the actual box weight is
// known — `orderTotals()` snapshots the charge onto the order, so changing a
// number here never rewrites what a past customer paid.
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
  /**
   * Whether a parcel is posted or handed over in person.
   *
   * This is the discriminant, not the id. Everything downstream that has to
   * behave differently — the address requirement, the timeline wording, the
   * email — branches on this rather than string-matching 'pickup', so adding a
   * second collection point later is a row in this table and nothing else.
   */
  fulfilment: 'post' | 'collect'
}

export type ShippingMethodId = 'standard' | 'priority' | 'overnight' | 'pickup'

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    label: 'Standard',
    carrier: 'USPS Ground Advantage',
    transit: '2–5 business days',
    priceCents: 1200,
    guaranteed: false,
    fulfilment: 'post',
  },
  {
    id: 'priority',
    label: 'Priority',
    carrier: 'USPS Priority Mail',
    transit: '1–3 business days',
    priceCents: 2000,
    guaranteed: false,
    fulfilment: 'post',
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
    fulfilment: 'post',
  },
  {
    id: 'pickup',
    label: 'Local pickup',
    // Filled in from SHOP_PICKUP_AREA wherever this is rendered — see
    // `pickupLabel()`. The constant carries no place name, because this table
    // ships in the repo and the location does not.
    carrier: 'Collect in person',
    transit: 'ready within 1 business day of payment clearing',
    // Zero, and it means zero: nothing is posted, so there is no postage to
    // charge. This is the one method where 0 is a price rather than a missing
    // one, which is why `sellableMethods()` filters on null and never on
    // falsiness — a `!method.priceCents` test would quietly delist it.
    priceCents: 0,
    guaranteed: false,
    fulfilment: 'collect',
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
  'Every window above starts when payment clears — when the parcel is handed to USPS, or when your order is ready to collect — not when the order is placed. On the Zelle rail that can be the next business day.'

export function shippingMethod(id: string): ShippingMethod {
  const method = SHIPPING_METHODS.find((candidate) => candidate.id === id)
  if (!method) throw new Error(`no such shipping method: ${id}`)
  return method
}

/**
 * The methods that can currently be sold. A method with no price is filtered
 * out rather than shown at zero, which is what stops an unpriced method
 * reaching a checkout screen. All four are priced as of 2026-09-19.
 *
 * Note the test is against null, not against falsiness: local pickup is priced
 * at zero on purpose and must survive this filter.
 */
export function sellableMethods(): ShippingMethod[] {
  return SHIPPING_METHODS.filter((method) => method.priceCents !== null)
}

/** Whether this method is collected in person rather than posted. */
export function isCollection(id: ShippingMethodId): boolean {
  return shippingMethod(id).fulfilment === 'collect'
}

/**
 * The methods to offer on a checkout screen.
 *
 * Collection methods disappear entirely when the deployment has no pickup
 * location configured (`pickupLocation()` returns null). Offering a place we
 * cannot name would be worse than not offering it: the buyer would pick it,
 * pay, and then have nowhere to go. `createOrder` refuses the same case on the
 * server, so this filter is the courtesy and that one is the guard.
 */
export function checkoutMethods(pickupAvailable: boolean): ShippingMethod[] {
  return sellableMethods().filter(
    (method) => method.fulfilment !== 'collect' || pickupAvailable,
  )
}
