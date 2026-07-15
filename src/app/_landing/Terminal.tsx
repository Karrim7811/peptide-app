'use client'

import type { CSSProperties } from 'react'
import { CX } from './_lib/tokens'
import { TERMINAL_SAMPLE } from './_lib/samples'

// Ports `#s5` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 128,
// grid build logic in `buildTerminal()` ~line 416).
//
// `data-mode="5"` feeds `useSceneMode` (quiet/neutral formation). A 3-column
// hairline grid built from `TERMINAL_SAMPLE`: evidence score bars (`v2bar`
// keyframe fills each bar on mount, same as the prototype's inline
// animation), a mechanism chip cloud + notes, and a reference summary with
// a big "HIGH" literature-support score. The header has a `v2scan` sweep
// and an "ILLUSTRATIVE · SAMPLE" badge — this is sample output, not a live
// query result.
const colTitleStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#4a5568',
  marginBottom: 18,
}

const colStyle: CSSProperties = {
  background: '#070a10',
  padding: '22px 20px',
  minHeight: 230,
}

export default function Terminal() {
  return (
    <section
      id="s5"
      data-mode="5"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '14vh clamp(20px,5vw,60px) 12vh',
      }}
    >
      <div data-reveal style={{ textAlign: 'center', marginBottom: 52 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: CX.cy,
            marginBottom: 20,
          }}
        >
          05 · The terminal · sample output
        </div>
        <h2
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 200,
            fontSize: 'clamp(34px,5vw,64px)',
            lineHeight: 1.05,
          }}
        >
          A reference cockpit for your research.
        </h2>
      </div>

      <div
        data-reveal
        style={{
          width: 'min(1180px, 96vw)',
          margin: '0 auto',
          border: '1px solid rgba(0,229,255,0.16)',
          background: 'linear-gradient(180deg, rgba(9,17,31,0.9), rgba(5,5,5,0.94))',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(0,229,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 22,
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.12), transparent)',
            animation: 'v2scan 6s linear infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              aria-hidden
              style={{ width: 8, height: 8, borderRadius: '50%', background: CX.go }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                color: '#fff',
              }}
            >
              CORTEX://reference-terminal
            </span>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.18em',
              color: '#4a5568',
            }}
          >
            ILLUSTRATIVE · <span style={{ color: CX.cy }}>SAMPLE</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr 1fr',
            gap: 1,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {/* Evidence · literature depth */}
          <div style={colStyle}>
            <div style={colTitleStyle}>Evidence · literature depth</div>
            {TERMINAL_SAMPLE.evidence.map((row) => (
              <div key={row.name} style={{ marginBottom: 15 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: '#cdd6e2' }}>{row.name}</span>
                  <span style={{ color: row.color }}>{row.label}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${row.level * 100}%`,
                      background: row.color,
                      transformOrigin: 'left',
                      animation: 'v2bar 1.2s cubic-bezier(.2,.7,.2,1) both',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mechanism map */}
          <div style={colStyle}>
            <div style={colTitleStyle}>Mechanism map</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TERMINAL_SAMPLE.mechanismChips.map((chip, i) => (
                <span
                  key={`${chip.label}-${i}`}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    padding: '6px 10px',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${chip.color}55`,
                    color: chip.color,
                  }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                lineHeight: 1.9,
                color: '#6b7688',
              }}
            >
              {TERMINAL_SAMPLE.mechanismNotes.map((note) => (
                <div key={note}>&#8627; {note}</div>
              ))}
            </div>
          </div>

          {/* Reference summary */}
          <div style={colStyle}>
            <div style={colTitleStyle}>Reference summary</div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#6b7688',
                lineHeight: 1.9,
                marginBottom: 16,
              }}
            >
              {TERMINAL_SAMPLE.referenceTheme}
            </div>
            {TERMINAL_SAMPLE.referenceLines.map((line) => (
              <div
                key={line}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#cdd6e2',
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {line}
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 200,
                  fontSize: 46,
                  color: CX.cy,
                  lineHeight: 1,
                }}
              >
                {TERMINAL_SAMPLE.referenceScore}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: '#4a5568',
                }}
              >
                {TERMINAL_SAMPLE.referenceScoreLabel.map((line, i) => (
                  <span key={line}>
                    {line}
                    {i < TERMINAL_SAMPLE.referenceScoreLabel.length - 1 && <br />}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p
        data-reveal
        style={{
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.14em',
          color: '#3f4a5c',
          marginTop: 22,
          lineHeight: 1.7,
        }}
      >
        Sample interface. Evidence and confidence figures are illustrative, not clinical guidance.
      </p>
    </section>
  )
}
