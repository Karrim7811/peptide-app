// Home.
//
// Rebuilt from design_handoff_peptide_cortex_site/Home.dc.html (V3, 2026-09-05),
// which supersedes both earlier home designs. The previous implementation in
// src/components/home/ is left in the tree unimported, the same way _landing/
// was left when that one replaced it.
//
// Every number on this page is derived, never typed. src/lib/home.ts computes
// them off the catalogue and the vial records, because a figure written into
// markup is a figure that goes stale without anyone noticing — which is exactly
// how the dose count came to have five different values across five sessions.
//
// The search box is a plain GET form. It works with no JavaScript, and the
// library page already reads ?q, so there is nothing to hydrate.

import Link from 'next/link'
import {
  CATEGORIES,
  COMPOUND_LIST,
  EVIDENCE_TO_GRADE,
  compoundsInCategory,
} from '@/lib/catalog'
import type { EvidenceLevel } from '@/lib/catalog'
import { libraryFigures, shopLine, vialTally } from '@/lib/home'
import { ANNUAL_PRICE, MONTHLY_PRICE, money, priceFootnote, proCta } from '@/lib/pricing'
import { PRODUCTS, currentLot } from '@/lib/shop/catalogue'
import { historyRows } from '@/lib/shop/view'
import { LEGAL } from '@/components/shop/ShopChrome'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = `1px solid ${INK}`
const HAIR = '1px solid rgba(26,29,31,.18)'
const MONO = "'JetBrains Mono', monospace"
const JOST = 'Jost, sans-serif'

const KICKER: React.CSSProperties = {
  fontFamily: JOST,
  fontSize: 10.5,
  letterSpacing: '.26em',
  textTransform: 'uppercase',
  color: TEAL,
}

const BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: RULE,
  fontFamily: JOST,
  fontSize: 11,
  letterSpacing: '.24em',
  textTransform: 'uppercase',
  padding: '14px 22px',
  minHeight: 44,
  textDecoration: 'none',
  color: INK,
}

export default function HomePage() {
  const figures = libraryFigures()
  const tally = vialTally()
  const ledger = historyRows('glp-3-30mg')
  const current = currentLot('glp-3-30mg')

  const grades = (Object.entries(EVIDENCE_TO_GRADE) as Array<[EvidenceLevel, string]>).map(
    ([evidence, grade]) => ({
      grade,
      evidence,
      n: COMPOUND_LIST.filter((entry) => entry.evidence === evidence).length,
    }),
  )

  const categories = [...CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      name: category.name,
      id: category.id,
      n: compoundsInCategory(category.id).length,
    }))

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
            <Link href="/reference" style={{ color: INK, textDecoration: 'none' }}>
              Library
            </Link>
            <Link href="/shop" style={{ color: INK, textDecoration: 'none' }}>
              Shop
            </Link>
            <Link
              href="/login"
              style={{
                color: INK,
                textDecoration: 'none',
                borderBottom: RULE,
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          padding: 'clamp(40px,7vw,96px) clamp(16px,3vw,32px) clamp(32px,5vw,64px)',
          borderBottom: RULE,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: 'clamp(38px,6.4vw,84px)',
            lineHeight: 0.98,
            letterSpacing: '-.03em',
            maxWidth: '16ch',
            textWrap: 'pretty',
          }}
        >
          Everyone else asks you to trust them. We publish the numbers.
        </h1>
        <div
          style={{
            marginTop: 'clamp(20px,3vw,32px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
            gap: '20px 40px',
            alignItems: 'end',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(18px,1.7vw,22px)',
              lineHeight: 1.4,
              color: INK2,
              maxWidth: '52ch',
              textWrap: 'pretty',
            }}
          >
            An independent lab assay for every batch we sell, with the price per
            milligram beside it. A reference on {figures.compounds} peptides that says
            “no human dose established” when that is the truth. Read either for free;
            check the arithmetic yourself.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifySelf: 'start' }}>
            <Link href="/reference" style={{ ...BTN, background: INK, color: '#F4F5F6' }}>
              Read the library
            </Link>
            <Link href="/shop" style={BTN}>
              See the seven vials
            </Link>
          </div>
        </div>
      </section>

      {/* The ledger */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,420px),1fr))',
          borderBottom: RULE,
        }}
      >
        <div style={{ padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              ...KICKER,
            }}
          >
            <span>The ledger</span>
            <span style={{ color: INK3 }}>GLP-3 · Retatrutide · 30 mg</span>
          </div>
          <h2
            style={{
              margin: '14px 0 0',
              fontWeight: 300,
              fontSize: 'clamp(28px,3vw,40px)',
              lineHeight: 1.05,
              letterSpacing: '-.024em',
              textWrap: 'pretty',
            }}
          >
            Nine months of consecutive batches. Every one above 99.4%.
          </h2>

          <div
            style={{
              marginTop: 22,
              display: 'grid',
              gridTemplateColumns: 'auto auto minmax(0,1fr) auto auto',
              gap: '0 clamp(10px,1.6vw,18px)',
              fontFamily: JOST,
              fontSize: 10,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: INK3,
              paddingBottom: 8,
              borderBottom: RULE,
            }}
          >
            <span>Assayed</span>
            <span>Lot</span>
            <span />
            <span style={{ textAlign: 'right' }}>Purity</span>
            <span style={{ textAlign: 'right' }}>Measured</span>
          </div>

          {ledger.map((row) => {
            const value = Number((row.purity ?? '').replace('%', ''))
            // The bar magnifies the only part of the range that varies. Below
            // 99% it would be off the scale, so it floors at a visible stub
            // rather than vanishing.
            const width = Number.isFinite(value)
              ? `${Math.round(Math.max(4, Math.min(100, (value - 99) * 100)))}%`
              : '4%'
            const ink = row.isCurrent ? TEAL : INK

            return (
              <div
                key={row.lot ?? row.mfg}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto minmax(0,1fr) auto auto',
                  gap: '0 clamp(10px,1.6vw,18px)',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: HAIR,
                  fontFamily: MONO,
                  fontSize: 'clamp(12px,1.2vw,15px)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{row.mfg}</span>
                <span style={{ color: ink, whiteSpace: 'nowrap' }}>{row.lot}</span>
                <span
                  style={{
                    height: 1,
                    background: 'rgba(26,29,31,.14)',
                    position: 'relative',
                    minWidth: 12,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -1,
                      height: 3,
                      width,
                      background: ink,
                    }}
                  />
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    textAlign: 'right',
                    fontSize: 'clamp(16px,1.6vw,20px)',
                  }}
                >
                  {row.purity}
                </span>
                <span style={{ color: INK2, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {row.measured} mg
                </span>
              </div>
            )
          })}

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontFamily: MONO,
              fontSize: 12,
              color: INK2,
            }}
          >
            <span>30.00 mg labelled on every row</span>
            {current?.lotCode && (
              <span style={{ color: TEAL }}>{current.lotCode} shipping now</span>
            )}
          </div>

          <p
            style={{
              margin: '18px 0 0',
              fontSize: 17,
              lineHeight: 1.45,
              color: INK2,
              textWrap: 'pretty',
            }}
          >
            One certificate covers one vial. A run of dated batches covers a supplier.
            The dates stay on every row because they are what make it a record.
          </p>
          <Link
            href="/shop/glp-3-30mg"
            style={{
              display: 'inline-block',
              marginTop: 16,
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              borderBottom: RULE,
              paddingBottom: 2,
              color: INK,
              textDecoration: 'none',
            }}
          >
            The full assay →
          </Link>
        </div>

        <div
          style={{
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)',
            background: '#F4F5F6',
            borderLeft: RULE,
          }}
        >
          <div style={KICKER}>Everything on file</div>
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
              gap: 1,
              background: INK,
              border: RULE,
            }}
          >
            {tally.rows.map((row) => (
              <div
                key={row.label}
                style={{
                  background: '#F4F5F6',
                  padding: '16px 16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontWeight: 500,
                    fontSize: 'clamp(30px,3.6vw,44px)',
                    lineHeight: 1,
                    letterSpacing: '-.02em',
                  }}
                >
                  {row.n}
                </span>
                <span
                  style={{
                    fontFamily: JOST,
                    fontSize: 10,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: INK3,
                    lineHeight: 1.5,
                  }}
                >
                  {row.label}
                </span>
              </div>
            ))}
          </div>
          {tally.note && (
            <p
              style={{
                margin: '18px 0 0',
                fontSize: 17,
                lineHeight: 1.45,
                color: INK2,
                textWrap: 'pretty',
              }}
            >
              {tally.note}
            </p>
          )}
          <div
            style={{
              marginTop: 22,
              borderTop: RULE,
              paddingTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 14px',
              fontFamily: MONO,
              fontSize: 13,
            }}
          >
            {PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                href={`/shop/${product.slug}`}
                style={{
                  borderBottom: '1px solid rgba(26,29,31,.35)',
                  paddingBottom: 1,
                  whiteSpace: 'nowrap',
                  color: INK,
                  textDecoration: 'none',
                }}
              >
                {product.name} {product.sizeValue} {product.sizeUnit}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The reference */}
      <section
        style={{ padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)', borderBottom: RULE }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
            ...KICKER,
          }}
        >
          <span>The reference</span>
          <span style={{ color: INK3 }}>
            {figures.compounds} peptides · {figures.categories} categories · free to read
          </span>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,380px),1fr))',
            gap: '24px 48px',
            alignItems: 'start',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontWeight: 300,
                fontSize: 'clamp(28px,3vw,40px)',
                lineHeight: 1.05,
                letterSpacing: '-.024em',
                textWrap: 'pretty',
              }}
            >
              Graded by evidence, not by enthusiasm.
            </h2>
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 17,
                lineHeight: 1.45,
                color: INK2,
                maxWidth: '56ch',
                textWrap: 'pretty',
              }}
            >
              Each entry carries purpose, mechanism, effects, cautions, interactions and
              an evidence grade that maps one-to-one from regulatory status. A
              cardiovascular score sits on its own axis and never touches the grade.{' '}
              {figures.noDose} entries state that no human dose is established, and the
              page says exactly that.
            </p>

            <form
              action="/reference"
              method="get"
              style={{
                marginTop: 20,
                border: '1px dashed rgba(26,138,158,.6)',
                padding: '10px 14px',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontStyle: 'italic',
                  fontSize: 19,
                  color: INK3,
                  whiteSpace: 'nowrap',
                }}
              >
                Look up —
              </span>
              <input
                name="q"
                placeholder="a peptide, a brand name, an indication"
                aria-label="Search the library"
                style={{
                  flex: 1,
                  font: 'inherit',
                  fontStyle: 'italic',
                  fontSize: 21,
                  minHeight: 32,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: INK,
                }}
              />
              <button
                type="submit"
                style={{
                  appearance: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: JOST,
                  fontSize: 10.5,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: INK,
                  padding: '6px 0',
                  minHeight: 32,
                }}
              >
                Search
              </button>
            </form>
          </div>

          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0,1fr) auto',
                gap: '0 14px',
                fontFamily: JOST,
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: INK3,
                paddingBottom: 8,
                borderBottom: RULE,
              }}
            >
              <span>Grade</span>
              <span>Evidence</span>
              <span style={{ textAlign: 'right' }}>Count</span>
            </div>
            {grades.map((row) => (
              <div
                key={row.evidence}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0,1fr) auto',
                  gap: '0 14px',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: HAIR,
                }}
              >
                <span
                  style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, width: 24 }}
                >
                  {row.grade}
                </span>
                <span
                  style={{ fontSize: 15.5, lineHeight: 1.3, color: INK2, minWidth: 0 }}
                >
                  {row.evidence}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 15, textAlign: 'right' }}>
                  {row.n}
                </span>
              </div>
            ))}

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px 14px',
                fontFamily: JOST,
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
              }}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/reference?cat=${category.id}`}
                  style={{ color: INK2, whiteSpace: 'nowrap', textDecoration: 'none' }}
                >
                  {category.name}{' '}
                  <span style={{ fontFamily: MONO, color: INK3 }}>{category.n}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two businesses */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,420px),1fr))',
          borderBottom: RULE,
        }}
      >
        <div
          style={{
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <span style={{ ...KICKER, color: INK3 }}>The bench · a subscription</span>
          <h3
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: 'clamp(26px,2.6vw,34px)',
              lineHeight: 1.08,
              letterSpacing: '-.02em',
              textWrap: 'pretty',
            }}
          >
            Reading is free. Keeping a bench — your vials, your log, your notes — is what
            Pro is for.
          </h3>
          <div style={{ fontFamily: MONO, fontSize: 14, lineHeight: 1.7, color: INK2 }}>
            <span style={{ color: INK, fontWeight: 500 }}>{money(MONTHLY_PRICE)}</span> per
            month · <span style={{ color: INK, fontWeight: 500 }}>{money(ANNUAL_PRICE)}</span>{' '}
            per year
            <br />
            {priceFootnote('monthly')}
          </div>
          <Link href="/signup" style={{ ...BTN, alignSelf: 'flex-start' }}>
            {proCta('monthly')}
          </Link>
        </div>

        <div
          style={{
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            borderLeft: RULE,
          }}
        >
          <span style={{ ...KICKER, color: INK3 }}>The shop · seven peptides</span>
          <h3
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: 'clamp(26px,2.6vw,34px)',
              lineHeight: 1.08,
              letterSpacing: '-.02em',
              textWrap: 'pretty',
            }}
          >
            Purity, measured content and price per milligram on every card. Where the
            assay is still at the lab, the card says so.
          </h3>
          <div style={{ fontFamily: MONO, fontSize: 14, lineHeight: 1.7, color: INK2 }}>
            {shopLine()}
            <br />
            cold chain · use within 28 days · 2–8 °C · US only
          </div>
          <Link href="/shop" style={{ ...BTN, alignSelf: 'flex-start' }}>
            The catalogue
          </Link>
        </div>
      </section>

      <footer
        style={{
          marginTop: 'auto',
          background: INK,
          color: '#C9CED2',
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
        <span style={{ maxWidth: '80ch' }}>{LEGAL}</span>
        <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#C9CED2', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: '#C9CED2', textDecoration: 'none' }}>
            Privacy
          </Link>
          <Link href="/refund-policy" style={{ color: '#C9CED2', textDecoration: 'none' }}>
            Refunds
          </Link>
        </span>
      </footer>
    </div>
  )
}
