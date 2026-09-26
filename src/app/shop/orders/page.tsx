// Your orders.
//
// Before this page an order was reachable only from the confirmation after
// checkout and from the receipt email, so closing the tab and losing the email
// lost the order — its status, its tracking, its Zelle reference. This lists
// every order the signed-in account has placed, newest first, each linking to
// the order page that already exists.
//
// Behind the shop's sign-in wall like everything under /shop (shop/layout.tsx);
// scoped to the caller by RLS, not by a check here (read.server.ts).

import Link from 'next/link'
import type { Metadata } from 'next'
import { HAIR, KICKER, MONO, RULE, ShopChrome } from '@/components/shop/ShopChrome'
import { ordersForCurrentUser } from '@/lib/shop/orders/read.server'
import { orderListRow } from '@/lib/shop/orders/view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Your orders · Peptide Cortex' }

export default async function OrdersPage() {
  const rows = (await ordersForCurrentUser()).map(orderListRow)

  return (
    <ShopChrome>
      <div style={{ padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 60px', maxWidth: 880 }}>
        <span style={KICKER}>Shop</span>
        <h1
          style={{
            margin: '14px 0 0',
            fontWeight: 300,
            fontSize: 'clamp(30px,3.4vw,40px)',
            lineHeight: 1.1,
            letterSpacing: '-.024em',
          }}
        >
          Your orders
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 18, lineHeight: 1.45, color: '#3B4045' }}>
          {rows.length === 0
            ? 'You have not placed an order yet.'
            : `${rows.length} ${rows.length === 1 ? 'order' : 'orders'}, newest first. Open one for its status, tracking and payment reference.`}
        </p>

        <div style={{ marginTop: 24, borderTop: RULE }}>
          {rows.map((row) => (
            <Link
              key={row.reference}
              href={row.href}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                gap: '4px 16px',
                alignItems: 'baseline',
                padding: '14px 0',
                minHeight: 44,
                borderBottom: HAIR,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, letterSpacing: '.02em' }}>
                  {row.reference}
                </span>
                <span style={{ marginLeft: 12, fontSize: 19 }}>{row.label}</span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    fontSize: 15.5,
                    fontStyle: 'italic',
                    color: '#3B4045',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.what}
                </span>
              </span>
              <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 13, whiteSpace: 'nowrap' }}>
                {row.total}
                {row.placed && (
                  <span style={{ display: 'block', marginTop: 3, color: '#3B4045' }}>{row.placed}</span>
                )}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            marginTop: 20,
            fontFamily: 'Jost, sans-serif',
            fontSize: 12,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#1A1D1F',
          }}
        >
          {rows.length === 0 ? 'Browse the shop' : 'Back to the shop'}
        </Link>
      </div>
    </ShopChrome>
  )
}
