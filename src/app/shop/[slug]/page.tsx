// One product.
//
// Rebuilt from Product.dc.html. Two columns: what the peptide is on the left,
// what is provably in this vial on the right. The ledger is the right-hand
// column's whole job, because the assay is the argument.
//
// Prerendered per slug — the catalogue is typed constants, so there is nothing
// to fetch.
//
// Chrome comes from ShopChrome, which is the only place the cart link exists.
// This page and /shop drew their own header instead, identical to ShopChrome's
// but without that link — and these two are the only pages carrying an Add to
// cart button. So the cart filled and became unreachable. The back link the old
// header carried is ShopChrome's "Shop"; same destination, one header.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/shop/AddToCart'
import { LotLedger } from '@/components/shop/LotLedger'
import { LEGAL, ShopChrome } from '@/components/shop/ShopChrome'
import { PRODUCTS } from '@/lib/shop/catalogue'
import { productView } from '@/lib/shop/view'

const MONO = "'JetBrains Mono', monospace"
const RULE = '1px solid #1A1D1F'

const KICKER: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: 10.5,
  letterSpacing: '.26em',
  textTransform: 'uppercase',
  color: '#7E878E',
}

export function generateStaticParams() {
  return PRODUCTS.filter((p) => p.active).map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = productView(params.slug)
  if (!p) return { title: 'Not found — Peptide Cortex' }
  return {
    title: `${p.name} ${p.size} — Peptide Cortex`,
    description:
      p.state === 'assayed'
        ? `${p.name} ${p.size}. ${p.purity ?? 'Composition'} assayed, lot ${p.lot}.`
        : `${p.name} ${p.size}. Independent assay commissioned; expected ${p.expected}.`,
  }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = productView(params.slug)
  if (!p) notFound()

  return (
    <ShopChrome>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'clamp(28px,4vw,56px)',
          padding: 'clamp(28px,4vw,52px) clamp(16px,3vw,32px) clamp(32px,4vw,56px)',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ ...KICKER, letterSpacing: '.22em' }}>
            № {p.index} · {p.purpose}
          </div>
          <h1
            style={{
              fontWeight: 300,
              fontSize: 'clamp(40px,5.4vw,64px)',
              lineHeight: 1,
              letterSpacing: '-.03em',
              margin: '14px 0 0',
            }}
          >
            {p.name}
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 22,
              fontStyle: 'italic',
              color: '#3B4045',
              lineHeight: 1.3,
            }}
          >
            {p.subtitle}
          </p>

          {p.notAPeptide && (
            // Said plainly rather than quietly filed under the category. A
            // library that tells you when something is not what the label says
            // is more trustworthy than one that rounds it off.
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 16,
                fontStyle: 'italic',
                color: '#3B4045',
                borderLeft: '2px solid #1A8A9E',
                paddingLeft: 12,
                lineHeight: 1.4,
              }}
            >
              Not a peptide — {p.notAPeptide}. Listed because it is commonly discussed
              alongside them.
            </p>
          )}

          {p.action && (
            <p style={{ margin: '22px 0 0', fontSize: 17, lineHeight: 1.45, color: '#3B4045' }}>
              {p.action}
            </p>
          )}

          {p.blendParts.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <div style={KICKER}>What is in it</div>
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
                {p.blendParts.map((part) => (
                  <li
                    key={part.name}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(26,29,31,.18)',
                      fontSize: 17,
                    }}
                  >
                    {part.name}
                    <span style={{ color: '#7E878E', fontSize: 15 }}> — {part.purpose}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 30, borderTop: RULE, paddingTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 30 }}>{p.price}</span>
              {/* Blends carry the reason, never a gap and never a ranking. */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 15,
                  color: p.unitPrice ? '#1A1D1F' : '#7E878E',
                }}
              >
                {p.unitPrice ?? p.unitPriceNote}
              </span>
            </div>
            <div style={{ ...KICKER, marginTop: 8 }}>{p.size} · one vial</div>
            <AddToCart slug={p.slug} />
          </div>
        </div>

        <div>
          <div style={KICKER}>The assay</div>
          <LotLedger product={p} />

          {p.state === 'pending' && (
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 17,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              Assay commissioned. This product ships with no published assay until then.
            </p>
          )}

          <p
            style={{
              margin: '28px 0 0',
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              lineHeight: 1.7,
              color: '#3B4045',
            }}
          >
            {LEGAL}
          </p>
        </div>
      </div>
    </ShopChrome>
  )
}
