'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Plus, XCircle } from 'lucide-react'
import { formatCents, periodLabel } from '@/lib/rent'
import type { AdminPaymentRow, AdminTenantRow } from '@/types'

export default function AdminPanel() {
  const [tenants, setTenants] = useState<AdminTenantRow[]>([])
  const [payments, setPayments] = useState<AdminPaymentRow[]>([])
  const [period, setPeriod] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add-tenant form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    unit: '',
    rent_dollars: '',
    rent_due_day: '1',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/admin/tenants'),
        fetch('/api/admin/payments'),
      ])
      const tData = await tRes.json()
      const pData = await pRes.json()
      if (!tRes.ok) throw new Error(tData.error || 'Failed to load tenants')
      if (!pRes.ok) throw new Error(pData.error || 'Failed to load payments')
      setTenants(tData.tenants)
      setPeriod(tData.period)
      setPayments(pData.payments)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addTenant(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const cents = Math.round(parseFloat(form.rent_dollars) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      setFormError('Enter a valid monthly rent amount')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        full_name: form.full_name,
        unit: form.unit,
        monthly_rent_cents: cents,
        rent_due_day: Number(form.rent_due_day),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setFormError(data.error || 'Failed to add tenant')
      return
    }
    setForm({ email: '', full_name: '', unit: '', rent_dollars: '', rent_due_day: '1' })
    setShowForm(false)
    load()
  }

  async function toggleActive(t: AdminTenantRow) {
    await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, active: !t.active }),
    })
    load()
  }

  if (loading) return <p className="text-tp-muted">Loading…</p>
  if (error) return <p className="text-tp-danger">{error}</p>

  const inputCls =
    'w-full rounded-md border border-tp-border px-3 py-2 outline-none focus:border-tp-accent'

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-tp-border bg-tp-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            Tenants — {period ? periodLabel(period) : ''}
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-tp-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-tp-accentDark"
          >
            <Plus className="h-4 w-4" /> Add tenant
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={addTenant}
            className="mb-6 grid gap-3 rounded-lg border border-tp-border bg-tp-bg p-4 sm:grid-cols-2"
          >
            <input
              className={inputCls}
              placeholder="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Full name"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Unit (e.g. 2B)"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Monthly rent (USD)"
              type="number"
              min="1"
              step="0.01"
              required
              value={form.rent_dollars}
              onChange={(e) => setForm({ ...form, rent_dollars: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm text-tp-muted">
              Due day of month
              <input
                className="w-20 rounded-md border border-tp-border px-3 py-2 outline-none focus:border-tp-accent"
                type="number"
                min="1"
                max="28"
                required
                value={form.rent_due_day}
                onChange={(e) => setForm({ ...form, rent_due_day: e.target.value })}
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              {formError && <span className="text-sm text-tp-danger">{formError}</span>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-tp-accent px-4 py-2 text-sm font-medium text-white hover:bg-tp-accentDark disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save tenant'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tp-border text-left text-tp-muted">
                <th className="py-2 pr-4 font-medium">Unit</th>
                <th className="py-2 pr-4 font-medium">Tenant</th>
                <th className="py-2 pr-4 font-medium">Rent</th>
                <th className="py-2 pr-4 font-medium">This month</th>
                <th className="py-2 pr-4 font-medium">Account</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-tp-border/60 last:border-0 ${t.active ? '' : 'opacity-50'}`}
                >
                  <td className="py-2 pr-4">{t.unit}</td>
                  <td className="py-2 pr-4">
                    <div>{t.full_name}</div>
                    <div className="text-xs text-tp-muted">{t.email}</div>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{formatCents(t.monthly_rent_cents)}</td>
                  <td className="py-2 pr-4">
                    {t.current_period_status === 'succeeded' && (
                      <span className="inline-flex items-center gap-1 text-tp-accent">
                        <CheckCircle2 className="h-4 w-4" /> Paid
                      </span>
                    )}
                    {t.current_period_status === 'processing' && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Clock3 className="h-4 w-4" /> Processing
                      </span>
                    )}
                    {t.current_period_status === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-tp-danger">
                        <XCircle className="h-4 w-4" /> Failed
                      </span>
                    )}
                    {t.current_period_status === 'unpaid' && (
                      <span className="text-tp-muted">Unpaid</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs text-tp-muted">
                    {t.user_id ? 'Signed up' : 'Not signed up'}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => toggleActive(t)}
                      className="rounded-md border border-tp-border px-2 py-1 text-xs hover:bg-tp-bg"
                    >
                      {t.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-tp-muted">
                    No tenants yet — add your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-tp-border bg-tp-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tp-border text-left text-tp-muted">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Tenant</th>
                <th className="py-2 pr-4 font-medium">Month</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-tp-border/60 last:border-0">
                  <td className="py-2 pr-4 tabular-nums">
                    {new Date(p.paid_at || p.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="py-2 pr-4">
                    {p.tenants ? `${p.tenants.full_name} · ${p.tenants.unit}` : '—'}
                  </td>
                  <td className="py-2 pr-4">{periodLabel(p.period)}</td>
                  <td className="py-2 pr-4 tabular-nums">{formatCents(p.amount_cents)}</td>
                  <td className="py-2 capitalize">{p.status}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-tp-muted">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
