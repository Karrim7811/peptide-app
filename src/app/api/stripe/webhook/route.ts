import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
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

  const supabase = createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break

      // Get subscription end date
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expiresAt = new Date(((subscription as any).current_period_end as number) * 1000).toISOString()

      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          subscription_expires_at: expiresAt,
          stripe_customer_id: session.customer as string,
        })
        .eq('id', userId)

      await logSubscriptionEvent(supabase, userId, 'subscribed', 'pro', 'stripe', event.id)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
      const userId = subscription.metadata?.userId
      if (!userId) break

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expiresAt = new Date(((subscription as any).current_period_end as number) * 1000).toISOString()
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro', subscription_expires_at: expiresAt })
        .eq('id', userId)

      await logSubscriptionEvent(supabase, userId, 'renewed', 'pro', 'stripe', event.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId
      if (!userId) break

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free', subscription_expires_at: null })
        .eq('id', userId)

      await logSubscriptionEvent(supabase, userId, 'cancelled', 'free', 'stripe', event.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
      const userId = subscription.metadata?.userId
      if (!userId) break

      await logSubscriptionEvent(supabase, userId, 'payment_failed', 'pro', 'stripe', event.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function logSubscriptionEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  eventType: string,
  tier: string,
  provider: string,
  providerEventId: string
) {
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: eventType,
    tier,
    provider,
    provider_event_id: providerEventId,
  })
}
