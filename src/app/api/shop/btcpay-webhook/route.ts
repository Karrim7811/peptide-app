// BTCPay settlement webhook.
//
// Verify, then read. Never the other way round — an endpoint that parses first
// is a public API for marking your own orders paid.
//
// Idempotent by construction: the UPDATE is conditional on the order still being
// awaiting_payment, so BTCPay's retries match zero rows and change nothing. That
// predicate is the same edge the status machine allows, expressed in SQL because
// this is the one place a second process could race us.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifySignature } from '@/lib/shop/payments/btcpay-signature'

interface BtcPayEvent {
  type?: string
  invoiceId?: string
  metadata?: { orderId?: string }
}

export async function POST(request: Request) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET
  if (!secret) {
    // Refuse rather than skip verification. A webhook that accepts unsigned
    // requests because it was misconfigured is the failure this guards against.
    console.error('[btcpay] BTCPAY_WEBHOOK_SECRET is not set; refusing')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get('BTCPay-Sig'), secret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 })
  }

  let event: BtcPayEvent
  try {
    event = JSON.parse(raw) as BtcPayEvent
  } catch {
    return NextResponse.json({ error: 'unparseable body' }, { status: 400 })
  }

  // Settled, not merely paid. InvoiceProcessing fires before confirmation, and
  // acting on it would ship goods against a transaction that can still fail.
  if (event.type !== 'InvoiceSettled') {
    return NextResponse.json({ ok: true, ignored: event.type ?? 'unknown' })
  }

  const orderId = event.metadata?.orderId
  if (!orderId) {
    // 200, not 500: retrying will not add the missing metadata. Log it loudly —
    // it means money arrived that cannot be matched to an order.
    console.error('[btcpay] settled invoice carried no orderId', event.invoiceId)
    return NextResponse.json({ ok: true, unmatched: true })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('shop_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'awaiting_payment')
    .select('id')

  if (error) {
    // 500 so BTCPay retries — this one is worth retrying.
    console.error('[btcpay] failed to mark order paid', orderId, error.message)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    // Already advanced, or never existed. A retry, not a problem — but worth a
    // line, because it is also what a replayed event looks like.
    console.warn('[btcpay] order was not awaiting payment', orderId)
  }

  return NextResponse.json({ ok: true })
}
