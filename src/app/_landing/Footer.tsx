'use client'

import { CX } from './_lib/tokens'

// Ports `<footer>` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 280).
//
// The prototype's footer wordmark abbreviates to "CORTEX"; per the brand
// spec (CLAUDE.md §6) this uses the full "PEPTIDE CORTEX" wordmark instead.
// Terms/Privacy/Contact point at real routes/mailto instead of the
// prototype's `href="#"` placeholders.
export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 2,
        padding: '60px clamp(20px,5vw,60px) 40px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(5,5,5,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: CX.cy,
              boxShadow: `0 0 10px ${CX.cy}`,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.3em',
              color: '#fff',
            }}
          >
            PEPTIDE CORTEX
          </span>
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: CX.faintest,
          }}
        >
          © 2026 Peptide Cortex · Tigris Tech Labs · Research use only
        </div>

        <div
          style={{
            display: 'flex',
            gap: 22,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <a href="/terms" style={{ color: CX.faint }}>Terms</a>
          <a href="/privacy" style={{ color: CX.faint }}>Privacy</a>
          <a href="mailto:hello@peptidecortex.com" style={{ color: CX.faint }}>Contact</a>
        </div>
      </div>
    </footer>
  )
}
