'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CX, prefersReducedMotion } from './_lib/tokens'
import { BLOOD_MARKERS, BLOOD_RECS } from './_lib/samples'

// Ports `#blood` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 191,
// logic in `buildBlood()` ~line 573).
//
// LABELED SAMPLE SURFACE — this is a public, logged-out demo. Markers and
// recommendations are fixture data from `_lib/samples.ts`. There is no
// `fetch` here and there must never be one; the real, authenticated
// bloodwork analyzer lives at `/bloodwork` and calls `/api/bloodwork-analyze`
// + `/api/bloodwork-ocr`.

const MONO = "'JetBrains Mono', monospace"

const scanlineStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 2,
  background: `linear-gradient(90deg, transparent, ${CX.cy}, transparent)`,
  animation: 'v2scanline 1.15s ease-in-out',
}

const linkStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: CX.cy,
}

type Phase = 'idle' | 'scanning' | 'done'

export default function Bloodwork() {
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [reduced, setReduced] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Read the real prefers-reduced-motion value only after mount, so the
  // server render and the first client render agree (both `false`). See
  // CLAUDE.md / task-9: calling prefersReducedMotion() during render caused
  // a hydration mismatch because it's `false` on the server (no `window`)
  // but may be `true` on a client with the OS setting enabled.
  useEffect(() => {
    setReduced(prefersReducedMotion())
  }, [])

  const run = useCallback(() => {
    setStarted(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (reduced) {
      setPhase('done')
      return
    }
    setPhase('scanning')
    timeoutRef.current = setTimeout(() => setPhase('done'), 1150)
  }, [reduced])

  // Auto-run once the panel scrolls into view.
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect()
          run()
        }
      },
      { threshold: 0.45 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [run])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <section id="blood" data-mode="5" style={{ position: 'relative', zIndex: 2, padding: '12vh clamp(20px,5vw,60px)' }}>
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
            06 · Bloodwork analyzer
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(34px,5.4vw,72px)',
              lineHeight: 1.04,
            }}
          >
            Hand Cortex your labs.
            <br />
            Get the <span style={{ fontStyle: 'italic', color: CX.cy }}>whole picture.</span>
          </h2>
          <p style={{ maxWidth: '56ch', margin: '22px auto 0', fontSize: 15, color: CX.dim, lineHeight: 1.9 }}>
            Drop a Labcorp or Quest PDF. Cortex parses every marker, flags what&rsquo;s out of range, and surfaces the
            peptides most studied in relation to those biomarkers — with sources, not prescriptions.
          </p>
        </div>

        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* LEFT: panel + markers */}
          <div style={{ background: 'rgba(9,17,31,0.5)', padding: '26px clamp(16px,2.6vw,30px)' }}>
            <div
              style={{
                border: '1px dashed rgba(0,229,255,0.35)',
                background: 'rgba(0,229,255,0.03)',
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, color: CX.cy }}>⬗</span>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', letterSpacing: '0.06em' }}>
                    bloodpanel_2026.pdf
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: CX.faintest, letterSpacing: '0.1em' }}>
                    Labcorp · 14 markers detected
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={run}
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#050505',
                  background: CX.cy,
                  border: 'none',
                  padding: '12px 22px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Analyze →
              </button>
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: CX.faintest,
                marginBottom: 16,
              }}
            >
              Parsed markers
            </div>

            {BLOOD_MARKERS.map(([name, value, status, level, color]) => (
              <div key={name} style={{ marginBottom: 13 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    fontFamily: MONO,
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: '#cdd6e2' }}>{name}</span>
                  <span style={{ color: '#fff' }}>{value}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: started ? `${level * 100}%` : '0%',
                      background: color,
                      transition: reduced ? 'none' : 'width 1s cubic-bezier(.2,.7,.2,1)',
                    }}
                  />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.18em', color, marginTop: 4 }}>
                  {status}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: analysis */}
          <div style={{ background: '#070a10', padding: '26px clamp(16px,2.6vw,30px)', position: 'relative', overflow: 'hidden', minHeight: 340 }}>
            {phase === 'idle' && (
              <>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: CX.faintest,
                    marginBottom: 16,
                  }}
                >
                  Cortex reference · awaiting run
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 260,
                    color: '#3f4a5c',
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    lineHeight: 1.9,
                  }}
                >
                  Press Analyze to read
                  <br />
                  your panel →
                </div>
              </>
            )}

            {phase === 'scanning' && (
              <>
                <div aria-hidden style={scanlineStyle} />
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: CX.cy }}>
                  READING PANEL · CROSS-REFERENCING LITERATURE …
                </div>
              </>
            )}

            {phase === 'done' && (
              <>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: CX.cy,
                    marginBottom: 16,
                  }}
                >
                  Cortex reference · educational
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.85, color: '#c9d3e0', marginBottom: 22 }}>
                  Four markers fall outside optimal reference ranges — inflammatory (hs-CRP), metabolic (HbA1c, ApoB)
                  and GH-axis (IGF-1, testosterone). Peptides most studied in relation to each are grouped below.
                </p>
                {BLOOD_RECS.map(([group, peptides, note], i) => (
                  <div
                    key={group}
                    style={{
                      animation: `v2rise .6s cubic-bezier(.2,.7,.2,1) ${i * 140}ms both`,
                      borderLeft: `2px solid ${CX.cy}`,
                      padding: '10px 0 10px 16px',
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: CX.faint,
                        marginBottom: 6,
                      }}
                    >
                      {group}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, color: CX.cy, lineHeight: 1.1, marginBottom: 5 }}>
                      {peptides}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: CX.muted }}>{note}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/bloodwork" style={linkStyle}>
            Open the analyzer →
          </a>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: CX.faintest,
            marginTop: 14,
            lineHeight: 1.7,
          }}
        >
          Educational reference only. Cortex describes peptides studied in relation to your markers — it does not
          diagnose, treat, or prescribe. Review all bloodwork with a licensed physician.
        </div>
      </div>
    </section>
  )
}
