// The dosing reference.
//
// ── What this is, and what it deliberately is not ─────────────────────────
//
// This route used to be a weight-based dose calculator: enter a body weight,
// get a suggested dose. That is the feature Apple rejected the iOS app for under
// Guideline 1.4.2, and CLAUDE.md §16.9a records Karim reopening the question on
// 2026-09-04 and closing it again the same day. It is not coming back. The
// strongest argument against it is in that section and is newer than the Apple
// one: Peptide Cortex is now a seller, and publishing suggested doses for
// compounds you also sell is close to the FDA's test for intended use in a way
// that a pure information site is not.
//
// So there is no body weight, no goals, no frequency and no arithmetic. This is
// a look-up over what the literature already says, with the source beside it.
//
// ── Why every row carries a source ────────────────────────────────────────
//
// A figure without its source is indistinguishable from a recommendation. "2.4
// mg weekly" alone reads as advice; "2.4 mg weekly · FDA label · Wegovy" reads
// as a citation. Where nothing can be cited the row says so rather than leaving
// the column empty, because an empty column looks like missing data and this is
// not missing data — it is the finding.
//
// ── Four filters, not three ───────────────────────────────────────────────
//
// The design specifies three (all / with a range / no dose). The data has three
// states plus all, because 25 entries point at a label without naming an amount.
// Folding those into "with a range" is exactly what produced the 51 and the 81
// that have been wrong in the docs for months. See src/lib/dosing.ts.
//
// Never gated. Same rule as the math and side effects.

import Link from 'next/link'
import type { Metadata } from 'next'
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
import { NO_DOSE_LINE, doseCounts, doseSource, doseState } from '@/lib/dosing'
import { noDoseContext } from '@/lib/dosing'
import type { DoseState } from '@/lib/dosing'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dosing reference · Peptide Cortex',
  description:
    'What the label or the trial actually says, with the source beside it. No calculator, no body weight, no recommendations.',
}

const FILTERS: Array<[string, string, DoseState | null]> = [
  ['all', 'All', null],
  ['published', 'With a published figure', 'published'],
  ['label', 'Points to a label', 'labelOnly'],
  ['none', 'No human dose', 'none'],
]

export default async function DosingPage({
  searchParams,
}: {
  searchParams: { q?: string; show?: string }
}) {
  const query = (searchParams.q ?? '').slice(0, 100)
  const showKey = FILTERS.some(([key]) => key === searchParams.show)
    ? (searchParams.show as string)
    : 'all'
  const wanted = FILTERS.find(([key]) => key === showKey)?.[2] ?? null

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const counts = doseCounts()
  const countFor = (state: DoseState | null) =>
    state === null ? counts.total : counts[state]

  const needle = query.trim().toLowerCase()
  const rows = [...COMPOUND_LIST]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((entry) => (wanted ? doseState(entry) === wanted : true))
    .filter((entry) => (needle ? entry.fullName.toLowerCase().includes(needle) : true))
    .map((entry) => {
      const state = doseState(entry)
      const source = doseSource(entry)
      return {
        id: entry.id,
        name: entry.name,
        grade: entry.grade,
        state,
        // Only a published entry may render its own figure. The other two states
        // render the sentence, in serif italic so it never reads as data.
        text: state === 'none' ? NO_DOSE_LINE : entry.dosage,
        isFigure: state === 'published',
        context: noDoseContext(entry),
        source,
      }
    })

  const href = (key: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (key !== 'all') params.set('show', key)
    const qs = params.toString()
    return qs ? `/dosing?${qs}` : '/dosing'
  }

  return (
    <LibraryChrome signedIn={Boolean(user)}>
      <div style={{ padding: 'clamp(22px,3vw,40px) clamp(16px,3vw,32px) 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
            fontFamily: JOST,
            fontSize: 10.5,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: TEAL,
          }}
        >
          <span>Dosing reference</span>
          <span style={{ color: INK3 }}>never gated · no calculator</span>
        </div>

        <h1
          style={{
            margin: '14px 0 0',
            fontWeight: 300,
            fontSize: 'clamp(30px,3.6vw,46px)',
            lineHeight: 1,
            letterSpacing: '-.028em',
          }}
        >
          What the label or the trial says.
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 18,
            lineHeight: 1.45,
            color: INK2,
            maxWidth: '62ch',
            textWrap: 'pretty',
          }}
        >
          Per peptide, the figure the published literature or the drug label actually
          gives, with the source beside it. Where there is nothing to cite, the row says
          so and stays that way.
        </p>

        <form
          action="/dosing"
          method="get"
          style={{
            marginTop: 20,
            border: '1px dashed rgba(26,138,158,.6)',
            padding: '8px 14px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span
            style={{ fontStyle: 'italic', fontSize: 19, color: INK3, whiteSpace: 'nowrap' }}
          >
            Look up —
          </span>
          <input
            name="q"
            defaultValue={query}
            placeholder="a peptide or a brand name"
            aria-label="Search the dosing reference"
            style={{
              flex: 1,
              font: 'inherit',
              fontStyle: 'italic',
              fontSize: 21,
              minHeight: 36,
              minWidth: 0,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: INK,
            }}
          />
          {showKey !== 'all' && <input type="hidden" name="show" value={showKey} />}
        </form>

        <div
          style={{
            display: 'flex',
            gap: '8px 18px',
            flexWrap: 'wrap',
            padding: '14px 0 8px',
            fontFamily: JOST,
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
          }}
        >
          {FILTERS.map(([key, label, state]) => (
            <Link
              key={key}
              href={href(key)}
              style={{
                color: key === showKey ? INK : INK3,
                borderBottom: `1px solid ${key === showKey ? INK : 'transparent'}`,
                padding: '6px 0',
                minHeight: 32,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              {label}{' '}
              <span
                style={{
                  fontFamily: MONO,
                  letterSpacing: 0,
                  marginLeft: 6,
                  color: INK3,
                }}
              >
                {countFor(state)}
              </span>
            </Link>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr) minmax(0,.9fr)',
            gap: '0 clamp(12px,2vw,24px)',
            paddingBottom: 8,
            borderBottom: RULE,
            fontFamily: JOST,
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: INK3,
          }}
        >
          <span>Peptide · grade</span>
          <span>What the label or trial says</span>
          <span style={{ textAlign: 'right' }}>Source</span>
        </div>

        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/reference/${row.id}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr) minmax(0,.9fr)',
              gap: '4px clamp(12px,2vw,24px)',
              alignItems: 'baseline',
              padding: '11px 0',
              borderBottom: '1px solid rgba(26,29,31,.14)',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ fontSize: 18 }}>{row.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: INK3, marginLeft: 8 }}>
                grade {row.grade}
              </span>
            </span>

            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              {/* A real amount is mono, like every other figure on the site. A
                  sentence is serif italic, so the two are never confusable. */}
              <span
                style={{
                  fontFamily: row.isFigure ? MONO : 'inherit',
                  fontSize: row.isFigure ? 13.5 : 17,
                  fontStyle: row.isFigure ? 'normal' : 'italic',
                  lineHeight: 1.45,
                }}
              >
                {row.text}
              </span>
              {row.context && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 5,
                    borderLeft: '1px solid rgba(26,29,31,.25)',
                    paddingLeft: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: JOST,
                      fontSize: 9,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                      color: INK3,
                    }}
                  >
                    Not a dose · what the literature contains instead
                  </span>
                  <br />
                  <span style={{ fontSize: 14.5, lineHeight: 1.4, color: INK2 }}>
                    {row.context}
                  </span>
                </span>
              )}
            </span>

            <span style={{ textAlign: 'right', minWidth: 0 }}>
              <span
                style={{
                  fontFamily: JOST,
                  fontSize: 9.5,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: row.state === 'none' ? INK3 : TEAL,
                }}
              >
                {row.source.kind}
              </span>
              <br />
              <span style={{ fontSize: 14.5, fontStyle: 'italic', color: INK2 }}>
                {row.source.ref}
              </span>
            </span>
          </Link>
        ))}

        {rows.length === 0 && (
          <p style={{ margin: '16px 0 0', fontSize: 17, fontStyle: 'italic', color: INK2 }}>
            Nothing in the {counts.total} matches that.
          </p>
        )}

        <p
          style={{
            margin: '16px 0 clamp(24px,3vw,40px)',
            fontSize: 15.5,
            fontStyle: 'italic',
            color: INK2,
            maxWidth: '62ch',
            textWrap: 'pretty',
          }}
        >
          No body weight, no goals, no frequency, no calculator. A figure without its
          source is indistinguishable from a recommendation, so every row carries one.
          Where nothing can be cited, the row says so.
        </p>
      </div>
    </LibraryChrome>
  )
}
