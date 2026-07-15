'use client'

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ALL_PEPTIDES } from '@/lib/peptides'
import { CX, prefersReducedMotion } from './_lib/tokens'
import { lookupVerdict, STACK_SCAN, type Verdict } from './_lib/samples'

// Ports `#check` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 146),
// logic `buildChecker()` ~line 458 / `showVerdict()` ~line 497 /
// `buildStackScan()` ~line 502.
//
// LABELED SAMPLE SURFACE — this is a public, logged-out demo. Verdicts are
// computed client-side from the fixture map in `_lib/samples.ts`. There is
// no `fetch` here and there must never be one; the real, authenticated
// checker lives at `/checker` and calls `/api/check-interaction`.

const MONO = "'JetBrains Mono', monospace"

// `key()` from the prototype: 'Semaglutide (Ozempic/Wegovy)' -> 'Semaglutide',
// 'Leptin / Metreleptin' -> 'Leptin'.
function key(raw: string): string {
  return raw.split(' (')[0].split(' / ')[0].trim()
}

const fieldLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: CX.faintest,
  marginBottom: 12,
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none',
  color: '#fff',
  fontSize: 13,
  padding: '12px 14px',
  fontFamily: 'inherit',
}

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  left: 'clamp(16px,3vw,34px)',
  right: 'clamp(16px,3vw,34px)',
  zIndex: 20,
  maxHeight: 210,
  overflowY: 'auto',
  background: CX.panel3,
  border: '1px solid rgba(0,229,255,0.25)',
}

const rowStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.02em',
  padding: '10px 14px',
  cursor: 'pointer',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'transparent',
  color: '#c9d3e0',
}

const ctaButtonStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#050505',
  background: CX.cy,
  border: 'none',
  padding: '13px 30px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const scanlineStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 2,
  background: `linear-gradient(90deg, transparent, ${CX.cy}, transparent)`,
  animation: 'v2scanline 1s ease-in-out',
}

interface CompoundFieldProps {
  label: string
  query: string
  open: boolean
  onQueryChange: (value: string) => void
  onOpen: () => void
  onClose: () => void
  onSelect: (compound: string) => void
}

function CompoundField({ label, query, open, onQueryChange, onOpen, onClose, onSelect }: CompoundFieldProps) {
  const q = query.toLowerCase()
  const hits = ALL_PEPTIDES.filter((c) => c.toLowerCase().includes(q)).slice(0, 40)
  const showList = open && hits.length > 0

  return (
    <div style={{ padding: '28px clamp(16px,3vw,34px)', position: 'relative' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <input
        type="text"
        value={query}
        placeholder={`Search ${ALL_PEPTIDES.length} compounds…`}
        onFocus={(e) => {
          e.currentTarget.select()
          onOpen()
        }}
        onChange={(e) => {
          onQueryChange(e.target.value)
          onOpen()
        }}
        onBlur={() => {
          // Delay so a mousedown selection on a dropdown row (below) can
          // register before the list unmounts.
          setTimeout(onClose, 150)
        }}
        style={inputStyle}
      />
      {showList && (
        <div style={dropdownStyle}>
          {hits.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(c)
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0,229,255,0.12)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              style={rowStyle}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VerdictBadge({ v }: { v: Verdict }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          border: `1px solid ${v.c}`,
          padding: '8px 15px',
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: '50%', background: v.c, boxShadow: `0 0 10px ${v.c}` }}
        />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: v.c }}>{v.sev}</span>
      </div>
      <p style={{ flex: 1, minWidth: 240, fontSize: 14, lineHeight: 1.85, color: '#c9d3e0', fontWeight: 300 }}>
        {v.t}
      </p>
    </div>
  )
}

export default function Checker() {
  // ─── Interaction checker state ─────────────────────────────────────────
  const [aQuery, setAQuery] = useState('BPC-157')
  const [bQuery, setBQuery] = useState('TB-500')
  const [aOpen, setAOpen] = useState(false)
  const [bOpen, setBOpen] = useState(false)
  const [selected, setSelected] = useState({ a: 'BPC-157', b: 'TB-500' })
  const [analyzing, setAnalyzing] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const analyzeTimeout = useRef<ReturnType<typeof setTimeout>>()

  const runAnalyze = useCallback((a: string, b: string) => {
    setAnalyzing(true)
    setVerdict(null)
    if (analyzeTimeout.current) clearTimeout(analyzeTimeout.current)
    const delay = prefersReducedMotion() ? 0 : 1050
    analyzeTimeout.current = setTimeout(() => {
      setAnalyzing(false)
      setVerdict(lookupVerdict(a, b))
    }, delay)
  }, [])

  // Run once automatically on mount, as the prototype does.
  useEffect(() => {
    runAnalyze(selected.a, selected.b)
    return () => {
      if (analyzeTimeout.current) clearTimeout(analyzeTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectA = (compound: string) => {
    const k = key(compound)
    setSelected((s) => ({ ...s, a: k }))
    setAQuery(k)
    setAOpen(false)
  }
  const selectB = (compound: string) => {
    const k = key(compound)
    setSelected((s) => ({ ...s, b: k }))
    setBQuery(k)
    setBOpen(false)
  }

  // ─── Full-stack scan state ──────────────────────────────────────────────
  const [stackScanning, setStackScanning] = useState(false)
  const [stackDone, setStackDone] = useState(false)
  const stackOutRef = useRef<HTMLDivElement>(null)
  const stackTimeout = useRef<ReturnType<typeof setTimeout>>()

  const runStackScan = useCallback(() => {
    setStackScanning(true)
    setStackDone(false)
    if (stackTimeout.current) clearTimeout(stackTimeout.current)
    const delay = prefersReducedMotion() ? 0 : 1050
    stackTimeout.current = setTimeout(() => {
      setStackScanning(false)
      setStackDone(true)
    }, delay)
  }, [])

  // Auto-run once the panel scrolls into view.
  useEffect(() => {
    const el = stackOutRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect()
          runStackScan()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [runStackScan])

  useEffect(() => {
    return () => {
      if (stackTimeout.current) clearTimeout(stackTimeout.current)
    }
  }, [])

  const { meds, peps, flags } = STACK_SCAN
  const flaggedEntries = Object.entries(flags)
  const totalPairs = meds.length * peps.length
  const flaggedCount = flaggedEntries.length
  const clearCount = totalPairs - flaggedCount

  return (
    <section id="check" data-mode="5" style={{ position: 'relative', zIndex: 2, padding: '12vh clamp(20px,5vw,60px)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div data-reveal style={{ textAlign: 'center', marginBottom: 44 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: CX.pu,
              marginBottom: 18,
            }}
          >
            Try it · interaction checker
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(34px,5vw,64px)',
              lineHeight: 1.05,
            }}
          >
            Check two compounds{' '}
            <span style={{ fontStyle: 'italic', color: CX.cy }}>before they meet.</span>
          </h2>
        </div>

        {/* Interaction checker card */}
        <div data-reveal style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,17,31,0.4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
            <CompoundField
              label="Compound A"
              query={aQuery}
              open={aOpen}
              onQueryChange={setAQuery}
              onOpen={() => setAOpen(true)}
              onClose={() => setAOpen(false)}
              onSelect={selectA}
            />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <CompoundField
              label="Compound B"
              query={bQuery}
              open={bOpen}
              onQueryChange={setBQuery}
              onOpen={() => setBOpen(true)}
              onClose={() => setBOpen(false)}
              onSelect={selectB}
            />
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '22px clamp(16px,3vw,34px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 11, color: CX.dim }}>
              <span style={{ color: '#fff' }}>{selected.a}</span> <span style={{ color: CX.cy }}>×</span>{' '}
              <span style={{ color: '#fff' }}>{selected.b}</span>
            </div>
            <button type="button" onClick={() => runAnalyze(selected.a, selected.b)} style={ctaButtonStyle}>
              Analyze →
            </button>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 130,
              padding: '30px clamp(16px,3vw,34px)',
            }}
          >
            {analyzing ? (
              <>
                <div aria-hidden style={{ ...scanlineStyle, top: 0 }} />
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: CX.cy }}>
                  ANALYZING {selected.a} × {selected.b} …
                </div>
              </>
            ) : (
              verdict && <VerdictBadge v={verdict} />
            )}
          </div>
        </div>

        {/* Full-stack scan sub-panel */}
        <div data-reveal style={{ marginTop: 24, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,17,31,0.4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '20px clamp(16px,3vw,34px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: CX.cy,
                  marginBottom: 6,
                }}
              >
                Full-stack scan
              </div>
              <div style={{ fontSize: 13, color: CX.dim }}>
                Your medications <span style={{ color: CX.faintest }}>×</span> Cortex&rsquo;s recommendations — every
                pair, flagged.
              </div>
            </div>
            <button
              type="button"
              onClick={runStackScan}
              style={{ ...ctaButtonStyle, padding: '13px 26px' }}
            >
              Scan all →
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 28,
              padding: '18px clamp(16px,3vw,34px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: CX.faintest,
                  marginBottom: 10,
                }}
              >
                Your meds
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {meds.map((m) => (
                  <span
                    key={m}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: '7px 11px',
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: '#cdd6e2',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: CX.faintest,
                  marginBottom: 10,
                }}
              >
                Cortex recommends
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {peps.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: '7px 11px',
                      border: '1px solid rgba(0,229,255,0.4)',
                      color: CX.cy,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={stackOutRef}
            style={{ padding: '22px clamp(16px,3vw,34px)', minHeight: 130, position: 'relative', overflow: 'hidden' }}
          >
            {stackScanning ? (
              <>
                <div aria-hidden style={{ ...scanlineStyle, top: 0 }} />
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: CX.cy }}>
                  CROSS-CHECKING STACK × RECOMMENDATIONS …
                </div>
              </>
            ) : (
              stackDone && (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: CX.muted, marginBottom: 16 }}>
                    Scanned {totalPairs} pairs · <span style={{ color: CX.go }}>{flaggedCount} to monitor</span> ·{' '}
                    {clearCount} clear
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `110px repeat(${meds.length}, 1fr)`,
                      gap: 1,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ background: CX.panel2 }} />
                    {meds.map((m) => (
                      <div
                        key={m}
                        style={{
                          background: CX.panel2,
                          padding: '11px 8px',
                          textAlign: 'center',
                          fontFamily: MONO,
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          color: CX.muted,
                        }}
                      >
                        {m}
                      </div>
                    ))}
                    {peps.map((p) => (
                      <Fragment key={p}>
                        <div
                          style={{
                            background: CX.panel2,
                            padding: '11px 10px',
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 17,
                            color: CX.cy,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {p}
                        </div>
                        {meds.map((m) => {
                          const flag = flags[`${p}|${m}`]
                          const c = flag ? flag[1] : '#2a7d8a'
                          const s = flag ? flag[0] : 'CLEAR'
                          return (
                            <div
                              key={`${p}|${m}`}
                              style={{
                                padding: '11px 10px',
                                background: CX.panel2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                              }}
                            >
                              <span
                                aria-hidden
                                style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }}
                              />
                              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.12em', color: c }}>
                                {s}
                              </span>
                            </div>
                          )
                        })}
                      </Fragment>
                    ))}
                  </div>

                  {flaggedEntries.map(([pairKey, [sev, c, note]]) => (
                    <div key={pairKey} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12 }}>
                      <span
                        style={{ fontFamily: MONO, fontSize: 9, color: c, border: `1px solid ${c}`, padding: '3px 8px', flexShrink: 0 }}
                      >
                        {sev}
                      </span>
                      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: CX.muted }}>
                        <span style={{ color: '#cdd6e2' }}>{pairKey.replace('|', ' × ')}</span> — {note}
                      </div>
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a
            href="/checker"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: CX.cy,
            }}
          >
            Run the full checker →
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
          Educational reference only. Not medical advice. Verify against primary literature and a licensed physician.
        </div>
      </div>
    </section>
  )
}
