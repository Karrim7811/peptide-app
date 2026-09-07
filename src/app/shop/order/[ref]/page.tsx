// The order page.
//
// Seven states, one screen. What varies between them is a heading, a sentence
// about what happens next, and how far the timeline has got — not the layout, so
// a customer who has seen this page once can read it again without relearning
// it.
//
// Two rules the design is emphatic about, both enforced in
// src/lib/shop/orders/view.ts rather than here:
//
//   • Awaiting payment is not an error. No red, no warning glyph, no spinner. On
//     the Zelle rail it is simply where an order sits until a human matches the
//     memo, which is most of an order's life and entirely normal.
//   • No projected dates. A step shows a recorded timestamp or it shows prose.
//     A computed delivery date set in the same mono column as a recorded one
//     would be a guess indistinguishable from a fact.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/shop/CopyButton'
import { HAIR, KICKER, MONO, RULE, ShopChrome } from '@/components/shop/ShopChrome'
import { isValidReference } from '@/lib/shop/orders/reference'
import { recipientNote, zelleAccount } from '@/lib/shop/zelle-account'
import { orderByReference } from '@/lib/shop/orders/read.server'
import { orderView } from '@/lib/shop/orders/view'
import type { TimelineStep } from '@/lib/shop/orders/view'
import { formatPrice } from '@/lib/shop/pricing'

export const dynamic = 'force-dynamic'

const SHELF = 'USE WITHIN 28 DAYS · 2–8 °C'

export default async function OrderPage({ params }: { params: { ref: string } }) {
  const reference = decodeURIComponent(params.ref)
  if (!isValidReference(reference)) notFound()

  const order = await orderByReference(reference)
  if (!order) notFound()

  const view = orderView(order)
  const account = zelleAccount()
  const handle = account?.handle ?? null

  return (
    <ShopChrome>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            minWidth: 0,
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 60px',
          }}
        >
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={KICKER}>Order</span>
            <span
              style={{
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: 'clamp(34px,4vw,46px)',
                lineHeight: 1,
                letterSpacing: '.02em',
              }}
            >
              {view.reference}
            </span>
            {view.placed && (
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#3B4045' }}>
                placed {view.placed}
              </span>
            )}
          </div>

          <h1
            style={{
              margin: '28px 0 0',
              fontWeight: 300,
              fontSize: 'clamp(30px,3.4vw,40px)',
              lineHeight: 1.1,
              letterSpacing: '-.024em',
              textWrap: 'pretty',
              maxWidth: '24ch',
            }}
          >
            {view.head}
          </h1>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 19,
              lineHeight: 1.45,
              maxWidth: '62ch',
              textWrap: 'pretty',
            }}
          >
            {view.next}
          </p>

          {/* Repeated here so a customer who closed the instruction sheet still
              has everything needed to pay. */}
          {view.showZelleFacts && (
            <div
              style={{
                marginTop: 28,
                border: RULE,
                background: '#F4F5F6',
                padding: '18px 20px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))',
                gap: '18px 32px',
                alignItems: 'end',
              }}
            >
              <div>
                <div style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em', color: '#1A8A9E' }}>
                  Memo · reference
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 500,
                    fontSize: 'clamp(40px,4vw,56px)',
                    lineHeight: 1,
                    letterSpacing: '.02em',
                    marginTop: 8,
                  }}
                >
                  {view.reference}
                </div>
              </div>
              <div>
                <div style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em' }}>Send exactly</div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 500,
                    fontSize: 30,
                    lineHeight: 1,
                    marginTop: 8,
                  }}
                >
                  {view.total}
                </div>
              </div>
              <div>
                <div style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em' }}>To</div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    lineHeight: 1.2,
                    marginTop: 12,
                    wordBreak: 'break-all',
                  }}
                >
                  {handle ?? 'Not published yet'}
                </div>
                {/* The registered name, so the one the buyer's bank shows is
                    not a surprise at the moment they decide to send. */}
                {account && (
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.4, color: '#3B4045' }}>
                    {recipientNote(account)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <CopyButton value={view.reference} label="Copy code" filled />
                <CopyButton value={view.total.replace('$', '')} label="Copy amount" />
              </div>
            </div>
          )}

          <div style={{ marginTop: 36, borderTop: RULE }}>
            {view.steps.map((step, i) => (
              <Step key={`${step.label}-${i}`} step={step} />
            ))}
          </div>

          {view.tracking && (
            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns: 'minmax(0,140px) minmax(0,1fr)',
                gap: '10px 24px',
                alignItems: 'baseline',
              }}
            >
              <span style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em' }}>Tracking</span>
              <span style={{ fontFamily: MONO, fontSize: 16 }}>
                {view.tracking}
                <span style={{ fontSize: 12, color: '#3B4045', marginLeft: 12 }}>
                  {view.carrier}
                </span>
              </span>
            </div>
          )}

          {view.refundLine && (
            <p
              style={{
                margin: '28px 0 0',
                fontSize: 15.5,
                lineHeight: 1.45,
                color: '#3B4045',
                maxWidth: '64ch',
                textWrap: 'pretty',
              }}
            >
              {view.refundLine}
            </p>
          )}
        </div>

        <aside
          style={{
            minWidth: 0,
            background: '#F4F5F6',
            alignSelf: 'stretch',
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              ...KICKER,
              color: '#1A8A9E',
              borderBottom: RULE,
              paddingBottom: 8,
            }}
          >
            <span>Items</span>
            <span style={{ color: '#7E878E' }}>{view.payLabel}</span>
          </div>

          {view.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                gap: '0 14px',
                padding: '12px 0',
                borderBottom: HAIR,
                alignItems: 'baseline',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ fontSize: 20 }}>{item.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#3B4045', marginLeft: 10 }}>
                  {item.meta}
                </span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 14 }}>{item.total}</span>
            </div>
          ))}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              gap: '6px 14px',
              padding: '12px 0',
              fontFamily: MONO,
              fontSize: 13,
              color: '#3B4045',
            }}
          >
            <span>Subtotal</span>
            <span style={{ textAlign: 'right', color: '#1A1D1F' }}>{view.subtotal}</span>
            <span>Shipping · {view.methodName}</span>
            {/* Flagged, not zeroed. A dash here would read as free shipping. */}
            <span style={{ textAlign: 'right' }}>{view.shipping ?? '[ $ TBC ]'}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              gap: '0 14px',
              padding: '12px 0',
              borderTop: RULE,
              alignItems: 'baseline',
              fontFamily: MONO,
            }}
          >
            <span style={{ fontSize: 13 }}>Total</span>
            <span style={{ fontSize: 26, fontWeight: 500, textAlign: 'right' }}>{view.total}</span>
          </div>

          <div
            style={{
              marginTop: 24,
              borderTop: RULE,
              paddingTop: 12,
              display: 'grid',
              gridTemplateColumns: 'minmax(0,100px) minmax(0,1fr)',
              gap: '8px 14px',
              fontSize: 16,
              lineHeight: 1.4,
            }}
          >
            <Label>Ship to</Label>
            <span style={{ whiteSpace: 'pre-line' }}>{view.address}</span>
            <Label>Service</Label>
            <span>{view.methodLong}</span>
            <Label>Cold chain</Label>
            <span style={{ fontFamily: MONO, fontSize: 13 }}>{SHELF}</span>
          </div>

          {view.stage === 'awaiting' && (
            <Link
              href={`/shop/order/${encodeURIComponent(view.reference)}/zelle`}
              style={{
                display: 'inline-flex',
                marginTop: 24,
                border: RULE,
                color: '#1A1D1F',
                textDecoration: 'none',
                fontFamily: 'Jost, sans-serif',
                fontSize: 10.5,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                padding: '12px 16px',
                minHeight: 44,
                alignItems: 'center',
              }}
            >
              Payment instructions
            </Link>
          )}
        </aside>
      </div>
    </ShopChrome>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...KICKER, fontSize: 10, letterSpacing: '.22em', paddingTop: 4 }}>
      {children}
    </span>
  )
}

function Step({ step }: { step: TimelineStep }) {
  const done = step.state === 'done'
  const current = step.state === 'current'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '18px minmax(0,1fr) auto',
        gap: '0 16px',
        alignItems: 'baseline',
        padding: '14px 0',
        borderBottom: HAIR,
        color: done || current ? '#1A1D1F' : '#7E878E',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: `1px solid ${done ? '#1A1D1F' : current ? '#1A8A9E' : '#7E878E'}`,
          background: done ? '#1A1D1F' : current ? '#1A8A9E' : 'transparent',
          alignSelf: 'center',
        }}
      />
      <span style={{ minWidth: 0 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{step.label}</span>
      </span>
      {/* A recorded time is mono, like every other fact. An estimate is italic
          serif, so the two can never be mistaken for each other. */}
      {step.when ? (
        <span style={{ fontFamily: MONO, fontSize: 13, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {step.when}
        </span>
      ) : (
        <span
          style={{
            fontSize: 15.5,
            fontStyle: 'italic',
            color: '#3B4045',
            textAlign: 'right',
          }}
        >
          {step.estimate}
        </span>
      )}
    </div>
  )
}
