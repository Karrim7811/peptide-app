// One catalogue card.
//
// Rebuilt from Shop.dc.html. Values are transcribed from the prototype's inline
// styles rather than approximated — the handoff says every style is inline on
// the element and to read the element you are rebuilding, so this is
// transcription, not interpretation.
//
// Three mutually exclusive assay blocks share one slot so every card is the same
// height whatever state it is in. A pending card keeps the labels and the rules
// and empties only the figures — the shape of what is missing, which is the
// point. Spec §5.

import Link from 'next/link'
import type { ShopCard as Card } from '@/lib/shop/view'

const KICKER: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: 10,
  letterSpacing: '.2em',
  textTransform: 'uppercase',
  color: '#7E878E',
}

const MONO = "'JetBrains Mono', monospace"
const HAIR = '1px solid rgba(26,29,31,.18)'
const RULE = '1px solid #1A1D1F'

export function ShopCard({ card }: { card: Card }) {
  return (
    <Link
      href={card.href}
      className="shop-card"
      style={{
        // Grows to fill a short last row so the grid never shows its ink
        // ground through an empty cell.
        flex: '1 1 300px',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        padding: '22px 22px 20px',
        minHeight: 340,
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          ...KICKER,
          letterSpacing: '.22em',
        }}
      >
        <span>№ {card.index}</span>
        <span style={{ textAlign: 'right' }}>{card.purpose}</span>
      </div>

      <div style={{ marginTop: 22, fontSize: 36, lineHeight: 1, letterSpacing: '-.02em' }}>
        {card.name}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 16,
          fontStyle: 'italic',
          color: '#3B4045',
          lineHeight: 1.3,
        }}
      >
        {card.subtitle}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        {card.state === 'assayed' && !card.isBlend && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                borderTop: RULE,
                paddingTop: 12,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 34,
                  fontWeight: 500,
                  letterSpacing: '-.02em',
                  lineHeight: 1,
                }}
              >
                {card.purity}
              </span>
              <span style={KICKER}>purity</span>
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontFamily: MONO,
                fontSize: 12.5,
                borderTop: HAIR,
                paddingTop: 8,
              }}
            >
              <span>{card.measured} mg measured</span>
              <span style={{ color: '#3B4045' }}>{card.labelled} mg labelled</span>
            </div>
          </>
        )}

        {card.isBlend && (
          <div style={{ borderTop: RULE, paddingTop: 10, fontFamily: MONO, fontSize: 12.5 }}>
            {card.components.map((c) => (
              <div
                key={c.name}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}
              >
                <span style={{ color: '#3B4045' }}>{c.name}</span>
                <span>{c.mg} mg</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0 0',
                marginTop: 4,
                borderTop: '1px solid rgba(26,29,31,.35)',
                fontWeight: 500,
              }}
            >
              <span>Measured</span>
              <span>{card.measured} mg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3B4045' }}>
              <span>Labelled</span>
              <span>{card.labelled} mg</span>
            </div>
          </div>
        )}

        {card.state === 'pending' && (
          <div style={{ borderTop: RULE, paddingTop: 12 }}>
            {/* Labels and rules stay; only the figures are empty. The gap is the
                content — a tidied-away empty state would hide the admission. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                height: 34,
              }}
            >
              <span />
              <span style={KICKER}>purity</span>
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontFamily: MONO,
                fontSize: 12.5,
                borderTop: HAIR,
                paddingTop: 8,
                minHeight: 25,
              }}
            >
              <span />
              <span style={{ color: '#3B4045' }}>{card.labelled} mg labelled</span>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 12px',
            fontFamily: MONO,
            fontSize: 12.5,
            borderTop: HAIR,
            paddingTop: 8,
            minHeight: 44,
          }}
        >
          {/* Only labels that have something under them. The purity gap above is
              a deliberate admission and it works because it is rare — a card
              full of empty labelled rows makes absence look routine and takes
              the meaning out of the one gap that is saying something. */}
          <span style={KICKER}>{card.lot ? 'Lot' : ''}</span>
          <span style={{ ...KICKER, textAlign: 'right' }}>{card.dates ? 'Mfg · Exp' : ''}</span>
          <span>{card.lot}</span>
          <span style={{ textAlign: 'right', color: '#3B4045' }}>{card.dates}</span>
        </div>

        {card.state === 'pending' && (
          <div style={{ marginTop: 10, borderTop: RULE, paddingTop: 10 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12.5,
                borderBottom: '1px dashed #1A1D1F',
                display: 'inline-block',
                paddingBottom: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Expected {card.expected}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 16, fontStyle: 'italic', lineHeight: 1.3 }}>
              Assay commissioned. This product ships with no published assay until then.
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: MONO,
            fontSize: 12.5,
            borderTop: RULE,
            paddingTop: 12,
          }}
        >
          <span style={{ fontSize: 15 }}>{card.price}</span>
          {/* A blend says why there is no per-mg figure rather than leaving a
              gap. Never a ranking — per-mg compares within a compound only. */}
          <span style={{ color: card.unitPrice ? '#1A1D1F' : '#7E878E' }}>
            {card.unitPrice ?? card.unitPriceNote}
          </span>
        </div>
        <div style={{ marginTop: 6, ...KICKER }}>{card.size}</div>
      </div>
    </Link>
  )
}
