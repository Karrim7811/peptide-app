'use client'

import { useEffect, useRef, useState } from 'react'
import { CX, prefersReducedMotion } from './_lib/tokens'
import { PIPELINE_STAGES } from './_lib/samples'

// Ports `#s4` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 120,
// pipeline build/glow-in logic in `buildPipe()` ~line 394).
//
// `data-mode="4"` feeds `useSceneMode` (gold formation). Stages render from
// `PIPELINE_STAGES` at 0.25 opacity; once the pipeline scrolls into view
// (IntersectionObserver, threshold 0.4, fires once) each stage glows in with
// a 420ms stagger. Connector lines gradient cyan -> purple -> gold, one per
// adjacent stage pair using each stage's own color. Honors
// `prefers-reduced-motion`: all stages light immediately, no stagger.
export default function Synthesis() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [litCount, setLitCount] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const reduce = prefersReducedMotion()
    if (reduce) {
      setLitCount(PIPELINE_STAGES.length)
      return
    }

    const timeouts: ReturnType<typeof setTimeout>[] = []
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (!e.isIntersecting) return
          io.unobserve(e.target)
          PIPELINE_STAGES.forEach((_, i) => {
            timeouts.push(
              setTimeout(() => {
                setLitCount((prev) => Math.max(prev, i + 1))
              }, i * 420)
            )
          })
        })
      },
      { threshold: 0.4 }
    )
    io.observe(wrap)

    return () => {
      io.disconnect()
      timeouts.forEach((t) => clearTimeout(t))
    }
  }, [])

  return (
    <section
      id="s4"
      data-mode="4"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '110vh',
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
          color: CX.go,
          marginBottom: 24,
        }}
      >
        04 · Synthesis
      </div>

      <h2
        data-reveal
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 200,
          fontSize: 'clamp(40px,7vw,96px)',
          lineHeight: 1,
        }}
      >
        Watch Cortex{' '}
        <span
          style={{
            fontStyle: 'italic',
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            color: CX.go,
          }}
        >
          reason.
        </span>
      </h2>

      <div
        data-reveal
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}
      >
        <div
          ref={wrapRef}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 'min(360px, 86vw)' }}
        >
          {PIPELINE_STAGES.map(([label, sub, color], i) => {
            const lit = i < litCount
            return (
              <div key={label}>
                <div
                  style={{
                    border: `1px solid ${color}44`,
                    background: `${color}0f`,
                    padding: '16px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    opacity: lit ? 1 : 0.25,
                    boxShadow: lit ? `0 0 24px ${color}44` : 'none',
                    transition: 'all .5s',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      letterSpacing: '0.22em',
                      color,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: '#8a97ac',
                    }}
                  >
                    {sub}
                  </span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div
                    aria-hidden
                    style={{
                      width: 1,
                      height: 22,
                      background: `linear-gradient(${color}, ${PIPELINE_STAGES[i + 1][2]})`,
                      margin: '0 auto',
                      opacity: 0.5,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
