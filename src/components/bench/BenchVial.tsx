// One vial on the bench, dressed in the label we print for real vials.
//
// The label follows the teal print artwork (liene-labels-teal): teal ground, a
// white dot and spaced serif wordmark, the compound in black Cormorant with a
// rule under it, the spec in white JetBrains Mono, a white-ruled batch box, and
// the black band with "research use only" in condensed red. Where the printed label carries a
// lot number, this one carries what the person recorded — how much is left.
//
// The liquid is drawn only where a level is actually known (see bench.ts).

import Link from 'next/link'
import type { BenchVial as Vial } from '@/lib/bench'

const INK = '#1A1D1F'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', ui-monospace, monospace"
// Sampled from liene-labels-teal/*.png, the print artwork.
const LABEL_TEAL = '#2E9AA6'
const LABEL_BAND = '#0E1418'
const LABEL_RED = '#AE2828'
const CONDENSED = "'Bebas Neue', 'Oswald', Impact, 'Arial Narrow', sans-serif"

const W = 136
const BODY_H = 206

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
            // The label: the teal print label (liene-labels-teal), front panel.
            // The write-on reconstitution box sits on the back of the real
            // wrap, so it is not drawn; everything else keeps its colour, type
            // and order. Where the print carries lot and dates, this carries
            // what the person recorded — how much is left.
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 30,
                background: LABEL_TEAL,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ padding: '8px 9px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', flex: 'none' }}
                />
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 6.5,
                    fontWeight: 500,
                    letterSpacing: '.3em',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  PEPTIDE CORTEX
                </span>
              </span>
              <span style={{ padding: '5px 9px 0', display: 'flex' }}>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: '#000000',
                    borderBottom: '1.5px solid #000000',
                    paddingBottom: 1,
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontVariantNumeric: 'lining-nums',
                  }}
                >
                  {vial.name}
                </span>
              </span>
              <span style={{ padding: '6px 9px 0', fontFamily: MONO, fontSize: 11, color: '#FFFFFF' }}>
                {vial.size ?? 'size —'}
              </span>
              <span
                style={{
                  margin: '6px 9px 0',
                  padding: '3px 5px',
                  border: '1px solid rgba(255,255,255,.85)',
                  fontFamily: MONO,
                  fontSize: 8.5,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {vial.caption.toUpperCase()}
              </span>
              <span style={{ padding: '6px 9px 8px', fontFamily: MONO, fontSize: 7, color: '#FFFFFF' }}>
                peptidecortex.com
              </span>
              <span
                style={{
                  background: LABEL_BAND,
                  color: LABEL_RED,
                  fontFamily: CONDENSED,
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: '.03em',
                  lineHeight: 1,
                  padding: '5px 4px',
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
          // Phones: a 44px, 12px target. From md up, the original 24px / 9.5px.
          className="inline-flex min-h-[44px] items-center text-[12px] md:block md:min-h-[24px] md:text-[9.5px]"
          style={{
            marginTop: 6,
            fontFamily: SANS,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: INK,
            textDecoration: 'underline',
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
