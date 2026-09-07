'use server'

// Order creation.
//
// The one place a cart becomes a row. Everything it needs was built and tested
// separately — pricing, shipping methods, reference codes, the age gate, the
// payment adapters — so this is assembly, and its job is to do the assembly in
// the right order.
//
// The order that matters:
//
//   1. Authenticate, and check 18+ from profiles.dob. Fails closed.
//   2. Price every line from the catalogue, ONCE, and snapshot it.
//   3. Insert the order and its items, retrying on a reference collision.
//   4. Only then ask the provider for a charge.
//   5. Last of all, try to email a receipt — and ignore whether it worked.
//
// Step 4 is before 5 on purpose. A BTCPay invoice created before the row exists
// is an invoice a customer can pay against nothing — money arrives, the webhook
// looks for an order id that was never written, and the payment is unmatched.
// Better to fail before taking money than after.
//
// Step 5 cannot fail the order and does not report upward. The order is the
// record; the receipt is a copy of it. A customer whose order was written and
// whose invoice was created must never see an error because a mail API was
// slow — and with RESEND_API_KEY unset nothing sends at all, which is a normal
// state before the sending domain is warmed, not a fault.

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdult } from '@/lib/shop/orders/age'
import { generateReference } from '@/lib/shop/orders/reference'
import { orderTotals, priceLine } from '@/lib/shop/orders/totals'
import type { ShippingMethodId } from '@/lib/shop/orders/shipping'
import type { PaymentProviderId, ShippingAddress } from '@/lib/shop/orders/types'
import type { ChargeIntent } from '@/lib/shop/payments/provider'
import { BTCPAY } from '@/lib/shop/payments/btcpay'
import { ZELLE } from '@/lib/shop/payments/zelle'
import { send } from '@/lib/email/send'
import {
  confirmationHtml,
  confirmationSubject,
  confirmationText,
} from '@/lib/email/order-confirmation'
import { SITE_ORIGIN } from '@/lib/site'
import { zelleAccount } from '@/lib/shop/zelle-account'

export interface CartLine {
  slug: string
  qty: number
}

export interface CreateOrderResult {
  orderId: string
  paymentReference: string
  intent: ChargeIntent
}

const PROVIDERS = { btcpay: BTCPAY, zelle: ZELLE } as const

/** How many times to retry a payment-reference collision before giving up. */
const REFERENCE_ATTEMPTS = 5

/**
 * Emails the buyer their receipt, and records the address on the order.
 *
 * Swallows everything. Every failure mode here — no address on the account, no
 * API key, a provider outage — leaves a valid order that the customer can still
 * see and pay, because the order page carries the same facts and does not
 * depend on this having worked.
 *
 * The address is written to the order BEFORE the send is attempted, so the
 * record of who the receipt was addressed to survives a send that fails. See
 * supabase/shop_orders_buyer_email_migration.sql for why the order carries it
 * rather than reading auth.users at send time.
 */
async function emailReceipt(args: {
  orderId: string
  paymentReference: string
  email: string | null
  priced: ReturnType<typeof priceLine>[]
  totals: ReturnType<typeof orderTotals>
  providerId: PaymentProviderId
}): Promise<void> {
  try {
    const service = createServiceClient()

    if (args.email) {
      await service
        .from('shop_orders')
        .update({ buyer_email: args.email })
        .eq('id', args.orderId)
    }

    if (!args.email) return

    const zelle = zelleAccount()
    const input = {
      paymentReference: args.paymentReference,
      totalCents: args.totals.totalCents,
      subtotalCents: args.totals.subtotalCents,
      shippingCents: args.totals.shippingCents,
      shippingMethodId: args.totals.shippingMethodId,
      provider: args.providerId,
      lines: args.priced.map((line) => ({
        productName: line.productName,
        sizeDisplay: line.sizeDisplay,
        qty: line.qty,
        lineCents: line.lineCents,
      })),
      orderUrl: `${SITE_ORIGIN}/shop/order/${encodeURIComponent(args.paymentReference)}`,
      // No fallback, exactly as the Zelle sheet has none. The mail tells the
      // buyer the account is not set up rather than naming one that is not ours.
      zelleHandle: zelle?.handle ?? null,
      zelleName: zelle?.name ?? null,
    }

    const outcome = await send({
      to: args.email,
      subject: confirmationSubject(input),
      text: confirmationText(input),
      html: confirmationHtml(input),
    })

    if (!outcome.ok && outcome.reason === 'failed') {
      // Logged, not raised. Somebody reading the function logs after a customer
      // says "I never got an email" needs this; the customer does not.
      console.error('[shop] receipt failed to send', args.paymentReference, outcome.detail)
    }
  } catch (failure) {
    console.error('[shop] receipt threw', args.paymentReference, failure)
  }
}

export async function createOrder(
  lines: CartLine[],
  ship: ShippingAddress,
  shippingMethodId: ShippingMethodId,
  providerId: PaymentProviderId,
): Promise<CreateOrderResult> {
  if (lines.length === 0) throw new Error('your cart is empty')

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('you must be signed in to order')

  const service = createServiceClient()

  // Age gate. Read under the service role so a missing RLS policy cannot turn a
  // failed lookup into an accidental pass.
  const { data: profile } = await service
    .from('profiles')
    .select('dob')
    .eq('id', user.id)
    .single()

  if (!isAdult(profile?.dob)) {
    throw new Error('orders are limited to adults 18 and over')
  }

  const provider = PROVIDERS[providerId]
  if (!provider) throw new Error(`unknown payment method: ${providerId}`)

  // Priced once, here. Throws on an unknown product, a bad quantity, or a
  // shipping method with no price set.
  const priced = lines.map((line) => priceLine(line.slug, line.qty))
  const totals = orderTotals(priced, shippingMethodId)

  const slugs = priced.map((line) => line.productSlug)
  const { data: products, error: productError } = await service
    .from('shop_products')
    .select('id, slug')
    .in('slug', slugs)
  if (productError || !products) throw new Error('could not resolve products')

  const idBySlug = new Map(products.map((product) => [product.slug, product.id]))
  const unresolved = slugs.filter((slug) => !idBySlug.has(slug))
  if (unresolved.length > 0) {
    throw new Error(`product not available: ${unresolved.join(', ')}`)
  }

  // Retry on the unique constraint rather than pre-checking. A SELECT-then-
  // INSERT would still race; letting the database decide is the only version
  // that is actually safe.
  let orderId: string | null = null
  let paymentReference = ''

  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS && !orderId; attempt++) {
    paymentReference = generateReference()
    const { data, error } = await service
      .from('shop_orders')
      .insert({
        user_id: user.id,
        status: 'awaiting_payment',
        subtotal_cents: totals.subtotalCents,
        shipping_cents: totals.shippingCents,
        shipping_method: totals.shippingMethodId,
        total_cents: totals.totalCents,
        payment_provider: providerId,
        payment_reference: paymentReference,
        ship_name: ship.name,
        ship_line1: ship.line1,
        ship_line2: ship.line2 ?? null,
        ship_city: ship.city,
        ship_state: ship.state,
        ship_postal: ship.postal,
        ship_country: 'US',
      })
      .select('id')
      .single()

    if (!error && data) {
      orderId = data.id
      break
    }
    // 23505 is unique_violation. Anything else is a real failure.
    if (error && error.code !== '23505') throw new Error(error.message)
  }

  if (!orderId) throw new Error('could not allocate a payment reference; please try again')

  const { error: itemsError } = await service.from('shop_order_items').insert(
    priced.map((line) => ({
      order_id: orderId,
      product_id: idBySlug.get(line.productSlug),
      lot_id: null, // Assigned at pack time. That is the recall path.
      qty: line.qty,
      unit_price_cents: line.unitPriceCents,
      product_name: line.productName,
      size_display: line.sizeDisplay,
    })),
  )

  if (itemsError) {
    // An order with no items would sit in the queue looking real. Remove it.
    await service.from('shop_orders').delete().eq('id', orderId)
    throw new Error(itemsError.message)
  }

  const intent = await provider.createCharge({
    id: orderId,
    totalCents: totals.totalCents,
    paymentReference,
  })

  if (intent.providerRef) {
    await service
      .from('shop_orders')
      .update({ provider_ref: intent.providerRef })
      .eq('id', orderId)
  }

  await emailReceipt({
    orderId,
    paymentReference,
    email: user.email ?? null,
    priced,
    totals,
    providerId,
  })

  return { orderId, paymentReference, intent }
}
