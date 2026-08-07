'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CX } from './_lib/tokens'

// Ports `#s1` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 55).
//
// `data-mode="0"` feeds `useSceneMode` in the page shell. Entrance uses the
// `v2rise` keyframe (defined in `globals.css`) staggered per element, same
// delays as the prototype. The waitlist form is a real navigation instead of
// the prototype's inline "you're on the waitlist" swap: submitting routes to
// `/signup?email=...` so the actual signup flow (age gate, auth) takes over.
export default function Hero() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/signup?email=' + encodeURIComponent(email))
  }

  return (
    <section
      id="s1"
      data-mode="0"
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '120px clamp(20px,5vw,60px) 90px',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: CX.cy,
          marginBottom: 34,
          opacity: 0,
          animation: 'v2rise 1s .3s forwards',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: CX.cy,
            animation: 'v2pulse 2.4s infinite',
          }}
        />
        The Intelligence Layer for Peptide Research
      </div>

      <h1
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 200,
          fontSize: 'clamp(46px,9vw,124px)',
          letterSpacing: '0.02em',
          lineHeight: 0.98,
          opacity: 0,
          animation: 'v2rise 1.1s .5s forwards',
        }}
      >
        PROTOCOL
        <br />
        <span
          style={{
            background: `linear-gradient(100deg, ${CX.cy}, ${CX.pu})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 300,
          }}
        >
          INTELLIGENCE
        </span>
      </h1>

      <p
        style={{
          fontSize: 'clamp(14px,1.4vw,18px)',
          fontWeight: 300,
          color: CX.dim,
          marginTop: 32,
          maxWidth: '54ch',
          lineHeight: 1.9,
          opacity: 0,
          animation: 'v2rise 1s .75s forwards',
        }}
      >
        A reasoning layer for peptide research — it reads the literature, maps the mechanisms, and organizes it into a structured reference. Built for researchers, not patients.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 42,
          width: 'min(460px, 92vw)',
          opacity: 0,
          animation: 'v2rise 1s .95s forwards',
        }}
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
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            color: CX.faintest,
            marginTop: 14,
          }}
        >
          Adults 18+ · Educational &amp; research use only · Not medical advice
        </div>
      </form>
    </section>
  )
}
