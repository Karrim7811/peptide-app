'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CX } from './_lib/tokens'

// Ports `#cta` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 263).
//
// `data-mode="5"`. Radial cyan glow behind the content. Same email-capture
// handler as `Hero.tsx`: submitting routes to `/signup?email=...` instead of
// the prototype's inline "you're on the waitlist" swap, so the real signup
// flow (age gate, auth) takes over. Copy is verbatim from the prototype.
export default function FinalCta() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/signup?email=' + encodeURIComponent(email))
  }

  return (
    <section
      id="cta"
      data-mode="5"
      style={{
        position: 'relative',
        zIndex: 2,
        padding: '16vh clamp(20px,5vw,60px)',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(720px, 110vw)',
          aspectRatio: '1',
          background: 'radial-gradient(circle, rgba(0,229,255,0.14), transparent 66%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 820, margin: '0 auto' }}>
        <div
          data-reveal
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: CX.cy,
            marginBottom: 26,
          }}
        >
          Access is limited
        </div>

        <h2
          data-reveal
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 200,
            fontSize: 'clamp(42px,8vw,100px)',
            lineHeight: 1,
          }}
        >
          Enter the{' '}
          <span
            style={{
              background: `linear-gradient(100deg, ${CX.cy}, ${CX.pu})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            intelligence layer.
          </span>
        </h2>

        <form
          onSubmit={handleSubmit}
          data-reveal
          style={{ margin: '40px auto 0', width: 'min(460px, 92vw)' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              border: '1px solid rgba(0,229,255,0.3)',
              background: 'rgba(0,229,255,0.04)',
              padding: '7px 7px 7px 18px',
            }}
          >
            <input
              type="email"
              required
              placeholder="you@lab.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
                letterSpacing: '0.05em',
              }}
            />
            <button
              type="submit"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#050505',
                background: CX.cy,
                border: 'none',
                padding: '13px 24px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Request Access
            </button>
          </div>
        </form>

        <p
          data-reveal
          style={{
            marginTop: 20,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            color: CX.faintest,
          }}
        >
          Adults 18+ · Educational &amp; research use only · Not medical advice
        </p>
      </div>
    </section>
  )
}
