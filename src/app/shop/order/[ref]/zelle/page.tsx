// The Zelle instruction sheet.
//
// Shown once, straight after an order is placed on the Zelle rail. Three facts
// carry the whole screen — the memo code, the exact amount, the handle — because
// a payment that arrives without the code is a manual search through a bank
// statement, and one that arrives for the wrong amount is a refund.
//
// The memo code is the largest thing on the page. That is not decoration: it is
// the single field people skip, and it is the only link between money landing in
// a bank account and this order existing.
//
// Everything here is also on the order page. This screen is a convenience, not a
// place anything is stored, so a customer who closes it has lost nothing.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/shop/CopyButton'
import { HAIR, KICKER, MONO, RULE, ShopChrome } from '@/components/shop/ShopChrome'
import { isValidReference } from '@/lib/shop/orders/reference'
import { orderByReference } from '@/lib/shop/orders/read.server'
import { shippingMethod } from '@/lib/shop/orders/shipping'
import { formatPrice } from '@/lib/shop/pricing'

export const dynamic = 'force-dynamic'

const STEPS = [
  'Open Zelle in your banking app and choose Send.',
  null, // Built below — it carries the handle inline.
  null, // Built below — it carries the code inline.
]

export default async function ZelleSheetPage({
  params,
}: {
  params: { ref: string }
}) {
  const reference = decodeURIComponent(params.ref)
  if (!isValidReference(reference)) notFound()

  const order = await orderByReference(reference)
  // Not-found rather than a sign-in prompt: an order page that behaves
  // differently for a reference that exists would confirm which ones do.
  if (!order || order.paymentProvider !== 'zelle') notFound()

  const handle = process.env.SHOP_ZELLE_HANDLE?.trim() || null
  const amount = formatPrice(order.totalCents)
  const method = shippingMethod(order.shippingMethod)
  const orderHref = `/shop/order/${encodeURIComponent(order.paymentReference)}`

  return (
    <ShopChrome showCart={false}>
      <div
        style={{
          padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 48px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontWeight: 300,
              fontSize: 'clamp(32px,4vw,46px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              margin: 0,
            }}
          >
            One code goes in the memo.
          </h1>
          <span style={KICKER}>
            Without it we cannot match your payment to this order
          </span>
        </div>

        <div
          style={{
            marginTop: 32,
            borderTop: RULE,
            borderBottom: RULE,
            padding: '22px 0 20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px 24px',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em' }}>
              Memo · reference code
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: 'clamp(64px,13vw,128px)',
                lineHeight: 1,
                letterSpacing: '.02em',
                marginTop: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {order.paymentReference}
            </div>
          </div>
          <CopyButton value={order.paymentReference} label="Copy code" filled />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
            gap: '0 40px',
            borderBottom: RULE,
          }}
        >
          <Fact
            kicker="Send exactly"
            value={amount}
            valueSize="clamp(34px,5vw,44px)"
            note={
              method.priceCents === null
                ? `before shipping · ${method.label} [ $ TBC ]`
                : `includes ${method.label} shipping`
            }
            copy={amount.replace('$', '')}
          />
          <Fact
            kicker="To · Zelle recipient"
            value={handle ?? 'Not published yet'}
            valueSize="clamp(17px,2.4vw,24px)"
            note={handle ? 'Peptide Cortex LLC' : 'Do not send anything until this appears'}
            copy={handle}
          />
        </div>

        {/* The handle comes from SHOP_ZELLE_HANDLE and there is no fallback. A
            stand-in address here would be an instruction to send money to
            someone who is not us. */}
        {!handle && (
          <p
            style={{
              margin: '24px 0 0',
              fontSize: 19,
              fontStyle: 'italic',
              lineHeight: 1.4,
              borderLeft: '2px solid #1A8A9E',
              paddingLeft: 14,
              maxWidth: '62ch',
            }}
          >
            The Zelle account is not set up yet, so there is nowhere to send this
            payment. Your order is saved under {order.paymentReference} and nothing
            has been charged. Email us with that reference and we will finish it by
            hand.
          </p>
        )}

        <ol
          style={{
            margin: '28px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))',
            gap: '20px 32px',
          }}
        >
          <Step n="01">{STEPS[0]}</Step>
          <Step n="02">
            Send the exact amount to{' '}
            <span style={{ fontFamily: MONO, fontSize: 17 }}>
              {handle ?? 'the handle above, once it is published'}
            </span>
            .
          </Step>
          <Step n="03">
            Paste{' '}
            <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 500 }}>
              {order.paymentReference}
            </span>{' '}
            in the memo — “what’s this for” at some banks — before you confirm.
          </Step>
        </ol>

        <p
          style={{
            margin: '28px 0 0',
            fontSize: 17,
            lineHeight: 1.45,
            color: '#3B4045',
            maxWidth: '70ch',
            textWrap: 'pretty',
          }}
        >
          We match Zelle payments by hand, usually within one business day. A payment
          that arrives without the memo still reaches us, but we have to find it —
          expect a delay and an email asking for details. Your order stays open for 3
          days.
        </p>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 32,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={orderHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: RULE,
              color: '#1A1D1F',
              textDecoration: 'none',
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              padding: '14px 22px',
              minHeight: 44,
            }}
          >
            I’ve sent it · view order
          </Link>
          <span style={{ fontSize: 15.5, fontStyle: 'italic', color: '#3B4045' }}>
            The code stays on your order page too.
          </span>
        </div>
      </div>
    </ShopChrome>
  )
}

function Fact({
  kicker,
  value,
  valueSize,
  note,
  copy,
}: {
  kicker: string
  value: string
  valueSize: string
  note: string
  copy: string | null
}) {
  return (
    <div
      style={{
        padding: '18px 0',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: 16,
        alignItems: 'end',
        borderBottom: HAIR,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em' }}>{kicker}</div>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: valueSize,
            lineHeight: 1.1,
            marginTop: 10,
            wordBreak: 'break-all',
          }}
        >
          {value}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: '#7E878E', marginTop: 6 }}>
          {note}
        </div>
      </div>
      {/* No button where there is nothing to copy. */}
      {copy && <CopyButton value={copy} />}
    </div>
  )
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li style={{ borderTop: HAIR, paddingTop: 12 }}>
      <span style={{ fontFamily: MONO, fontSize: 12, color: '#1A8A9E' }}>{n}</span>
      <p style={{ margin: '8px 0 0', fontSize: 21, lineHeight: 1.3, textWrap: 'pretty' }}>
        {children}
      </p>
    </li>
  )
}
