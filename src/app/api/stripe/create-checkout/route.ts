import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { createCheckoutSession, isProPlan, planIsConfigured } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = (await request.json()) as { plan: unknown }
    if (!isProPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Fail closed. Checking out a plan whose price is not configured would
    // otherwise charge the customer a price they did not select.
    if (!planIsConfigured(plan)) {
      console.error(`Checkout blocked: no Stripe price configured for plan "${plan}"`)
      return NextResponse.json(
        { error: 'That billing option is not available right now.', code: 'PLAN_UNAVAILABLE' },
        { status: 503 }
      )
    }

    const origin = request.headers.get('origin') ?? 'https://peptidecortex.com'
    const url = await createCheckoutSession(
      user.id,
      user.email!,
      plan,
      `${origin}/dashboard?upgraded=true`,
      `${origin}/pricing`
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
