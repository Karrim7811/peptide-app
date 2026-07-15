'use client'

import { useState } from 'react'
import { CX } from './_lib/tokens'
import type { ProPlan } from '@/lib/stripe'

// Ports `#pricing` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 253).
//
// `data-mode="5"`. Three cards, no monthly/yearly toggle (that split was
// retired per CLAUDE.md §16.4 — two SKUs only: Pro Monthly $9.99 and Pro
// Lifetime $99.99). Copy is verbatim from the prototype.
//
// CHECKOUT WIRING: replicates `src/app/pricing/page.tsx`'s `handleUpgrade`
// exactly — POST /api/stripe/create-checkout with `{ plan }`, redirect to
// `data.url` on success. That route's `Unauthorized` response is what a
// logged-out visitor gets; the real `/pricing` page sends those visitors to
// `/login?next=/pricing`, but this landing page is a pre-signup funnel, so
// per the task brief it sends logged-out visitors to `/signup` instead (a
// signup, not a login, is the correct next step for someone who has never
// had an account). Free's "Start Free" always goes to `/signup`.

const MONO = "'JetBrains Mono', monospace"

const ctaBase = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  padding: 14,
  marginTop: 24,
  border: 'none',
  cursor: 'pointer',
  width: '100%',
}

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<ProPlan | null>(null)

  async function handleUpgrade(plan: ProPlan) {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        window.location.href = '/signup'
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" data-mode="5" style={{ position: 'relative', zIndex: 2, padding: '10vh clamp(20px,5vw,60px)' }}>
      <div data-reveal style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center', marginBottom: 44 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: CX.cy,
          }}
        >
          Pricing
        </div>
        <h2
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 200,
            fontSize: 'clamp(30px,4.5vw,58px)',
            marginTop: 14,
          }}
        >
          Start free. Upgrade when it earns it.
        </h2>
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Free */}
        <div data-reveal style={{ background: '#050505', padding: '40px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: CX.dim, marginBottom: 18 }}>
            Free
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 56, lineHeight: 1 }}>$0</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: CX.faintest, margin: '10px 0 28px' }}>forever</div>
          <div style={{ fontSize: 13, color: CX.dim, lineHeight: 2, flex: 1 }}>
            Full reference library
            <br />
            Stack &amp; dose log
            <br />
            3 interaction checks/day
          </div>
          <a
            href="/signup"
            style={{
              ...ctaBase,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            Start Free
          </a>
        </div>

        {/* Pro */}
        <div
          data-reveal
          data-reveal-delay={90}
          style={{
            background: 'linear-gradient(180deg, rgba(0,229,255,0.06), #050505)',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `1px solid ${CX.cy}`,
            borderRight: `1px solid ${CX.cy}`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: CX.cy, marginBottom: 18 }}>
            Pro
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 56, lineHeight: 1 }}>
            $9.99<span style={{ fontSize: 16, color: CX.faintest }}>/mo</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: CX.faintest, margin: '10px 0 28px' }}>cancel anytime</div>
          <div style={{ fontSize: 13, color: CX.dim, lineHeight: 2, flex: 1 }}>
            Everything in Free
            <br />
            Unlimited AI reasoning
            <br />
            Bloodwork &amp; protocol tools
            <br />
            Unlimited checks
          </div>
          <button
            type="button"
            onClick={() => handleUpgrade('monthly')}
            disabled={loadingPlan !== null}
            style={{
              ...ctaBase,
              color: '#050505',
              background: CX.cy,
              opacity: loadingPlan !== null ? 0.7 : 1,
            }}
          >
            {loadingPlan === 'monthly' ? 'Processing…' : 'Start Pro'}
          </button>
        </div>

        {/* Lifetime */}
        <div data-reveal data-reveal-delay={180} style={{ background: '#050505', padding: '40px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: CX.go, marginBottom: 18 }}>
            Lifetime
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 56, lineHeight: 1 }}>$99.99</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: CX.faintest, margin: '10px 0 28px' }}>one time</div>
          <div style={{ fontSize: 13, color: CX.dim, lineHeight: 2, flex: 1 }}>
            Everything in Pro
            <br />
            No recurring charge
            <br />
            Locked-in pricing
            <br />
            Early access
          </div>
          <button
            type="button"
            onClick={() => handleUpgrade('lifetime')}
            disabled={loadingPlan !== null}
            style={{
              ...ctaBase,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              opacity: loadingPlan !== null ? 0.7 : 1,
            }}
          >
            {loadingPlan === 'lifetime' ? 'Processing…' : 'Get Lifetime'}
          </button>
        </div>
      </div>
    </section>
  )
}
