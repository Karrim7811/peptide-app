// Shared chrome for every shop page.
//
// The shop sits outside the signed-in app shell deliberately. The reference and
// AI side is framed as educational material and this is commerce; regulators
// read intended use from how a seller presents its own content, so the two
// reading as structurally different things is a legal posture rather than a
// visual preference. Same brand, same account, different chrome.

import Link from 'next/link'
import { CartCount } from '@/components/shop/CartCount'

export const LEGAL =
  'For research and reference purposes only. Not intended as dosing instructions for human or animal use, and not for human consumption. Consult a licensed physician before any medical decisions. Adults 18+. US shipping only.'

export const MONO = "'JetBrains Mono', monospace"
export const RULE = '1px solid #1A1D1F'
export const HAIR = '1px solid rgba(26,29,31,.18)'

export const KICKER: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: 10.5,
  letterSpacing: '.24em',
  textTransform: 'uppercase',
  color: '#7E878E',
}

export function ShopChrome({
  children,
  showCart = true,
}: {
  children: React.ReactNode
  showCart?: boolean
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        color: '#1A1D1F',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      <header style={{ borderBottom: RULE, flex: 'none' }}>
        <div
          style={{
            padding: '14px clamp(16px,3vw,32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(14px,2vw,28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              color: 'inherit',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A8A9E' }}
            />
            <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.22em' }}>
              PEPTIDE CORTEX
            </span>
          </Link>
          <span style={{ marginLeft: 'auto' }} />
          <Link href="/shop" style={{ ...KICKER, color: '#1A1D1F', textDecoration: 'none' }}>
            Shop
          </Link>
          {showCart && <CartCount />}
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{ background: '#1A1D1F', color: '#C9CED2', flex: 'none' }}>
        <div
          style={{
            padding: '18px clamp(16px,3vw,32px)',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            fontFamily: 'Jost, sans-serif',
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ maxWidth: '68ch', lineHeight: 1.8 }}>{LEGAL}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
            <Link href="/refund-policy" style={{ color: 'inherit' }}>Refunds</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
