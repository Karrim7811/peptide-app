// The order queue.
//
// Three columns, because there are exactly three things to do: match a Zelle
// payment against the bank, pack a paid order, ship a packed one. Zelle cannot
// reconcile itself, so nothing leaves the building without a click here.
//
// Read-only for now. The actions in ./actions.ts are written and guarded; the
// buttons that call them land once there are real rows to act on and the packing
// step's shape is known.

import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/shop/pricing'

export const dynamic = 'force-dynamic'

const COLUMNS = [
  ['Awaiting payment', 'awaiting_payment', 'Match the reference against the bank.'],
  ['Paid', 'paid', 'Pick vials and record the lot for each item.'],
  ['Packed', 'packed', 'Add tracking and mark shipped.'],
] as const

export default async function AdminOrdersPage() {
  const adminId = process.env.SHOP_ADMIN_USER_ID
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 404 rather than 403. An admin route should not confirm it exists to someone
  // who is not the admin.
  if (!adminId || !user || user.id !== adminId) notFound()

  const service = createServiceClient()
  const { data: orders } = await service
    .from('shop_orders')
    .select(
      'id, status, total_cents, payment_provider, payment_reference, created_at, ship_name',
    )
    .in('status', ['awaiting_payment', 'paid', 'packed'])
    .order('created_at', { ascending: true })

  const inStatus = (status: string) => (orders ?? []).filter((order) => order.status === status)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-cx-black">Orders</h1>
      <p className="mt-1 text-sm text-cx-stone">
        Oldest first. Zelle payments are confirmed by hand — nothing ships without a
        click here.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {COLUMNS.map(([title, status, hint]) => {
          const rows = inStatus(status)
          return (
            <section key={status}>
              <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
                {title} <span className="font-mono text-cx-dark">({rows.length})</span>
              </h2>
              <p className="mt-1 text-xs text-cx-stone">{hint}</p>

              <ul className="mt-3 space-y-2">
                {rows.length === 0 && (
                  <li className="rounded border border-dashed border-cx-light p-3 text-sm text-cx-stone">
                    Nothing here.
                  </li>
                )}
                {rows.map((order) => (
                  <li key={order.id} className="rounded border border-cx-light bg-cx-off p-3">
                    <p className="font-mono text-sm text-cx-teal">{order.payment_reference}</p>
                    <p className="mt-1 text-sm text-cx-dark">{order.ship_name}</p>
                    <p className="mt-1 font-mono text-xs text-cx-stone">
                      {formatPrice(order.total_cents)} · {order.payment_provider} ·{' '}
                      {new Date(order.created_at).toISOString().slice(0, 10)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}
