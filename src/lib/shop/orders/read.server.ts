// Reading one order back.
//
// SERVER ONLY. Both the order page and the Zelle sheet need the same row, so
// the query lives once here rather than twice in two page files.
//
// Scoped to the signed-in user through the anon client, not the service role.
// The RLS policy on shop_orders (`auth.uid() = user_id`) is then doing real
// work: a payment reference is four characters from a 31-letter alphabet, which
// is fine as a bank memo and nowhere near enough to be a bearer token. Reading
// under the service role and comparing user ids by hand would put that check in
// application code, where forgetting it is silent.

import { createClient } from '@/lib/supabase/server'
import type { Order, OrderStatus, PaymentProviderId } from '@/lib/shop/orders/types'
import type { ShippingMethodId } from '@/lib/shop/orders/shipping'

const ORDER_COLUMNS = `
  id, user_id, status, subtotal_cents, shipping_cents, total_cents,
  shipping_method, payment_provider, provider_ref, payment_reference,
  ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_postal,
  created_at, paid_at, shipped_at, tracking
`

// The lot code is joined rather than fetched separately: it is the recall path,
// and the order page prints it beside the line it shipped as. Null until packed,
// which is why the order page has to have something to say for its absence.
const ITEM_COLUMNS = `
  id, order_id, product_id, lot_id, qty, unit_price_cents, product_name, size_display,
  shop_lots ( lot_code )
`

/**
 * The order behind a payment reference, or null. Null covers every reason —
 * no such order, not signed in, someone else's — on purpose: distinguishing
 * them would turn this page into an oracle for which references exist.
 */
export async function orderByReference(reference: string): Promise<Order | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row } = await supabase
    .from('shop_orders')
    .select(ORDER_COLUMNS)
    .eq('payment_reference', reference)
    .maybeSingle()

  if (!row) return null

  const { data: items } = await supabase
    .from('shop_order_items')
    .select(ITEM_COLUMNS)
    .eq('order_id', row.id)

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as OrderStatus,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    shippingMethod: row.shipping_method as ShippingMethodId,
    paymentProvider: row.payment_provider as PaymentProviderId,
    providerRef: row.provider_ref,
    paymentReference: row.payment_reference,
    ship: {
      name: row.ship_name,
      line1: row.ship_line1,
      line2: row.ship_line2,
      city: row.ship_city,
      state: row.ship_state,
      postal: row.ship_postal,
      country: 'US',
    },
    createdAt: row.created_at,
    paidAt: row.paid_at,
    shippedAt: row.shipped_at,
    tracking: row.tracking,
    items: (items ?? []).map((item) => {
      // PostgREST returns an embedded one-to-one as either an object or a
      // single-element array depending on how it infers the relationship.
      const lot = item.shop_lots as { lot_code: string | null } | { lot_code: string | null }[] | null
      const embedded = Array.isArray(lot) ? lot[0] : lot

      return {
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        lotId: item.lot_id,
        lotCode: embedded?.lot_code ?? null,
        qty: item.qty,
        unitPriceCents: item.unit_price_cents,
        productName: item.product_name,
        sizeDisplay: item.size_display,
      }
    }),
  }
}
