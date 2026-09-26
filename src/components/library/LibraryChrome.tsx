// Chrome for the free library — and, since the V3 rebuild, for the bench and
// its tools (/dashboard, /checker, /bloodwork, /protocol, /scanner) too.
//
// The library is readable signed out, so this header cannot assume a session.
// The menu is the site's one primary menu (Bench · Library · Shop, see
// src/lib/nav.ts); the section label and the underlined link follow the URL,
// so the bench reads "The bench" even though it borrows this chrome. A visitor
// also gets "Sign in"; nothing about the content changes, because nothing
// about the content is gated.

import Link from 'next/link'
import { PrimaryNav, SectionLabel } from '@/components/nav/PrimaryNav'

export const INK = '#1A1D1F'
export const INK2 = '#3B4045'
export const INK3 = '#7E878E'
export const TEAL = '#1A8A9E'
export const RULE = '1px solid #1A1D1F'
export const HAIR = '1px solid rgba(26,29,31,.18)'
export const JOST = 'Jost, sans-serif'
export const MONO = "'JetBrains Mono', monospace"

export const KICKER: React.CSSProperties = {
  fontFamily: JOST,
  fontSize: 10.5,
  letterSpacing: '.26em',
  textTransform: 'uppercase',
  color: INK3,
}

export function LibraryChrome({
  children,
  signedIn,
}: {
  children: React.ReactNode
  signedIn: boolean
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        color: INK,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      <header style={{ borderBottom: RULE, flex: 'none' }}>
        {/* Phones: the 44px links carry the height, so the band's own
            vertical padding shrinks to keep the header from doubling. */}
        <div
          className="py-1.5 md:py-[14px]"
          style={{
            paddingInline: 'clamp(16px,3vw,32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px,2vw,28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            className="min-h-[44px] md:min-h-0"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              whiteSpace: 'nowrap',
              color: INK,
              textDecoration: 'none',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL }} />
            <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.22em' }}>
              PEPTIDE CORTEX
            </span>
            <SectionLabel />
          </Link>
          <PrimaryNav signedIn={signedIn} />
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          background: INK,
          color: '#C9CED2',
          flex: 'none',
          padding: '14px clamp(16px,3vw,32px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 24px',
          justifyContent: 'space-between',
          fontFamily: JOST,
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}
      >
        <span style={{ maxWidth: '80ch' }}>
          For research and reference purposes only. Not intended as dosing instructions for
          human or animal use, and not for human consumption. Consult a licensed physician
          before any medical decisions. Adults 18+.
        </span>
        <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#C9CED2', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: '#C9CED2', textDecoration: 'none' }}>
            Privacy
          </Link>
        </span>
      </footer>
    </div>
  )
}
