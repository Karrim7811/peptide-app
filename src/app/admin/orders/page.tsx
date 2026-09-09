// The order queue.
//
// Three columns, because there are exactly three things to do: match a Zelle
// payment against the bank, pack a paid order, ship a packed one. Zelle cannot
// reconcile itself, so nothing leaves the building without a click here.
//
// The actions in ./actions.ts are wired to controls in ./OrderActions.tsx as of
// 2026-09-07. They had been written, guarded and tested since the shop was
// built, but nothing imported them — so this page could show a Zelle payment
// and offer no way to confirm it, and setting SHOP_ADMIN_USER_ID alone would
// not have let anything ship.
//
// This page stays a server component and does the reading: orders, their items,
// and the coded lots available per product. The client component owns only the
// form state. Every guard is still server-side — assertAdmin on each action,
// canTransition for legality, validatePackAssignment for the lot.

import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminRefusal, adminRefusalNote } from '@/lib/shop/admin-id'
import { formatPrice } from '@/lib/shop/pricing'
import { MarkPacked, MarkPaid, MarkShipped } from './OrderActions'

export const dynamic = 'force-dynamic'

const COLUMNS = [
  ['Awaiting payment', 'awaiting_payment', 'Match the reference against the bank.'],
  ['Paid', 'paid', 'Pick vials and record the lot for each item.'],
  ['Packed', 'packed', 'Add tracking and mark shipped.'],
] as const

export default async function AdminOrdersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 404 rather than 403. An admin route should not confirm it exists to someone
  // who is not the admin.
  //
  // The visitor learns nothing; the server log says which of the three causes
  // fired. Without that line the operator sees the same blank 404 whether the
  // variable is unset, the session is missing, or the id is simply another
  // account's — and has no way to tell them apart from outside.
  const refusal = adminRefusal(user?.id)
  if (refusal) {
    console.warn(`[admin/orders] refused — ${adminRefusalNote(refusal, user?.id)}`)
    notFound()
  }

  const service = createServiceClient()
  const { data: orders } = await service
    .from('shop_orders')
    .select(
      'id, status, total_cents, payment_provider, payment_reference, created_at, ship_name',
    )
    .in('status', ['awaiting_payment', 'paid', 'packed'])
    .order('created_at', { ascending: true })

  const orderIds = (orders ?? []).map((order) => order.id)

  // Items and lots, for the packing step only. Fetched in two queries rather
  // than per card: the queue is small, but N cards each firing their own reads
  // is the shape that stops being small quietly.
  const { data: items } = orderIds.length
    ? await service
        .from('shop_order_items')
        .select('id, order_id, product_id, qty, product_name, size_display')
        .in('order_id', orderIds)
    : { data: [] }

  // Array.from rather than a spread: the project's tsconfig target predates
  // downlevel iteration of a Set.
  const productIds = Array.from(new Set((items ?? []).map((item) => item.product_id)))

  // Only lots WITH a code can be packed. A null lot_code means that batch has
  // no recall path, and packing against it would make order_items.lot_id
  // decorative — see validatePackAssignment. Four launch SKUs are in that
  // state; their items render "no lot code on file" instead of a dropdown.
  const { data: lots } = productIds.length
    ? await service
        .from('shop_lots')
        .select('id, product_id, lot_code, is_current')
        .in('product_id', productIds)
        .not('lot_code', 'is', null)
        .order('is_current', { ascending: false })
    : { data: [] }

  const itemsFor = (orderId: string) =>
    (items ?? [])
      .filter((item) => item.order_id === orderId)
      .map((item) => ({
        id: item.id,
        productName: item.product_name,
        sizeDisplay: item.size_display,
        qty: item.qty,
        lots: (lots ?? [])
          .filter((lot) => lot.product_id === item.product_id)
          .map((lot) => ({
            id: lot.id,
            label: lot.is_current ? `${lot.lot_code} · current` : (lot.lot_code as string),
          })),
      }))

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

                    {/* A BTCPay order reaches 'paid' through the signed webhook
                        and must never be advanced by hand — the whole point of
                        the signature is that a human did not vouch for it. Only
                        Zelle gets the button. */}
                    {status === 'awaiting_payment' && order.payment_provider === 'zelle' && (
                      <MarkPaid orderId={order.id} reference={order.payment_reference} />
                    )}
                    {status === 'awaiting_payment' && order.payment_provider !== 'zelle' && (
                      <p className="mt-2 text-xs text-cx-stone">
                        Confirms itself through the payment webhook. Nothing to do here.
                      </p>
                    )}
                    {status === 'paid' && (
                      <MarkPacked orderId={order.id} items={itemsFor(order.id)} />
                    )}
                    {status === 'packed' && <MarkShipped orderId={order.id} />}
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
