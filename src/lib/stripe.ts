import Stripe from 'stripe'

// Lazy initialization — avoids build-time failure when env vars aren't present
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
  })
}

export const STRIPE_PRICES = {
  get proMonthly() { return process.env.STRIPE_PRO_MONTHLY_PRICE_ID! },
  get proLifetime() { return process.env.STRIPE_PRO_LIFETIME_PRICE_ID! },
}

export type ProPlan = 'monthly' | 'lifetime'

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: ProPlan,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe()
  const priceId = plan === 'lifetime' ? STRIPE_PRICES.proLifetime : STRIPE_PRICES.proMonthly

  // Lifetime is a one-time payment; monthly is a recurring subscription.
  // The webhook handler branches on event type to write the correct
  // subscription_tier and subscription_expires_at.
  if (plan === 'lifetime') {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })
    return session.url!
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId, plan } },
  })
  return session.url!
}

export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

export function getStripeClient(): Stripe {
  return getStripe()
}
