'use client'

import { CX } from './_lib/tokens'

// Ports `#s3` (bottom half) from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 105).
//
// `data-mode="3"` feeds `useSceneMode` (cyan vial formation). Stats (66 / 12
// / 10) are static text — no scroll-triggered counter, per the task brief.
export default function PeptideNodes() {
  return (
    <section
      data-mode="3"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '16vh clamp(20px,5vw,60px) 120px',
      }}
    >
      <div data-reveal style={{ maxWidth: 660, marginLeft: 'auto', textAlign: 'right' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: CX.cy,
            marginBottom: 22,
          }}
        >
          03 · Peptides as nodes
        </div>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: 'clamp(40px,6.5vw,84px)',
            lineHeight: 1.02,
          }}
        >
          Every vial, <span style={{ fontStyle: 'italic', color: CX.cy }}>mapped</span>
          <br />
          into the graph.
        </h2>
        <p
          style={{
            marginTop: 26,
            fontSize: 15,
            color: CX.dim,
            lineHeight: 1.95,
            maxWidth: '48ch',
            marginLeft: 'auto',
          }}
        >
          BPC-157, TB-500, GHK-Cu, CJC-1295 — each becomes a node in the network, its synergies and pathway overlaps drawn automatically.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 34,
            justifyContent: 'flex-end',
            marginTop: 34,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: 'clamp(36px,4vw,56px)',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              66
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#6b7688',
                marginTop: 8,
              }}
            >
              Compounds mapped
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: 'clamp(36px,4vw,56px)',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              12
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#6b7688',
                marginTop: 8,
              }}
            >
              Goal categories
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: 'clamp(36px,4vw,56px)',
                color: CX.cy,
                lineHeight: 1,
              }}
            >
              10
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#6b7688',
                marginTop: 8,
              }}
            >
              Curated stacks
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
