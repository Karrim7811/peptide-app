'use server'

// Admin actions for the order queue.
//
// Every status change routes through canTransition, so the status machine is the
// single authority on what is legal — not this file, and not the UI that calls
// it. The update is also conditional on the status we read, which closes the
// window where two tabs advance the same order twice.

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/shop/orders/status'
import { validatePackAssignment } from '@/lib/shop/orders/admin'
import type { OrderStatus } from '@/lib/shop/orders/types'

// getAuthenticatedUser() takes a Request and suits route handlers. Server
// actions read the session from cookies instead — the pattern every existing
// layout in this app already uses.
async function assertAdmin() {
  const adminId = process.env.SHOP_ADMIN_USER_ID
  if (!adminId) throw new Error('SHOP_ADMIN_USER_ID is not set')

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== adminId) throw new Error('not authorised')
  return user
}

async function advance(
  orderId: string,
  to: OrderStatus,
  patch: Record<string, unknown> = {},
): Promise<void> {
  await assertAdmin()
  const service = createServiceClient()

  const { data: order, error } = await service
    .from('shop_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (error || !order) throw new Error('order not found')

  const from = order.status as OrderStatus
  if (!canTransition(from, to)) {
    throw new Error(`cannot move an order from ${from} to ${to}`)
  }

  const { data: updated, error: updateError } = await service
    .from('shop_orders')
    .update({ status: to, ...patch })
    .eq('id', orderId)
    // Lost-update guard: if another tab moved it since we read, this matches
    // nothing and we say so rather than overwriting their change.
    .eq('status', from)
    .select('id')

  if (updateError) throw new Error(updateError.message)
  if (!updated || updated.length === 0) {
    throw new Error('order changed while you were working on it — reload and try again')
  }

  revalidatePath('/admin/orders')
}

/**
 * Zelle only. Karim has matched the memo reference against the bank statement.
 * BTCPay orders reach 'paid' through the signed webhook, never through here.
 */
export async function markPaid(orderId: string): Promise<void> {
  await advance(orderId, 'paid', { paid_at: new Date().toISOString() })
}

/**
 * Records which lot physically left the shelf for each item, then advances the
 * order. The assignment is written before the status moves, so an order can
 * never sit in 'packed' without its lots.
 */
export async function markPacked(
  orderId: string,
  lotByItem: Record<string, string>,
): Promise<void> {
  await assertAdmin()
  const service = createServiceClient()

  const { data: items, error } = await service
    .from('shop_order_items')
    .select('id, product_id, qty')
    .eq('order_id', orderId)

  if (error || !items) throw new Error('could not load order items')

  validatePackAssignment(
    items.map((item) => ({ id: item.id, productId: item.product_id, qty: item.qty })),
    lotByItem,
  )

  for (const [itemId, lotId] of Object.entries(lotByItem)) {
    const { error: itemError } = await service
      .from('shop_order_items')
      .update({ lot_id: lotId })
      .eq('id', itemId)
      .eq('order_id', orderId)
    if (itemError) throw new Error(itemError.message)
  }

  await advance(orderId, 'packed')
}

export async function markShipped(orderId: string, tracking: string): Promise<void> {
  await advance(orderId, 'shipped', {
    tracking: tracking.trim() || null,
    shipped_at: new Date().toISOString(),
  })
}
