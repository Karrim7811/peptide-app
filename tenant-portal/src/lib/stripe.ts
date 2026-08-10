import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripe = new Stripe(key)
  }
  return stripe
}

export function getAppUrl(request?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (request) return new URL(request.url).origin
  return 'http://localhost:3100'
}
