// One compound.
//
// Free to read, like the rest of the library.
//
// Two things about the layout are deliberate and should survive a tidy-up:
//
//   • Grade and CV sit side by side as two separate figures with two separate
//     labels. Grade comes from regulatory status alone; CV is cardiovascular
//     risk on its own axis and never moves a grade. Rendering them as one
//     score, or stacking one under the other, invites exactly the conflation
//     the catalogue is built to prevent.
//
//   • Cautions and interactions are last, boxed, with nothing sold beside them.
//     A "buy" affordance next to a safety block makes the safety block look
//     like part of the pitch.
//
// Dosing renders "No human dose established." for anything without a published
// figure — never a dash, never the source field's "N/A". Where a no-dose entry
// still cites rodent or discontinued-programme numbers, they print underneath,
// rule-separated and labelled as not a dose. See src/lib/dosing.ts.

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  HAIR,
  INK,
  INK2,
  INK3,
  JOST,
  LibraryChrome,
  MONO,
  RULE,
  TEAL,
} from '@/components/library/LibraryChrome'
import { COMPOUND_LIST } from '@/lib/catalog'
import { compoundView } from '@/lib/library'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return COMPOUND_LIST.map((entry) => ({ id: entry.id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const view = compoundView(params.id)
  if (!view) return { title: 'Not in the library · Peptide Cortex' }
  return {
    title: `${view.name} · Peptide Cortex`,
    description: `${view.facts[0].value}. Evidence grade ${view.grade}. Cardiovascular score ${view.cv} of 5.`,
  }
}

export default async function CompoundPage({ params }: { params: { id: string } }) {
  const view = compoundView(params.id)
  if (!view) notFound()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <LibraryChrome signedIn={Boolean(user)}>
      <div style={{ padding: 'clamp(22px,3vw,40px) clamp(16px,3vw,32px) 0' }}>
        <Link
          href="/reference"
          style={{
            fontFamily: JOST,
            fontSize: 10,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: INK3,
            textDecoration: 'none',
          }}
        >
          ← The library
        </Link>

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: '10px 18px',
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontWeight: 300,
              fontSize: 'clamp(36px,5vw,64px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              margin: 0,
            }}
          >
            {view.name}
          </h1>
          {view.brand && (
            <span
              style={{ fontSize: 'clamp(17px,1.6vw,22px)', fontStyle: 'italic', color: INK2 }}
            >
              {view.brand}
            </span>
          )}
          <span
            style={{
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: INK3,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {view.category}
          </span>
        </div>

        {view.notPeptideLine && (
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 17,
              fontStyle: 'italic',
              lineHeight: 1.4,
              color: INK2,
              maxWidth: '60ch',
              textWrap: 'pretty',
            }}
          >
            {view.notPeptideLine}
          </p>
        )}
      </div>

      {/* Two figures, two labels, two axes. */}
      <div
        style={{
          padding: 'clamp(18px,2.4vw,32px) clamp(16px,3vw,32px) 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px),1fr))',
          gap: '18px 32px',
          alignItems: 'end',
        }}
      >
        <div style={{ borderTop: RULE, paddingTop: 12 }}>
          <Label>Evidence grade</Label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 6 }}>
            <span style={FIGURE}>{view.grade}</span>
            <span style={{ fontSize: 16, lineHeight: 1.3, color: INK2, textWrap: 'pretty' }}>
              {view.evidence}
            </span>
          </div>
        </div>
        <div style={{ borderTop: RULE, paddingTop: 12 }}>
          <Label>Cardiovascular · 0–5 · separate axis</Label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 6 }}>
            <span style={FIGURE}>{view.cv}</span>
            <span
              style={{
                display: 'flex',
                gap: 5,
                alignItems: 'center',
                transform: 'translateY(-6px)',
              }}
            >
              {view.cvDots.map((filled, i) => (
                <span
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: `1px solid ${INK}`,
                    background: filled ? INK : 'transparent',
                  }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {view.shopHref && (
        <div
          style={{
            padding: '16px clamp(16px,3vw,32px) 0',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={view.shopHref}
            style={{
              marginLeft: 'auto',
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              borderBottom: RULE,
              paddingBottom: 2,
              whiteSpace: 'nowrap',
              color: INK,
              textDecoration: 'none',
            }}
          >
            In the shop · assay ↗
          </Link>
        </div>
      )}

      <div style={{ padding: 'clamp(18px,2.4vw,28px) clamp(16px,3vw,32px) 0' }}>
        <div style={{ borderTop: RULE }}>
          {view.facts.map((fact) => (
            <div
              key={fact.label}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,120px) minmax(0,1fr)',
                gap: 14,
                padding: '12px 0',
                borderBottom: '1px solid rgba(26,29,31,.16)',
                alignItems: 'baseline',
              }}
            >
              <Label>{fact.label}</Label>
              <span
                style={{
                  fontFamily: fact.mono ? MONO : 'inherit',
                  fontSize: fact.mono ? 14 : 17,
                  lineHeight: 1.5,
                  minWidth: 0,
                  textWrap: 'pretty',
                }}
              >
                {fact.value}
              </span>
            </div>
          ))}
        </div>

        {/* Real, cited, and not a dose. Neither discarding these nor printing
            them as an amount was acceptable, so they sit below the line that
            says no dose exists, labelled for what they are. */}
        {view.noDoseContext && (
          <div style={{ marginTop: 16, borderTop: HAIR, paddingTop: 12 }}>
            <Label>Not a dose · what the literature contains instead</Label>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 16,
                lineHeight: 1.5,
                color: INK2,
                maxWidth: '68ch',
                textWrap: 'pretty',
              }}
            >
              {view.noDoseContext}
            </p>
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))',
            gap: '24px 40px',
          }}
        >
          <div>
            <SectionHead
              left="Batches on file"
              right={view.batches.length ? String(view.batches.length) : 'none'}
            />
            {view.batches.map((batch) => (
              <div
                key={batch.lot}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0,1fr) auto',
                  gap: '0 14px',
                  padding: '10px 0',
                  borderBottom: HAIR,
                  fontFamily: MONO,
                  fontSize: 13,
                  alignItems: 'baseline',
                }}
              >
                <span>{batch.qty}</span>
                <span
                  style={{
                    color: INK2,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {batch.lot}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 15,
                    // A missing figure is grey and says so. Never a dash.
                    color: batch.hasPurity ? INK : INK3,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {batch.purity}
                </span>
              </div>
            ))}
            {view.batches.length === 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 16, fontStyle: 'italic', color: INK2 }}>
                No tested batches on file.
              </p>
            )}
          </div>

          <div>
            <SectionHead
              left="Read with"
              right={view.stacks.length ? String(view.stacks.length) : ''}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '12px 0' }}>
              {view.stacks.map((stack) => (
                <Link
                  key={stack.id}
                  href={stack.href}
                  style={{
                    fontSize: 18,
                    borderBottom: '1px solid rgba(26,29,31,.35)',
                    color: INK,
                    textDecoration: 'none',
                  }}
                >
                  {stack.name}
                </Link>
              ))}
            </div>
            {view.stacks.length === 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 16, fontStyle: 'italic', color: INK2 }}>
                The library records no pairings for this entry.
              </p>
            )}
          </div>
        </div>

        {/* Safety last, on its own, nothing sold beside it. */}
        <div
          style={{
            marginTop: 28,
            marginBottom: 'clamp(24px,3vw,40px)',
            border: RULE,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: INK,
            }}
          >
            Cautions &amp; interactions
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 19, lineHeight: 1.4, textWrap: 'pretty' }}>
            {view.cautions}
          </p>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 17,
              lineHeight: 1.45,
              color: INK2,
              textWrap: 'pretty',
            }}
          >
            {view.interactions}
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.45, color: INK2 }}>
            {view.cvNote}
          </p>
        </div>
      </div>
    </LibraryChrome>
  )
}

const FIGURE: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: 'clamp(44px,5vw,72px)',
  lineHeight: 1,
  letterSpacing: '-.02em',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: JOST,
        fontSize: 10,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        color: INK3,
      }}
    >
      {children}
    </span>
  )
}

function SectionHead({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: JOST,
        fontSize: 10.5,
        letterSpacing: '.26em',
        textTransform: 'uppercase',
        color: TEAL,
        borderBottom: RULE,
        paddingBottom: 8,
      }}
    >
      <span>{left}</span>
      <span style={{ color: INK3 }}>{right}</span>
    </div>
  )
}
