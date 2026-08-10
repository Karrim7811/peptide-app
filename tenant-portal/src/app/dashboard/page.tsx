import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  DollarSign,
  Wrench,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { currentPeriod, periodLabel, formatCents, ordinal } from '@/lib/rent'
import { CATEGORY_LABELS } from '@/lib/requests'
import Header from '@/components/Header'
import StatusBadge from '@/components/StatusBadge'
import PayRentButton from './PayRentButton'
import type { Payment, ServiceRequest, Tenant } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { payment?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Tenant>()

  const admin = isAdminEmail(user.email)

  if (!tenant) {
    return (
      <>
        <Header email={user.email} isAdmin={admin} />
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-tp-border bg-tp-card p-8 text-center">
            <h1 className="mb-2 text-lg font-semibold">No lease on file</h1>
            <p className="text-tp-muted">
              Your account ({user.email}) isn&apos;t linked to a lease yet. If you
              believe this is a mistake, contact your landlord and confirm which
              email address they have on file for you.
            </p>
          </div>
        </main>
      </>
    )
  }

  const period = currentPeriod()
  const [{ data: payments }, { data: requests }] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(12)
      .returns<Payment[]>(),
    supabase
      .from('service_requests')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<ServiceRequest[]>(),
  ])

  const thisMonth = (payments || []).find(
    (p) => p.period === period && (p.status === 'succeeded' || p.status === 'processing')
  )
  const openRequests = (requests || []).filter(
    (r) => r.status === 'open' || r.status === 'in_progress'
  )

  return (
    <>
      <Header email={user.email} isAdmin={admin} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {searchParams.payment === 'success' && (
          <div className="rounded-lg border border-tp-accent/30 bg-tp-accent/10 px-4 py-3 text-sm">
            Payment submitted. Card payments confirm within a minute; bank (ACH)
            payments can take a few business days and will show as
            &ldquo;processing&rdquo; until they settle.
          </div>
        )}
        {searchParams.payment === 'cancelled' && (
          <div className="rounded-lg border border-tp-border bg-tp-card px-4 py-3 text-sm text-tp-muted">
            Checkout was cancelled — no payment was made.
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">
            Welcome back, {tenant.full_name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-tp-muted">
            Unit {tenant.unit} · rent due the {ordinal(tenant.rent_due_day)} of each month
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-tp-border bg-tp-card p-5">
            <div className="flex items-center gap-2 text-sm text-tp-muted">
              <DollarSign className="h-4 w-4" /> Rent — {periodLabel(period)}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatCents(tenant.monthly_rent_cents)}
            </div>
            <div className="mt-2 text-sm">
              {thisMonth?.status === 'succeeded' ? (
                <span className="inline-flex items-center gap-1 font-medium text-tp-accent">
                  <CheckCircle2 className="h-4 w-4" /> Paid
                </span>
              ) : thisMonth?.status === 'processing' ? (
                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                  <Clock3 className="h-4 w-4" /> Processing
                </span>
              ) : (
                <span className="font-medium text-tp-danger">Unpaid</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-tp-border bg-tp-card p-5">
            <div className="flex items-center gap-2 text-sm text-tp-muted">
              <Wrench className="h-4 w-4" /> Service requests
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{openRequests.length}</div>
            <div className="mt-2 text-sm text-tp-muted">
              {openRequests.length === 1 ? 'open request' : 'open requests'}
            </div>
          </div>

          <div className="rounded-xl border border-tp-border bg-tp-card p-5">
            <div className="flex items-center gap-2 text-sm text-tp-muted">
              <Building2 className="h-4 w-4" /> Unit
            </div>
            <div className="mt-2 text-2xl font-semibold">{tenant.unit}</div>
            <div className="mt-2 text-sm text-tp-muted">{tenant.full_name}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!thisMonth && <PayRentButton />}
          <Link
            href="/requests"
            className="flex items-center gap-2 rounded-lg border border-tp-border bg-tp-card px-5 py-2.5 font-medium hover:bg-tp-bg"
          >
            <Wrench className="h-5 w-5 text-tp-accent" />
            Request service
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment history */}
          <section className="rounded-xl border border-tp-border bg-tp-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment history</h2>
            {!payments || payments.length === 0 ? (
              <p className="text-sm text-tp-muted">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-tp-border text-left text-tp-muted">
                      <th className="py-2 pr-4 font-medium">Month</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-tp-border/60 last:border-0">
                        <td className="py-2 pr-4">{periodLabel(p.period)}</td>
                        <td className="py-2 pr-4 tabular-nums">{formatCents(p.amount_cents)}</td>
                        <td className="py-2">
                          {p.status === 'succeeded' && (
                            <span className="inline-flex items-center gap-1 text-tp-accent">
                              <CheckCircle2 className="h-4 w-4" /> Paid
                            </span>
                          )}
                          {p.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <Clock3 className="h-4 w-4" /> Processing
                            </span>
                          )}
                          {p.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 text-tp-danger">
                              <XCircle className="h-4 w-4" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent service requests */}
          <section className="rounded-xl border border-tp-border bg-tp-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Service requests</h2>
              <Link
                href="/requests"
                className="inline-flex items-center gap-1 text-sm text-tp-accent hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {!requests || requests.length === 0 ? (
              <p className="text-sm text-tp-muted">
                Nothing reported. Something broken in the unit?{' '}
                <Link href="/requests" className="text-tp-accent hover:underline">
                  Open a request
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 border-b border-tp-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="mt-0.5 text-xs text-tp-muted">
                        {CATEGORY_LABELS[r.category] ?? r.category} ·{' '}
                        {new Date(r.created_at).toLocaleDateString('en-US')}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
