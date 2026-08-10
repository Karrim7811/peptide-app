import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { currentPeriod } from '@/lib/rent'
import type { Payment, Tenant } from '@/types'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

// List all tenants with this month's payment status.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const period = currentPeriod()

  const [{ data: tenants, error: tErr }, { data: payments, error: pErr }] = await Promise.all([
    supabase.from('tenants').select('*').order('unit'),
    supabase.from('payments').select('*').eq('period', period),
  ])
  if (tErr || pErr) {
    return NextResponse.json({ error: (tErr || pErr)!.message }, { status: 500 })
  }

  const byTenant = new Map<string, Payment>()
  for (const p of (payments as Payment[]) || []) {
    const prev = byTenant.get(p.tenant_id)
    // Prefer succeeded > processing > failed when multiple attempts exist.
    const rank = { succeeded: 3, processing: 2, failed: 1 } as const
    if (!prev || rank[p.status] > rank[prev.status]) byTenant.set(p.tenant_id, p)
  }

  const rows = ((tenants as Tenant[]) || []).map((t) => ({
    ...t,
    current_period_status: byTenant.get(t.id)?.status ?? 'unpaid',
  }))

  return NextResponse.json({ period, tenants: rows })
}

// Add a tenant.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').trim().toLowerCase()
  const full_name = String(body?.full_name || '').trim()
  const unit = String(body?.unit || '').trim()
  const monthly_rent_cents = Math.round(Number(body?.monthly_rent_cents))
  const rent_due_day = Math.round(Number(body?.rent_due_day ?? 1))

  if (!email || !email.includes('@') || !full_name || !unit) {
    return NextResponse.json({ error: 'email, full_name and unit are required' }, { status: 400 })
  }
  if (!Number.isFinite(monthly_rent_cents) || monthly_rent_cents <= 0) {
    return NextResponse.json({ error: 'monthly_rent_cents must be a positive integer' }, { status: 400 })
  }
  if (rent_due_day < 1 || rent_due_day > 28) {
    return NextResponse.json({ error: 'rent_due_day must be between 1 and 28' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .insert({ email, full_name, unit, monthly_rent_cents, rent_due_day })
    .select()
    .single()

  if (error) {
    const status = error.code === '23505' ? 409 : 500 // unique_violation on email
    const message = error.code === '23505' ? 'A tenant with this email already exists' : error.message
    return NextResponse.json({ error: message }, { status })
  }
  return NextResponse.json({ tenant: data })
}

// Update a tenant (rent amount, due day, active flag, unit, name).
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const id = String(body?.id || '')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.active !== undefined) updates.active = Boolean(body.active)
  if (body.full_name !== undefined) updates.full_name = String(body.full_name).trim()
  if (body.unit !== undefined) updates.unit = String(body.unit).trim()
  if (body.monthly_rent_cents !== undefined) {
    const cents = Math.round(Number(body.monthly_rent_cents))
    if (!Number.isFinite(cents) || cents <= 0) {
      return NextResponse.json({ error: 'monthly_rent_cents must be a positive integer' }, { status: 400 })
    }
    updates.monthly_rent_cents = cents
  }
  if (body.rent_due_day !== undefined) {
    const day = Math.round(Number(body.rent_due_day))
    if (day < 1 || day > 28) {
      return NextResponse.json({ error: 'rent_due_day must be between 1 and 28' }, { status: 400 })
    }
    updates.rent_due_day = day
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenant: data })
}
