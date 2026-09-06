'use client'

// The cart.
//
// Client-only, because the cart lives in localStorage. It renders a skeleton
// until hydration rather than a server-rendered empty state, which would flash
// "your cart is empty" at someone whose cart is not.
//
// No stock counts and no scarcity anywhere. Spec rule 8.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { HAIR, KICKER, MONO, RULE } from '@/components/shop/ShopChrome'
import { type CartLineView, cart, cartLines, subtotalCents } from '@/lib/shop/cart'
import { formatPrice } from '@/lib/shop/pricing'

export function CartClient() {
  const [lines, setLines] = useState<CartLineView[] | null>(null)

  const refresh = useCallback(() => setLines(cartLines()), [])

  useEffect(() => {
    refresh()
    window.addEventListener('pc-cart', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('pc-cart', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  // Pre-hydration. Deliberately blank rather than an empty-cart message.
  if (lines === null) return <div style={{ minHeight: 320 }} />

  if (lines.length === 0) {
    return (
      <div style={{ padding: 'clamp(32px,5vw,64px) clamp(16px,3vw,32px)' }}>
        <h1 style={{ fontWeight: 300, fontSize: 'clamp(32px,4vw,46px)', margin: 0 }}>
          Nothing in the cart
        </h1>
        <Link
          href="/shop"
          style={{
            ...KICKER,
            color: '#1A1D1F',
            display: 'inline-block',
            marginTop: 20,
            borderBottom: RULE,
            paddingBottom: 3,
          }}
        >
          Browse the seven
        </Link>
      </div>
    )
  }

  const subtotal = subtotalCents(lines)

  return (
    <div style={{ padding: 'clamp(28px,4vw,48px) clamp(16px,3vw,32px)' }}>
      <h1
        style={{
          fontWeight: 300,
          fontSize: 'clamp(32px,4vw,46px)',
          lineHeight: 1,
          letterSpacing: '-.028em',
          margin: 0,
        }}
      >
        Cart
      </h1>

      <div style={{ marginTop: 28, borderTop: RULE }}>
        {lines.map((line) => (
          <div
            key={line.slug}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto auto',
              gap: '0 clamp(16px,3vw,40px)',
              alignItems: 'center',
              padding: '20px 0',
              borderBottom: HAIR,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 26, lineHeight: 1.1 }}>{line.name}</div>
              <div style={{ fontSize: 15, fontStyle: 'italic', color: '#3B4045' }}>
                {line.subtitle}
              </div>
              <div style={{ ...KICKER, marginTop: 6, fontSize: 10 }}>
                {line.size} · {line.unitPrice} each
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <QtyButton label="−" onClick={() => cart.setQty(line.slug, line.qty - 1)} />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 15,
                  minWidth: 34,
                  textAlign: 'center',
                }}
              >
                {line.qty}
              </span>
              <QtyButton label="+" onClick={() => cart.setQty(line.slug, line.qty + 1)} />
            </div>

            <div style={{ textAlign: 'right', minWidth: 90 }}>
              <div style={{ fontFamily: MONO, fontSize: 17 }}>{line.linePrice}</div>
              <button
                type="button"
                onClick={() => cart.remove(line.slug)}
                style={{
                  ...KICKER,
                  fontSize: 9.5,
                  background: 'none',
                  border: 'none',
                  padding: '6px 0 0',
                  cursor: 'pointer',
                  textAlign: 'right',
                  width: '100%',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <span style={KICKER}>Subtotal</span>
        <span style={{ fontFamily: MONO, fontSize: 26 }}>{formatPrice(subtotal)}</span>
      </div>
      {/* Shipping is chosen at checkout, and its price is genuinely unset, so
          this says what it is rather than showing a total it cannot compute. */}
      <p style={{ margin: '10px 0 0', fontSize: 16, fontStyle: 'italic', color: '#3B4045' }}>
        Shipping is chosen at checkout. US delivery only.
      </p>

      <div style={{ marginTop: 30, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link
          href="/shop/checkout"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            background: '#1A1D1F',
            color: '#F4F5F6',
            padding: '14px 22px',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          Checkout
        </Link>
        <Link
          href="/shop"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            border: RULE,
            padding: '14px 22px',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#1A1D1F',
          }}
        >
          Keep looking
        </Link>
      </div>
    </div>
  )
}

function QtyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === '+' ? 'Increase quantity' : 'Decrease quantity'}
      style={{
        appearance: 'none',
        border: RULE,
        background: 'transparent',
        color: '#1A1D1F',
        fontFamily: MONO,
        fontSize: 15,
        width: 44,
        height: 44,
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  )
}
