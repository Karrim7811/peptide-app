import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json() // 'monthly' | 'yearly'
    const priceId = plan === 'yearly' ? STRIPE_PRICES.proYearly : STRIPE_PRICES.proMonthly

    const origin = request.headers.get('origin') ?? 'https://peptidetracker.app'
    const url = await createCheckoutSession(
      user.id,
      user.email!,
      priceId,
      `${origin}/dashboard?upgraded=true`,
      `${origin}/pricing`
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
