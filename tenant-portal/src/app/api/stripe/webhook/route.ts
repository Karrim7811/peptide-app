import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Service-role client: the webhook carries a Stripe signature, not a
  // Supabase session, and payments has no RLS write policies by design.
  const supabase = createServiceClient()

  switch (event.type) {
    // Card payments are paid at completion; ACH completes with
    // payment_status 'unpaid' and settles via async_payment_succeeded.
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenant_id
      const period = session.metadata?.period
      if (!tenantId || !period) break

      const paid = session.payment_status === 'paid'
      // Idempotent on stripe_session_id (unique) — Stripe retries deliveries.
      const { error } = await supabase.from('payments').upsert(
        {
          tenant_id: tenantId,
          amount_cents: session.amount_total ?? Number(session.metadata?.amount_cents ?? 0),
          period,
          status: paid ? 'succeeded' : 'processing',
          stripe_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) ?? null,
          paid_at: paid ? new Date().toISOString() : null,
        },
        { onConflict: 'stripe_session_id' }
      )
      if (error) {
        console.error('Failed to record payment:', error)
        // Non-2xx so Stripe retries the delivery.
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
      }

      if (session.customer && tenantId) {
        await supabase
          .from('tenants')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', tenantId)
          .is('stripe_customer_id', null)
      }
      break
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      const { error } = await supabase
        .from('payments')
        .update({ status: 'succeeded', paid_at: new Date().toISOString() })
        .eq('stripe_session_id', session.id)
      if (error) {
        console.error('Failed to mark payment succeeded:', error)
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
      }
      break
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { error } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id)
      if (error) {
        console.error('Failed to mark payment failed:', error)
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
