import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient, getAppUrl } from '@/lib/stripe'
import { currentPeriod, periodLabel } from '@/lib/rent'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // RLS scopes this to the caller's own tenant record.
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tenant) {
    return NextResponse.json(
      { error: 'No lease is linked to this account. Contact your landlord.' },
      { status: 403 }
    )
  }
  if (!tenant.active) {
    return NextResponse.json({ error: 'This lease is no longer active.' }, { status: 403 })
  }

  const period = currentPeriod()

  // Block double payment for the month (also enforced by a unique index).
  const { data: existing } = await supabase
    .from('payments')
    .select('id, status')
    .eq('tenant_id', tenant.id)
    .eq('period', period)
    .in('status', ['succeeded', 'processing'])
    .limit(1)

  if (existing && existing.length > 0) {
    const msg =
      existing[0].status === 'succeeded'
        ? `Rent for ${periodLabel(period)} is already paid.`
        : `A payment for ${periodLabel(period)} is already processing.`
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  const stripe = getStripeClient()
  const appUrl = getAppUrl(request)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // Payment methods come from the Stripe dashboard config — enable
    // "US bank account" there to offer low-fee ACH alongside cards.
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Rent — Unit ${tenant.unit} — ${periodLabel(period)}`,
          },
          unit_amount: tenant.monthly_rent_cents,
        },
        quantity: 1,
      },
    ],
    customer_email: tenant.stripe_customer_id ? undefined : tenant.email,
    customer: tenant.stripe_customer_id || undefined,
    metadata: {
      tenant_id: tenant.id,
      period,
      amount_cents: String(tenant.monthly_rent_cents),
    },
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/dashboard?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
