'use client'

import { CX } from './_lib/tokens'

// Ports the trust band from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 244).
//
// `data-mode="5"`. Three hairline cells on a 1px-gap grid, each revealing on
// scroll via `[data-reveal]` (staggered 0/90/180ms, handled by the single
// `useReveal()` call in the page shell). Copy is verbatim from the prototype.

const MONO = "'JetBrains Mono', monospace"

const CELLS: Array<{ label: string; color: string; body: string; delay?: number }> = [
  {
    label: 'SOURCED',
    color: CX.cy,
    body: 'Every entry traces to primary literature — cross-referenced, never invented.',
  },
  {
    label: 'REFERENCE, NOT RX',
    color: CX.pu,
    body: 'Educational research reference for adults 18+. We do not diagnose, treat or prescribe.',
    delay: 90,
  },
  {
    label: 'YOUR DATA',
    color: CX.go,
    body: 'Row-level isolation. Your stack and notes are yours — never sold, never training data.',
    delay: 180,
  },
]

export default function Trust() {
  return (
    <section data-mode="5" style={{ position: 'relative', zIndex: 2, padding: '10vh clamp(20px,5vw,60px)' }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {CELLS.map((cell) => (
          <div
            key={cell.label}
            data-reveal
            data-reveal-delay={cell.delay}
            style={{ background: '#050505', padding: '40px 30px' }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.22em',
                color: cell.color,
                marginBottom: 16,
              }}
            >
              {cell.label}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.85, color: CX.dim }}>{cell.body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
