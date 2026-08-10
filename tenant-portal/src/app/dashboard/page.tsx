import { redirect } from 'next/navigation'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { currentPeriod, periodLabel, formatCents, ordinal } from '@/lib/rent'
import Header from '@/components/Header'
import PayRentButton from './PayRentButton'
import type { Payment, Tenant } from '@/types'

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
        <main className="mx-auto max-w-3xl px-4 py-10">
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
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(24)
    .returns<Payment[]>()

  const thisMonth = (payments || []).find(
    (p) => p.period === period && (p.status === 'succeeded' || p.status === 'processing')
  )

  return (
    <>
      <Header email={user.email} isAdmin={admin} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
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

        <section className="rounded-xl border border-tp-border bg-tp-card p-6">
          <div className="mb-1 text-sm text-tp-muted">
            {tenant.full_name} · Unit {tenant.unit}
          </div>
          <h1 className="text-xl font-semibold">Rent for {periodLabel(period)}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold tabular-nums">
                {formatCents(tenant.monthly_rent_cents)}
              </div>
              <div className="mt-1 text-sm text-tp-muted">
                Due on the {ordinal(tenant.rent_due_day)} of the month
              </div>
            </div>
            {thisMonth?.status === 'succeeded' ? (
              <div className="flex items-center gap-2 rounded-lg bg-tp-accent/10 px-4 py-2 font-medium text-tp-accent">
                <CheckCircle2 className="h-5 w-5" /> Paid
              </div>
            ) : thisMonth?.status === 'processing' ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 font-medium text-amber-700">
                <Clock3 className="h-5 w-5" /> Processing
              </div>
            ) : (
              <PayRentButton />
            )}
          </div>
        </section>

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
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-tp-border/60 last:border-0">
                      <td className="py-2 pr-4">{periodLabel(p.period)}</td>
                      <td className="py-2 pr-4 tabular-nums">{formatCents(p.amount_cents)}</td>
                      <td className="py-2 pr-4">
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
                      <td className="py-2 tabular-nums">
                        {new Date(p.paid_at || p.created_at).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
