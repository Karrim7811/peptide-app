// Sending the payment receipt for an order that has just become 'paid'.
//
// SERVER ONLY. Called from both places an order can become paid — the admin's
// markPaid (Zelle) and the BTCPay webhook — so the two cannot drift.
//
// Reads under the service role: neither caller is the buyer. The recipient is
// shop_orders.buyer_email, the address the order was placed under, never a
// fresh read of auth.users (see shop_orders_buyer_email_migration.sql).
//
// Never throws. The status change is the record; this is a copy of it.

import { createServiceClient } from '@/lib/supabase/server'
import { send, type SendOutcome } from '@/lib/email/send'
import { receiptHtml, receiptSubject, receiptText } from '@/lib/email/payment-received'
import { isCollection, type ShippingMethodId } from '@/lib/shop/orders/shipping'
import { pickupLocation } from '@/lib/shop/pickup'
import { SITE_ORIGIN } from '@/lib/site'

export async function emailPaymentReceipt(
  orderId: string,
): Promise<SendOutcome | { ok: false; reason: 'error'; detail: string }> {
  try {
    const service = createServiceClient()

    const { data: order, error } = await service
      .from('shop_orders')
      .select(
        'payment_reference, status, subtotal_cents, shipping_cents, total_cents, shipping_method, payment_provider, paid_at, buyer_email',
      )
      .eq('id', orderId)
      .single()
    if (error || !order) throw new Error(error?.message ?? 'order not found')
    if (order.status !== 'paid' || !order.paid_at) throw new Error(`order is ${order.status}, not paid`)
    if (!order.buyer_email) return { ok: false, reason: 'no-recipient' }

    const { data: items, error: itemsError } = await service
      .from('shop_order_items')
      .select('qty, unit_price_cents, product_name, size_display')
      .eq('order_id', orderId)
    if (itemsError || !items) throw new Error(itemsError?.message ?? 'items not found')

    const method = order.shipping_method as ShippingMethodId
    const input = {
      paymentReference: order.payment_reference,
      totalCents: order.total_cents,
      subtotalCents: order.subtotal_cents,
      shippingCents: order.shipping_cents,
      shippingMethodId: method,
      pickup: isCollection(method) ? pickupLocation() : null,
      provider: order.payment_provider as 'zelle' | 'btcpay',
      paidAt: order.paid_at,
      lines: items.map((item) => ({
        productName: item.product_name,
        sizeDisplay: item.size_display,
        qty: item.qty,
        lineCents: item.qty * item.unit_price_cents,
      })),
      orderUrl: `${SITE_ORIGIN}/shop/order/${encodeURIComponent(order.payment_reference)}`,
    }

    const outcome = await send({
      to: order.buyer_email,
      subject: receiptSubject(input),
      text: receiptText(input),
      html: receiptHtml(input),
    })
    if (!outcome.ok) {
      console.error('[shop] payment receipt not sent', order.payment_reference, outcome.reason, outcome.detail)
    }
    return outcome
  } catch (failure) {
    const detail = failure instanceof Error ? failure.message : String(failure)
    console.error('[shop] payment receipt threw', orderId, detail)
    return { ok: false, reason: 'error', detail }
  }
}
