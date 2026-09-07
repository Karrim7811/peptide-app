// Chrome for the free library.
//
// The library is readable signed out, so this header cannot assume a session.
// It shows "Sign in" to a visitor and "The bench" to someone who has one, and
// that is the only difference — nothing about the content changes, because
// nothing about the content is gated.

import Link from 'next/link'

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
        <div
          style={{
            padding: '14px clamp(16px,3vw,32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px,2vw,28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
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
            <span style={{ ...KICKER, marginLeft: 6 }}>The library</span>
          </Link>
          <nav
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px,2vw,24px)',
              flexWrap: 'wrap',
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
            }}
          >
            <Link
              href="/reference"
              style={{ color: INK, textDecoration: 'none', borderBottom: RULE }}
            >
              Library
            </Link>
            <Link href="/shop" style={{ color: INK3, textDecoration: 'none' }}>
              Shop ↗
            </Link>
            <Link
              href={signedIn ? '/dashboard' : '/login'}
              style={{ color: INK, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              {signedIn ? 'The bench' : 'Sign in'}
            </Link>
          </nav>
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
