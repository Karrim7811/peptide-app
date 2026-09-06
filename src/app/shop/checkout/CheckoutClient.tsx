'use client'

// Checkout.
//
// Two choices that are not two versions of one thing: a shipping service, and a
// payment rail whose journeys diverge completely. Crypto redirects to a hosted
// checkout; Zelle has nowhere to send anyone and shows a code to type into a
// banking app instead.
//
// SHIPPING IS UNPRICED. Every method's price is null in the catalogue and
// orderTotals() throws rather than assume one, so checkout cannot complete. That
// is deliberate — the alternative is charging a number nobody chose. This screen
// says so plainly rather than rendering a total it cannot stand behind.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { HAIR, KICKER, MONO, RULE } from '@/components/shop/ShopChrome'
import { type CartLineView, cartLines, subtotalCents } from '@/lib/shop/cart'
import { SHIPPING_METHODS, sellableMethods } from '@/lib/shop/orders/shipping'
import type { ShippingMethodId } from '@/lib/shop/orders/shipping'
import type { PaymentProviderId } from '@/lib/shop/orders/types'
import { formatPrice } from '@/lib/shop/pricing'

const FIELDS = [
  ['name', 'Full name', 'name'],
  ['line1', 'Address', 'address-line1'],
  ['line2', 'Apartment, suite (optional)', 'address-line2'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['postal', 'ZIP', 'postal-code'],
] as const

export function CheckoutClient() {
  const [lines, setLines] = useState<CartLineView[] | null>(null)
  const [method, setMethod] = useState<ShippingMethodId>('priority')
  const [provider, setProvider] = useState<PaymentProviderId>('btcpay')

  const refresh = useCallback(() => setLines(cartLines()), [])
  useEffect(() => {
    refresh()
    window.addEventListener('pc-cart', refresh)
    return () => window.removeEventListener('pc-cart', refresh)
  }, [refresh])

  if (lines === null) return <div style={{ minHeight: 320 }} />

  if (lines.length === 0) {
    return (
      <div style={{ padding: 'clamp(32px,5vw,64px) clamp(16px,3vw,32px)' }}>
        <h1 style={{ fontWeight: 300, fontSize: 'clamp(32px,4vw,46px)', margin: 0 }}>
          Nothing to check out
        </h1>
        <Link href="/shop" style={{ ...KICKER, color: '#1A1D1F', display: 'inline-block', marginTop: 20 }}>
          Back to the shop
        </Link>
      </div>
    )
  }

  const subtotal = subtotalCents(lines)
  const sellable = sellableMethods()
  const canOrder = sellable.length > 0

  return (
    <div
      style={{
        padding: 'clamp(28px,4vw,48px) clamp(16px,3vw,32px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))',
        gap: 'clamp(28px,4vw,56px)',
        alignItems: 'start',
      }}
    >
      <div>
        <h1
          style={{
            fontWeight: 300,
            fontSize: 'clamp(32px,4vw,46px)',
            lineHeight: 1,
            letterSpacing: '-.028em',
            margin: 0,
          }}
        >
          Checkout
        </h1>

        <div style={{ marginTop: 28 }}>
          <div style={KICKER}>Ship to · US only</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {FIELDS.map(([id, label, auto]) => (
              <label key={id} style={{ display: 'block' }}>
                <span style={{ ...KICKER, fontSize: 9.5, display: 'block', marginBottom: 5 }}>
                  {label}
                </span>
                <input
                  name={id}
                  autoComplete={auto}
                  style={{
                    width: '100%',
                    border: RULE,
                    background: '#F4F5F6',
                    padding: '12px 14px',
                    minHeight: 44,
                    fontFamily: MONO,
                    fontSize: 14,
                    color: '#1A1D1F',
                    borderRadius: 0,
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <fieldset style={{ marginTop: 30, border: 'none', padding: 0, margin: '30px 0 0' }}>
          <legend style={{ ...KICKER, padding: 0 }}>Shipping</legend>
          <div style={{ marginTop: 12, borderTop: RULE }}>
            {SHIPPING_METHODS.map((m) => (
              <label
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0,1fr) auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: HAIR,
                  cursor: 'pointer',
                  background: method === m.id ? '#EDF0F1' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                />
                <span>
                  <span style={{ fontSize: 19 }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: 15, color: '#3B4045' }}>
                    {m.carrier} · {m.transit}
                    {/* Only overnight is guaranteed. The other two are estimates
                        and must read as estimates. */}
                    {!m.guaranteed && <span style={{ fontStyle: 'italic' }}> (estimate)</span>}
                  </span>
                </span>
                <span style={{ fontFamily: MONO, fontSize: 14, color: '#7E878E' }}>
                  {m.priceCents === null ? '[ $ TBC ]' : formatPrice(m.priceCents)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ marginTop: 30, border: 'none', padding: 0, margin: '30px 0 0' }}>
          <legend style={{ ...KICKER, padding: 0 }}>Payment</legend>
          <div style={{ marginTop: 12, borderTop: RULE }}>
            <PayOption
              id="btcpay"
              title="Crypto"
              body="We send you to a hosted checkout and bring you back to your order. Confirms in minutes."
              selected={provider === 'btcpay'}
              onSelect={() => setProvider('btcpay')}
            />
            <PayOption
              id="zelle"
              title="Zelle"
              body="We show you a handle, an exact amount and a reference code for the memo. You pay in your banking app. We confirm by hand, usually within one business day."
              selected={provider === 'zelle'}
              onSelect={() => setProvider('zelle')}
            />
          </div>
        </fieldset>
      </div>

      <aside>
        <div style={KICKER}>Your order</div>
        <div style={{ marginTop: 12, borderTop: RULE }}>
          {lines.map((l) => (
            <div
              key={l.slug}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 0',
                borderBottom: HAIR,
                fontSize: 17,
              }}
            >
              <span>
                {l.name} <span style={{ color: '#7E878E' }}>× {l.qty}</span>
                <span style={{ display: 'block', ...KICKER, fontSize: 9.5 }}>{l.size}</span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 15 }}>{l.linePrice}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 0',
            fontFamily: MONO,
            fontSize: 15,
          }}
        >
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottom: RULE,
            fontFamily: MONO,
            fontSize: 15,
            color: '#7E878E',
          }}
        >
          <span>Shipping</span>
          <span>[ $ TBC ]</span>
        </div>

        {!canOrder && (
          // Says why rather than presenting a dead button. Shipping is genuinely
          // unpriced and orderTotals() refuses rather than inventing a figure.
          <p
            style={{
              margin: '18px 0 0',
              fontSize: 17,
              fontStyle: 'italic',
              lineHeight: 1.4,
              borderLeft: '2px solid #1A8A9E',
              paddingLeft: 12,
            }}
          >
            Shipping is not priced yet, so orders cannot be completed. Nothing here will
            charge you a figure nobody chose.
          </p>
        )}

        <button
          type="button"
          disabled={!canOrder}
          style={{
            marginTop: 20,
            width: '100%',
            appearance: 'none',
            border: RULE,
            background: canOrder ? '#1A1D1F' : 'transparent',
            color: canOrder ? '#F4F5F6' : '#7E878E',
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '14px 22px',
            minHeight: 44,
            cursor: canOrder ? 'pointer' : 'not-allowed',
          }}
        >
          {provider === 'zelle' ? 'Place order · pay by Zelle' : 'Place order · pay by crypto'}
        </button>

        <p
          style={{
            margin: '18px 0 0',
            fontFamily: 'Jost, sans-serif',
            fontSize: 10.5,
            lineHeight: 1.8,
            color: '#3B4045',
          }}
        >
          Refunds are handled by hand, not by a card network. Unopened vials with the
          cold-chain seal intact can be returned within 14 days of delivery for a full
          refund including original shipping. Opened vials cannot be returned — we cannot
          verify how they were stored after they left us.{' '}
          <Link href="/refund-policy" style={{ textDecoration: 'underline' }}>
            Full policy
          </Link>
          .
        </p>
      </aside>
    </div>
  )
}

function PayOption({
  id, title, body, selected, onSelect,
}: {
  id: string
  title: string
  body: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0,1fr)',
        gap: 14,
        padding: '16px 0',
        borderBottom: HAIR,
        cursor: 'pointer',
        background: selected ? '#EDF0F1' : 'transparent',
      }}
    >
      <input type="radio" name="payment" checked={selected} onChange={onSelect} value={id} />
      <span>
        <span style={{ fontSize: 19 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 15, color: '#3B4045', lineHeight: 1.35 }}>
          {body}
        </span>
      </span>
    </label>
  )
}
