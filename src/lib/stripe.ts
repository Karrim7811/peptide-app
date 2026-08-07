import Stripe from 'stripe'
import { TRIAL_DAYS } from '@/lib/pricing'

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
  get proMonthly() { return process.env.STRIPE_PRO_MONTHLY_PRICE_ID },
  get proAnnual() { return process.env.STRIPE_PRO_ANNUAL_PRICE_ID },
  get proLifetime() { return process.env.STRIPE_PRO_LIFETIME_PRICE_ID },
}

/**
 * `annual` was added 2026-08-06 alongside the redesigned pricing page, which
 * markets $14.99/mo and $119.88/yr. `lifetime` is no longer sold on the pricing
 * page but the plan stays here so existing links and the founder path keep
 * working.
 *
 * REQUIRES a live Stripe price behind STRIPE_PRO_ANNUAL_PRICE_ID. Until that
 * env var is set, annual checkout fails loudly (see priceFor) rather than
 * silently falling back to the monthly price — a visitor who picked ANNUAL and
 * got charged $14.99/mo recurring is a billing misrepresentation, not a bug we
 * can absorb.
 */
export type ProPlan = 'monthly' | 'annual' | 'lifetime'

export function isProPlan(value: unknown): value is ProPlan {
  return value === 'monthly' || value === 'annual' || value === 'lifetime'
}

/** Which plans are actually purchasable given the configured env. */
export function planIsConfigured(plan: ProPlan): boolean {
  return Boolean(
    plan === 'lifetime'
      ? STRIPE_PRICES.proLifetime
      : plan === 'annual'
        ? STRIPE_PRICES.proAnnual
        : STRIPE_PRICES.proMonthly,
  )
}

function priceFor(plan: ProPlan): string {
  const priceId =
    plan === 'lifetime'
      ? STRIPE_PRICES.proLifetime
      : plan === 'annual'
        ? STRIPE_PRICES.proAnnual
        : STRIPE_PRICES.proMonthly

  if (!priceId) {
    throw new Error(
      `No Stripe price configured for the "${plan}" plan. Set the matching ` +
        `STRIPE_PRO_${plan.toUpperCase()}_PRICE_ID environment variable. Refusing ` +
        `to fall back to a different price — the customer selected this one.`,
    )
  }
  return priceId
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: ProPlan,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe()
  const priceId = priceFor(plan)

  // Lifetime is a one-time payment; monthly and annual are recurring
  // subscriptions. The webhook handler branches on event type to write the
  // correct subscription_tier and subscription_expires_at.
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
    subscription_data: {
      metadata: { userId, plan },
      // The pricing page promises "No card charged for a month". Without this
      // the promise is false at the checkout screen. TRIAL_DAYS derives from
      // TRIAL_MONTHS so the copy and the subscription cannot drift.
      ...(TRIAL_DAYS > 0 ? { trial_period_days: TRIAL_DAYS } : {}),
    },
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
