// Order types.
//
// Mirrors supabase/shop_orders_schema.sql. Where the two disagree, the schema is
// right — its constraints are enforced, these are only described.

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'expired'
  | 'refunded'
  | 'cancelled'

export type PaymentProviderId = 'btcpay' | 'zelle'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postal: string
  /** US only at launch, consistent with the existing EU geoblock. */
  country: 'US'
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  /**
   * Null until the order is packed. Then it is the lot that physically left the
   * shelf — the recall path. Never assigned at order time, because at order time
   * nobody has picked a vial yet.
   */
  lotId: string | null
  qty: number
  /**
   * Snapshot taken when the order was placed. Never re-derived from the
   * catalogue: a price change must not rewrite what a past customer was charged.
   */
  unitPriceCents: number
  /** Denormalised, so a historical order survives a rename or a delisting. */
  productName: string
  sizeDisplay: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotalCents: number
  shippingCents: number
  totalCents: number
  paymentProvider: PaymentProviderId
  /** The provider's own charge id. Always null for Zelle, which has no API. */
  providerRef: string | null
  /**
   * Short, human-typable code. For Zelle it goes in the memo and is the only
   * link between money arriving in a bank account and this row.
   */
  paymentReference: string
  ship: ShippingAddress
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  tracking: string | null
  items: OrderItem[]
}
