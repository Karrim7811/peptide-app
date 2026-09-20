// The pickup location, as the buyer will actually see it.
//
// Read in one place because three surfaces show it — the checkout screen, the
// order page and the confirmation email — and a buyer who is told one address
// and turns up at another has been sent to the wrong door.
//
// ── Why it is all env, and none of it is a constant ───────────────────────
//
// Same reason the Zelle account is (see zelle-account.ts): this is deployment
// configuration, and the app must never name a physical place the deployment
// has not been given. A hard-coded address would ship in the repo, be wrong the
// first time it moved, and be wrong silently.
//
// It is also the availability switch. `SHOP_PICKUP_AREA` unset means pickup is
// not offered at all — not offered-and-broken, not offered-with-a-blank — and
// `createOrder` refuses a pickup order on a deployment that has no location,
// so the method cannot be selected through a stale page or a crafted request.
//
// ── Why the area and the street address are two fields ────────────────────
//
// The area ("Coral Gables, FL") is public: it is what a buyer needs in order to
// decide whether collecting is realistic for them, and it goes on the checkout
// screen. The street address is given after the order exists — on the order
// page and in the confirmation email — because a specific door is worth showing
// to someone who has actually bought something, not to every visitor who
// reaches the checkout. Set both.

export interface PickupLocation {
  /** Public. What the checkout screen shows before anyone has ordered. */
  area: string
  /**
   * The street address, shown once an order exists. Null when it has not been
   * configured — the surfaces then say the details will follow by email rather
   * than printing a gap where an address should be.
   */
  address: string | null
  /** When someone can actually turn up. Null when unconfigured. */
  hours: string | null
  /** Anything else the buyer needs — a buzzer, a parking note. */
  note: string | null
}

/** Null when there is nowhere to collect from. Every caller must handle that. */
export function pickupLocation(): PickupLocation | null {
  const area = process.env.SHOP_PICKUP_AREA?.trim()
  if (!area) return null

  return {
    area,
    address: process.env.SHOP_PICKUP_ADDRESS?.trim() || null,
    hours: process.env.SHOP_PICKUP_HOURS?.trim() || null,
    note: process.env.SHOP_PICKUP_NOTE?.trim() || null,
  }
}

/**
 * What to tell a buyer who has ordered and now has to come and get it.
 *
 * Returns the lines in the order they should be read. When no street address
 * has been configured the first line says the details are coming rather than
 * leaving the buyer to work out that something is missing.
 */
export function pickupLines(location: PickupLocation): string[] {
  return [
    location.address ?? `${location.area}. We will email the exact address with your collection details.`,
    ...(location.address ? [location.area] : []),
    ...(location.hours ? [location.hours] : []),
    ...(location.note ? [location.note] : []),
  ]
}
