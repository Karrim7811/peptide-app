'use client'

import { useEffect, useState } from 'react'
import { CX, modeColor } from './_lib/tokens'

// Ports the `<nav>` markup + `setupNav()` behavior from the V4 design
// prototype (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`,
// ~line 40 / ~line 339).
//
// Fixed 66px bar. Transparent by default; past `scrollY > 30` it gains a
// translucent dark background, a blur, and a cyan hairline border. The left
// status dot's color follows the active scene `mode` (via `modeColor`).

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#s3' },
  { label: 'Checker', href: '#check' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Nav({ mode }: { mode: number }) {
  const [scrolled, setScrolled] = useState(false)
  const [ctaHover, setCtaHover] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dotColor = modeColor(mode)

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(20px,4vw,52px)',
        height: 66,
        background: scrolled ? 'rgba(5,5,5,0.72)' : 'rgba(5,5,5,0)',
        backdropFilter: scrolled ? 'blur(14px)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'blur(0px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,229,255,0.14)' : 'rgba(0,229,255,0)'}`,
        transition: 'background .4s, backdrop-filter .4s, border-color .4s',
      }}
    >
      <a href="#s1" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          aria-hidden
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 12px ${dotColor}`,
            transition: 'background .3s, box-shadow .3s',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.34em',
            color: '#fff',
          }}
        >
          PEPTIDE CORTEX
        </span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,32px)' }}>
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9.5px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: CX.dim,
              whiteSpace: 'nowrap',
            }}
          >
            {l.label}
          </a>
        ))}
      </div>

      <a
        href="#cta"
        onMouseEnter={() => setCtaHover(true)}
        onMouseLeave={() => setCtaHover(false)}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9.5px',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#050505',
          background: CX.cy,
          padding: '11px 22px',
          whiteSpace: 'nowrap',
          transition: 'box-shadow .3s',
          boxShadow: ctaHover ? '0 0 24px rgba(0,229,255,0.6)' : 'none',
        }}
      >
        Request Access
      </a>
    </nav>
  )
}
