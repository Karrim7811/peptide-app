'use client'

import { CX } from './_lib/tokens'

// Ports `#s3` (top half) from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 98).
//
// `data-mode="2"` feeds `useSceneMode` (purple formation). The prototype
// wraps this half and `PeptideNodes`'s half in a single `<section id="s3">`;
// since each half is its own component here, the `id="s3"` anchor (used by
// `Nav`'s "How it works" link) lives on this component as the first of the
// pair.
export default function Mechanisms() {
  return (
    <section
      id="s3"
      data-mode="2"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '120px clamp(20px,5vw,60px) 12vh',
      }}
    >
      <div data-reveal style={{ maxWidth: 660 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: CX.pu,
            marginBottom: 22,
          }}
        >
          02 · Mechanisms
        </div>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: 'clamp(40px,6.5vw,84px)',
            lineHeight: 1.02,
          }}
        >
          Understanding <span style={{ fontStyle: 'italic', color: CX.pu }}>mechanisms</span>,
          <br />
          not just molecules.
        </h2>
        <p
          style={{
            marginTop: 26,
            fontSize: 15,
            color: CX.dim,
            lineHeight: 1.95,
            maxWidth: '48ch',
          }}
        >
          VEGF, mTOR, IGF-1, TGF-β — Cortex maps the pathways compounds are studied to act on, then surfaces the relationships buried across thousands of papers.
        </p>
      </div>
    </section>
  )
}
