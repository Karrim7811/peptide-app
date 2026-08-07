'use client'

import { useEffect, useState } from 'react'
import { CX, prefersReducedMotion } from './_lib/tokens'
import { PAPER_FEED } from './_lib/samples'

// Ports `#s2` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 88,
// cycle logic in `buildPaperFeed()` ~line 377).
//
// `data-mode="1"` feeds `useSceneMode` (cyan formation). The paper feed is a
// window of 5 rows that auto-advances through `PAPER_FEED` every 900ms, with
// the row nearest the window center fully opaque and rows further away
// dimmed — same falloff math as the prototype
// (`1 - Math.abs(i - (k + 2)) * 0.22`). Honors `prefers-reduced-motion`: the
// list renders once, statically dimmed to 0.7 opacity, no interval.
export default function Corpus() {
  const [reduce, setReduce] = useState(false)
  const [k, setK] = useState(0)
  const rowCount = PAPER_FEED.length

  useEffect(() => {
    const reduced = prefersReducedMotion()
    setReduce(reduced)
    if (reduced) return

    const id = setInterval(() => {
      setK((prev) => (prev + 1) % rowCount)
    }, 900)
    return () => clearInterval(id)
  }, [rowCount])

  return (
    <section
      id="s2"
      data-mode="1"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '120px clamp(20px,5vw,60px)',
      }}
    >
      <div
        data-reveal
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          color: CX.cy,
          marginBottom: 26,
        }}
      >
        01 · The corpus
      </div>

      <div
        data-reveal
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 200,
          fontSize: 'clamp(48px,10vw,150px)',
          lineHeight: 0.92,
          background: 'linear-gradient(180deg, #fff, #5a6b82)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Structured
        <br />
        <span style={{ fontStyle: 'normal', color: CX.cy, WebkitTextFillColor: CX.cy }}>
          literature.
        </span>
      </div>

      <div
        data-reveal
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: CX.dim,
          marginTop: 24,
        }}
      >
        Peer-reviewed research · sourced to primary references
      </div>

      <div
        data-reveal
        style={{
          marginTop: 56,
          width: 'min(760px, 92vw)',
          height: 120,
          overflow: 'hidden',
          position: 'relative',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
        }}
      >
        {PAPER_FEED.map((title, i) => {
          const opacity = reduce
            ? 0.7
            : i >= k && i < k + 5
              ? 1 - Math.abs(i - (k + 2)) * 0.22
              : 0
          return (
            <div
              key={title}
              style={{
                opacity,
                transition: reduce ? undefined : 'opacity .5s',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.02em',
                color: '#8a97ac',
                padding: '5px 0',
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span style={{ color: CX.cy, fontSize: 9 }}>&#9671;</span>
              <span>{title}</span>
              <span style={{ color: '#2f3a4c', fontSize: 9 }}>· peer-reviewed</span>
            </div>
          )
        })}
      </div>

      <p
        data-reveal
        style={{
          marginTop: 44,
          fontSize: 15,
          color: '#6b7688',
          maxWidth: '46ch',
          lineHeight: 1.9,
        }}
      >
        Structured, sourced and queryable — every claim traceable back to a primary reference, not a hallucination.
      </p>
    </section>
  )
}
