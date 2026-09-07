// The legal pages.
//
// One layout, four documents. Terms, Privacy and Refunds share a tab column;
// the EU notice hides both the tabs and the header nav, because /eu is what the
// edge block serves and every link on it would lead somewhere the visitor
// cannot go.
//
// Copy is the V3 design handoff's, approved by Karim on 2026-09-06. It replaces
// wording that predated the shop and therefore described neither orders, nor
// refunds, nor either payment rail.
//
// Structure is a definition list rendered as a grid, not prose with headings.
// Legal text is read by search — someone arrives wanting to know one thing —
// and a labelled row is findable in a way a paragraph is not.

import Link from 'next/link'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = `1px solid ${INK}`
const JOST = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', monospace"

export const LEGAL_FOOTER =
  'For research and reference purposes only. Not intended as dosing instructions for human or animal use, and not for human consumption. Consult a licensed physician before any medical decisions. Adults 18+. US shipping only.'

export type LegalKey = 'terms' | 'privacy' | 'refund'

const TABS: Array<[LegalKey, string, string]> = [
  ['terms', 'Terms', '/terms'],
  ['privacy', 'Privacy', '/privacy'],
  ['refund', 'Refunds', '/refund-policy'],
]

export function LegalPage({
  current,
  kicker,
  title,
  meta,
  lede,
  sections,
  children,
}: {
  /** Null on the EU notice, which has no siblings to tab between. */
  current: LegalKey | null
  kicker: string
  title: string
  meta: string
  lede: string
  sections: Array<[string, string]>
  children?: React.ReactNode
}) {
  const isEu = current === null

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
      <header style={{ borderBottom: RULE }}>
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
            href={isEu ? '/eu' : '/'}
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
          </Link>
          {/* No navigation on the EU page. Every destination is blocked. */}
          {!isEu && (
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
              <Link href="/reference" style={{ color: INK, textDecoration: 'none' }}>
                Library
              </Link>
              <Link href="/shop" style={{ color: INK, textDecoration: 'none' }}>
                Shop
              </Link>
            </nav>
          )}
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isEu ? 'minmax(0,1fr)' : 'minmax(0,200px) minmax(0,1fr)',
        }}
        className={isEu ? undefined : 'legal-grid'}
      >
        {!isEu && (
          <aside
            style={{
              padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 0',
              borderRight: RULE,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px 18px',
                flexWrap: 'wrap',
                fontFamily: JOST,
                fontSize: 10.5,
                letterSpacing: '.26em',
                textTransform: 'uppercase',
                position: 'sticky',
                top: 24,
              }}
            >
              {TABS.map(([key, label, href]) => (
                <Link
                  key={key}
                  href={href}
                  style={{
                    color: key === current ? INK : INK3,
                    borderBottom: `1px solid ${key === current ? INK : 'transparent'}`,
                    paddingBottom: 3,
                    whiteSpace: 'nowrap',
                    alignSelf: 'flex-start',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </aside>
        )}

        <article
          style={{
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 60px',
            maxWidth: 760,
          }}
        >
          <div
            style={{
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: INK3,
            }}
          >
            {kicker}
          </div>
          <h1
            style={{
              margin: '12px 0 0',
              fontWeight: 300,
              fontSize: 'clamp(34px,4.4vw,56px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              textWrap: 'pretty',
            }}
          >
            {title}
          </h1>
          <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 12, color: INK3 }}>
            {meta}
          </div>
          <p
            style={{
              margin: '22px 0 0',
              fontSize: 'clamp(19px,1.7vw,22px)',
              lineHeight: 1.4,
              textWrap: 'pretty',
            }}
          >
            {lede}
          </p>

          <div style={{ marginTop: 28, borderTop: RULE }}>
            {sections.map(([label, body]) => (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,140px) minmax(0,1fr)',
                  gap: '8px 24px',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(26,29,31,.16)',
                }}
              >
                <span
                  style={{
                    fontFamily: JOST,
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: INK3,
                    paddingTop: 6,
                  }}
                >
                  {label}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 17,
                    lineHeight: 1.5,
                    textWrap: 'pretty',
                    color: INK,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          {children}
        </article>
      </div>

      <footer
        style={{
          background: INK,
          color: '#C9CED2',
          padding: '14px clamp(16px,3vw,32px)',
          fontFamily: JOST,
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}
      >
        {LEGAL_FOOTER}
      </footer>

      {/* The tab column collapses below 760px, matching the design's breakpoint.
          A media query rather than a measured width: this page is static and
          should not need JavaScript to lay itself out. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media (max-width: 760px) {
            .legal-grid { grid-template-columns: minmax(0,1fr) !important; }
            .legal-grid > aside { border-right: none !important; border-bottom: ${RULE} !important; padding-bottom: 16px; }
            .legal-grid > aside > div { flex-direction: row !important; position: static !important; }
          }`,
        }}
      />
    </div>
  )
}

export { INK, INK2, INK3, JOST, RULE }
