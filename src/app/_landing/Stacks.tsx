'use client'

import type { CSSProperties } from 'react'
import { STACKS, type Stack } from '@/lib/stacks'
import { CX } from './_lib/tokens'

// Ports `#stacks` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 180,
// grid build logic in `buildStacks()` ~line 426).
//
// REAL DATA SURFACE — cards render the actual curated-stack library from
// `@/lib/stacks` (`STACKS`), the same data the authenticated `/stacks`
// browser uses. Cards intentionally omit doses/frequencies (that detail
// lives behind the real `/stacks` page) — only name, goal, difficulty and
// the compound list are shown here.
//
// Per-card reveal uses the shared `data-reveal` / `data-reveal-delay`
// convention wired up once by `useReveal()` in the page shell — no second
// IntersectionObserver here, staggered `(i % 3) * 80`ms same as the
// prototype's row-based stagger.

const MONO = "'JetBrains Mono', monospace"

const DIFF_COLOR: Record<Stack['difficulty'], string> = {
  Beginner: CX.cy,
  Intermediate: CX.pu,
  Advanced: CX.go,
}

const linkStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: CX.cy,
}

export default function Stacks() {
  return (
    <section id="stacks" data-mode="4" style={{ position: 'relative', zIndex: 2, padding: '12vh clamp(20px,5vw,60px)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div data-reveal style={{ textAlign: 'center', marginBottom: 44 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: CX.go,
              marginBottom: 18,
            }}
          >
            Protocol library · {STACKS.length} curated stacks
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(34px,5.4vw,72px)',
              lineHeight: 1.04,
            }}
          >
            Stacks, <span style={{ fontStyle: 'italic', color: CX.cy }}>assembled for a goal.</span>
          </h2>
          <p style={{ maxWidth: '56ch', margin: '22px auto 0', fontSize: 15, color: CX.dim, lineHeight: 1.9 }}>
            Every stack in the library, mapped to an outcome — with the compounds, difficulty and rationale drawn from
            the literature.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: 1,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {STACKS.map((s, i) => (
            <div
              key={s.name}
              data-reveal
              data-reveal-delay={String((i % 3) * 80)}
              style={{ background: '#050505', padding: '30px 26px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: CX.faint,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: DIFF_COLOR[s.difficulty],
                    border: `1px solid ${DIFF_COLOR[s.difficulty]}66`,
                    padding: '3px 8px',
                  }}
                >
                  {s.difficulty}
                </span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, lineHeight: 1.1, color: '#fff', marginBottom: 8 }}>
                {s.name}
              </div>
              <div style={{ fontSize: 12.5, color: CX.muted, lineHeight: 1.7, marginBottom: 18, flex: 1 }}>{s.goal}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.components.map((c) => (
                  <span
                    key={c.peptide}
                    style={{
                      fontFamily: MONO,
                      fontSize: 9.5,
                      padding: '5px 9px',
                      border: '1px solid rgba(0,229,255,0.3)',
                      color: CX.cy,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.peptide}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/stacks" style={linkStyle}>
            Open the library →
          </a>
        </div>
      </div>
    </section>
  )
}
