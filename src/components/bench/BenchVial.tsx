// One vial on the bench, dressed in the label we print for real vials.
//
// The label follows design/vial-labels/generate-labels.mjs, paper skin: paper
// ground, ink rules, a teal dot beside the serif wordmark, the compound in
// Cormorant, the spec in JetBrains Mono, a dashed batch zone, and the ink
// "research use only" band along the bottom. Where the printed label carries a
// lot number, this one carries what the person recorded — how much is left.
//
// The liquid is drawn only where a level is actually known (see bench.ts).

import Link from 'next/link'
import type { BenchVial as Vial } from '@/lib/bench'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const PAPER = '#E6E9EB'
const TEAL = '#1A8A9E'
const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', ui-monospace, monospace"

const W = 112
const BODY_H = 190

export function BenchVial({ vial }: { vial: Vial }) {
  const empty = !vial.recorded

  return (
    <div style={{ width: W, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link
        href={vial.editHref}
        title={empty ? `Record the ${vial.name} vial` : `Edit ${vial.name}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'inherit',
          textDecoration: 'none',
          opacity: empty ? 0.75 : 1,
        }}
      >
        {/* crimp cap */}
        <span
          style={{
            width: 64,
            height: 22,
            borderRadius: '4px 4px 1px 1px',
            background: empty
              ? 'transparent'
              : 'linear-gradient(90deg,#8C959B,#DDE1E3 32%,#B9C0C4 58%,#79828A)',
            border: `1px ${empty ? 'dashed' : 'solid'} rgba(26,29,31,.45)`,
            borderBottom: 'none',
            display: 'block',
          }}
        />
        {/* neck */}
        <span
          style={{
            width: 52,
            height: 8,
            borderLeft: `1px ${empty ? 'dashed' : 'solid'} rgba(26,29,31,.35)`,
            borderRight: `1px ${empty ? 'dashed' : 'solid'} rgba(26,29,31,.35)`,
            background: empty ? 'transparent' : 'rgba(255,255,255,.5)',
            display: 'block',
          }}
        />
        {/* glass */}
        <span
          style={{
            width: W,
            height: BODY_H,
            position: 'relative',
            display: 'block',
            overflow: 'hidden',
            border: `1px ${empty ? 'dashed' : 'solid'} rgba(26,29,31,.42)`,
            borderRadius: '14px 14px 16px 16px',
            background: empty
              ? 'transparent'
              : 'linear-gradient(90deg, rgba(255,255,255,.9) 0%, rgba(255,255,255,.3) 20%, rgba(26,29,31,.04) 55%, rgba(255,255,255,.6) 85%, rgba(26,29,31,.08) 100%)',
          }}
        >
          {vial.fill !== null && vial.fill > 0 && (
            <span
              style={{
                position: 'absolute',
                left: 7,
                right: 7,
                bottom: 7,
                height: `${Math.max(6, vial.fill * 0.9)}%`,
                background: 'linear-gradient(180deg, rgba(26,138,158,.14), rgba(26,138,158,.26))',
                borderTop: '1px solid rgba(26,138,158,.55)',
                borderRadius: '2px 2px 10px 10px',
              }}
            />
          )}

          {empty ? (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 10,
                textAlign: 'center',
              }}
            >
              <span style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.05, color: INK }}>
                {vial.name}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '.18em', color: TEAL }}>
                + ADD VIAL
              </span>
            </span>
          ) : (
            // The label: wraps the glass from 36px down, as a printed one would.
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 34,
                background: PAPER,
                borderTop: `1px solid ${INK}`,
                borderBottom: `1px solid ${INK}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ padding: '7px 8px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ width: 4, height: 4, borderRadius: '50%', background: TEAL, flex: 'none' }}
                />
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 6.5,
                    fontWeight: 500,
                    letterSpacing: '.16em',
                    color: INK,
                    whiteSpace: 'nowrap',
                  }}
                >
                  PEPTIDE CORTEX
                </span>
              </span>
              <span
                style={{
                  padding: '6px 8px 0',
                  fontFamily: SERIF,
                  fontSize: 19,
                  lineHeight: 1,
                  color: INK,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontVariantNumeric: 'lining-nums',
                }}
              >
                {vial.name}
              </span>
              <span style={{ padding: '4px 8px 0', fontFamily: MONO, fontSize: 8.5, color: INK2 }}>
                {vial.size ?? 'size not recorded'}
              </span>
              <span
                style={{
                  margin: '6px 7px 7px',
                  padding: '3px 4px',
                  border: `1px dashed rgba(26,29,31,.45)`,
                  fontFamily: MONO,
                  fontSize: 8,
                  color: INK,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {vial.caption.toUpperCase()}
              </span>
              <span
                style={{
                  background: INK,
                  color: '#FAFAF8',
                  fontFamily: SANS,
                  fontSize: 5.2,
                  fontWeight: 500,
                  letterSpacing: '.04em',
                  padding: '3px 4px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                RESEARCH USE ONLY
              </span>
            </span>
          )}
        </span>
      </Link>

      <span
        style={{
          marginTop: 10,
          fontFamily: SANS,
          fontSize: 9.5,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: INK3,
          whiteSpace: 'nowrap',
        }}
      >
        {vial.caption}
      </span>
      {vial.recorded && (
        <Link
          href={vial.editHref}
          style={{
            marginTop: 6,
            fontFamily: SANS,
            fontSize: 9.5,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: INK,
            textDecoration: 'underline',
            minHeight: 24,
          }}
        >
          Edit
        </Link>
      )}
    </div>
  )
}

/** The last tile on the shelf: the way to put another peptide on it. */
export function AddVialTile() {
  return (
    <Link
      href="/mirror"
      style={{
        width: W,
        flex: 'none',
        height: 22 + 8 + BODY_H,
        border: '1px dashed rgba(26,29,31,.42)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: INK,
        textDecoration: 'none',
        textAlign: 'center',
      }}
    >
      <span style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1, color: TEAL }}>+</span>
      <span style={{ fontFamily: SANS, fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase' }}>
        Add a peptide
      </span>
    </Link>
  )
}
