'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/StatusBadge'
import { CATEGORY_LABELS } from '@/lib/requests'
import type { ServiceRequest, ServiceRequestCategory, Tenant } from '@/types'

export default function RequestsPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [noLease, setNoLease] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<ServiceRequestCategory>('general')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: t } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<Tenant>()
    if (!t) {
      setNoLease(true)
      setLoading(false)
      return
    }
    setTenant(t)
    const { data: reqs } = await supabase
      .from('service_requests')
      .select('*')
      .eq('tenant_id', t.id)
      .order('created_at', { ascending: false })
      .returns<ServiceRequest[]>()
    setRequests(reqs || [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('service_requests').insert({
      tenant_id: tenant.id,
      category,
      title: title.trim(),
      description: description.trim(),
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setTitle('')
    setDescription('')
    setCategory('general')
    setShowForm(false)
    load()
  }

  async function cancel(id: string) {
    const supabase = createClient()
    await supabase.from('service_requests').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  const inputCls =
    'w-full rounded-md border border-tp-border px-3 py-2 outline-none focus:border-tp-accent'

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-tp-muted hover:text-tp-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        {tenant && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-tp-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-tp-accentDark"
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        )}
      </div>

      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <Wrench className="h-5 w-5 text-tp-accent" /> Service requests
      </h1>

      {loading && <p className="text-tp-muted">Loading…</p>}

      {noLease && (
        <div className="rounded-xl border border-tp-border bg-tp-card p-8 text-center text-tp-muted">
          Your account isn&apos;t linked to a lease yet — contact your landlord.
        </div>
      )}

      {showForm && tenant && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-xl border border-tp-border bg-tp-card p-6"
        >
          <h2 className="font-semibold">New service request</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceRequestCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Short summary (e.g. Kitchen faucet leaking)"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <textarea
            className={inputCls}
            placeholder="Details — what's wrong, where, since when, best time to access…"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <p className="text-sm text-tp-danger">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-md bg-tp-accent px-4 py-2 text-sm font-medium text-white hover:bg-tp-accentDark disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      {!loading && !noLease && requests.length === 0 && !showForm && (
        <div className="rounded-xl border border-tp-border bg-tp-card p-8 text-center text-tp-muted">
          No service requests yet. Something broken? Hit &ldquo;New request&rdquo;.
        </div>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-tp-border bg-tp-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="mt-0.5 text-xs text-tp-muted">
                  {CATEGORY_LABELS[r.category] ?? r.category} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('en-US')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                {r.status === 'open' && (
                  <button
                    onClick={() => cancel(r.id)}
                    className="rounded-md border border-tp-border px-2 py-1 text-xs hover:bg-tp-bg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {r.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-tp-muted">{r.description}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
