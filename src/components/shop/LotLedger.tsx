// The lot ledger.
//
// The most important block in the shop. Anyone can post one certificate for the
// batch they are currently selling; almost nobody can show a run of consecutive
// batches with dates on them. The dates are what make it a record rather than
// three loose numbers, so they lead the row.
//
// Three shapes share this component because they answer the same question —
// "what is actually in the vial, and how do you know" — and a reader moving
// between products should not have to relearn where the answer lives.

import type { Ledger, ProductView } from '@/lib/shop/view'

const MONO = "'JetBrains Mono', monospace"
const HAIR = '1px solid rgba(26,29,31,.18)'
const RULE = '1px solid #1A1D1F'

const HEAD: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: 10,
  letterSpacing: '.2em',
  textTransform: 'uppercase',
  color: '#7E878E',
  paddingBottom: 8,
  borderBottom: RULE,
}

const NOTE: React.CSSProperties = {
  margin: '12px 0 0',
  fontSize: 17,
  lineHeight: 1.4,
  fontStyle: 'italic',
  textWrap: 'pretty',
}

function Purity({ ledger }: { ledger: Ledger }) {
  const cols = 'auto auto minmax(0,1fr) auto auto'
  return (
    <>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: cols, gap: '0 18px', ...HEAD }}>
        <span>Assayed</span>
        <span>Lot</span>
        <span />
        <span style={{ textAlign: 'right' }}>Purity</span>
        <span style={{ textAlign: 'right' }}>Measured</span>
      </div>

      {ledger.rows.map((row) => (
        <div
          key={row.lot ?? row.mfg ?? Math.random()}
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            gap: '0 18px',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: HAIR,
            fontFamily: MONO,
            fontSize: 15,
          }}
        >
          <span style={{ fontWeight: 500 }}>{row.mfg}</span>
          <span style={{ color: row.isCurrent ? '#1A1D1F' : '#3B4045' }}>
            {row.lot}
            {row.isCurrent && (
              <span
                style={{
                  color: '#1A8A9E',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  marginLeft: 8,
                }}
              >
                shipping now
              </span>
            )}
          </span>
          <span />
          <span style={{ fontWeight: 500, textAlign: 'right', fontSize: 20 }}>{row.purity}</span>
          <span style={{ color: '#3B4045', textAlign: 'right' }}>{row.measured}</span>
        </div>
      ))}

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          fontFamily: MONO,
          fontSize: 12.5,
          color: '#3B4045',
        }}
      >
        <span>{ledger.range}</span>
        <span>{ledger.floor}</span>
      </div>
    </>
  )
}

function Composition({ product }: { product: ProductView }) {
  const cols = 'minmax(0,1fr) auto'
  return (
    <>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: cols, gap: '0 18px', ...HEAD }}>
        <span>Component</span>
        <span style={{ textAlign: 'right' }}>Measured</span>
      </div>

      {product.components.map((c) => (
        <div
          key={c.name}
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            gap: '0 18px',
            padding: '12px 0',
            borderBottom: HAIR,
            fontFamily: MONO,
            fontSize: 15,
            alignItems: 'baseline',
          }}
        >
          <span>{c.name}</span>
          <span style={{ fontWeight: 500, fontSize: 20 }}>{c.mg} mg</span>
        </div>
      ))}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gap: '0 18px',
          padding: '14px 0 6px',
          borderBottom: RULE,
          fontFamily: MONO,
          fontSize: 15,
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontWeight: 500 }}>Measured total</span>
        <span style={{ fontWeight: 500, fontSize: 24 }}>{product.measured} mg</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gap: '0 18px',
          padding: '8px 0',
          fontFamily: MONO,
          fontSize: 13,
          color: '#3B4045',
        }}
      >
        <span>Labelled</span>
        <span>{product.labelled} mg</span>
      </div>
    </>
  )
}

function Pending({ product }: { product: ProductView }) {
  return (
    <>
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'auto auto minmax(0,1fr) auto auto',
          gap: '0 18px',
          ...HEAD,
        }}
      >
        <span>Assayed</span>
        <span>Lot</span>
        <span />
        <span style={{ textAlign: 'right' }}>Purity</span>
        <span style={{ textAlign: 'right' }}>Measured</span>
      </div>

      {/* An empty ruled row, the same height an assayed row would be. The
          columns stay so the reader sees the shape of what is missing rather
          than a tidied-away absence. */}
      <div style={{ height: 46, borderBottom: HAIR }} />

      <div
        style={{
          marginTop: 10,
          fontFamily: MONO,
          fontSize: 12.5,
          borderBottom: '1px dashed #1A1D1F',
          display: 'inline-block',
          paddingBottom: 1,
        }}
      >
        Expected {product.expected}
      </div>
    </>
  )
}

export function LotLedger({ product }: { product: ProductView }) {
  const { ledger } = product
  return (
    <section>
      {product.state === 'pending' ? (
        <Pending product={product} />
      ) : product.isBlend ? (
        <Composition product={product} />
      ) : (
        <Purity ledger={ledger} />
      )}
      <p style={NOTE}>{ledger.note}</p>
    </section>
  )
}
