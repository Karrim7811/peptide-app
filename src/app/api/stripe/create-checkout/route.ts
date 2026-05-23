import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { createCheckoutSession, type ProPlan } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = (await request.json()) as { plan: ProPlan }
    if (plan !== 'monthly' && plan !== 'lifetime') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
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
