// Bloodwork over time.
//
// Was a redirect into the Mirror's overlay. It is now a screen, because the
// trend across panels is most of the value and an overlay is the wrong shape
// for a table you read across.
//
// ── What this screen will not do ──────────────────────────────────────────
//
// From the V3 rules: "Bloodwork never marks, ranks, flags or colours a figure.
// Inks are ink and grey only; the printed range is shown as the lab printed it,
// never as a target. It never evaluates a value and never recommends a change."
//
// So: no red, no green, no "high", no arrows against a reference range. The
// only interpretive mark is a direction glyph comparing a marker to its own
// previous value, and the legend says in words that it is a direction and not a
// judgement. src/lib/bloodwork-trend.ts deliberately exposes no field a
// component could bind a verdict to, and a test asserts that.
//
// Uploading and parsing a new panel still happens in the Mirror's overlay,
// which is built, works, and writes to bloodwork_results. This screen reads
// what that produced. Duplicating the upload flow would give the app two write
// paths to one table.

import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
import { DIRECTION_GLYPH, buildTrend, readMarkers } from '@/lib/bloodwork-trend'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bloodwork · Peptide Cortex',
  description: 'Your markers across panels. Nothing is marked, ranked or flagged.',
}

export default async function BloodworkPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await isProUser())) redirect('/upgrade')

  const { data: rows } = await supabase
    .from('bloodwork_results')
    .select('id, markers, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const { panels, rows: trend } = buildTrend(
    (rows ?? []).map((row) => ({
      id: row.id,
      date: String(row.created_at).slice(0, 10),
      markers: readMarkers(row.markers),
    })),
  )

  const columns = `minmax(0,1.4fr) minmax(0,1fr) repeat(${panels.length}, minmax(0,0.8fr)) auto`

  return (
    <LibraryChrome signedIn>
      <div style={{ padding: 'clamp(22px,3vw,40px) clamp(16px,3vw,32px) clamp(24px,3vw,40px)' }}>
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
          <span>Bloodwork</span>
          <span style={{ color: INK3 }}>
            {panels.length} {panels.length === 1 ? 'panel' : 'panels'} · Pro
          </span>
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
          Your markers, over time.
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 18,
            lineHeight: 1.45,
            color: INK2,
            maxWidth: '64ch',
            textWrap: 'pretty',
          }}
        >
          One panel is a snapshot. Four is a trend, and the trend is most of the value.
        </p>

        <div style={{ marginTop: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href="/mirror?bloodwork=1"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: RULE,
              background: INK,
              color: '#F4F5F6',
              fontFamily: JOST,
              fontSize: 11,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              padding: '14px 22px',
              minHeight: 44,
              textDecoration: 'none',
            }}
          >
            {panels.length === 0 ? 'Upload a panel' : 'Upload another'}
          </Link>
          <span style={{ fontSize: 15, fontStyle: 'italic', color: INK2 }}>
            A PDF or a photo of a lab report is read into the table.
          </span>
        </div>

        {panels.length === 0 ? (
          <p
            style={{
              margin: '28px 0 0',
              fontSize: 20,
              fontStyle: 'italic',
              lineHeight: 1.4,
              color: INK2,
              maxWidth: '58ch',
            }}
          >
            No panels on file yet. The table appears once there is something to put in it,
            and starts being useful at the second one.
          </p>
        ) : (
          <div style={{ marginTop: 28, overflowX: 'auto' }}>
            <div style={{ minWidth: 520 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: columns,
                  gap: '0 clamp(10px,1.6vw,20px)',
                  paddingBottom: 8,
                  borderBottom: RULE,
                  fontFamily: JOST,
                  fontSize: 9.5,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: INK3,
                }}
              >
                <span>Marker</span>
                <span>Printed range</span>
                {panels.map((panel) => (
                  <span key={panel.id} style={{ textAlign: 'right' }}>
                    {panel.date}
                  </span>
                ))}
                <span />
              </div>

              {trend.map((row) => (
                <div
                  key={row.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: columns,
                    gap: '0 clamp(10px,1.6vw,20px)',
                    alignItems: 'baseline',
                    padding: '11px 0',
                    borderBottom: HAIR,
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 18 }}>{row.label}</span>
                    {row.unit && (
                      <span style={{ fontFamily: MONO, fontSize: 11, color: INK3, marginLeft: 8 }}>
                        {row.unit}
                      </span>
                    )}
                  </span>
                  {/* The lab's own text. Never parsed, never compared against. */}
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: INK3 }}>
                    {row.range ?? 'not printed'}
                  </span>
                  {row.cells.map((cell) => (
                    <span
                      key={cell.panelId}
                      style={{
                        fontFamily: MONO,
                        fontSize: 14,
                        textAlign: 'right',
                        // Weight marks which column is most recent. It is
                        // emphasis, not evaluation — no colour varies by value.
                        fontWeight: cell.isLatest ? 500 : 400,
                        color: cell.value === null ? INK3 : INK,
                      }}
                    >
                      {cell.value ?? '·'}
                    </span>
                  ))}
                  <span
                    style={{ fontFamily: MONO, fontSize: 14, color: INK3, paddingLeft: 8 }}
                    aria-label={`direction ${row.direction}`}
                  >
                    {DIRECTION_GLYPH[row.direction]}
                  </span>
                </div>
              ))}

              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: '6px 22px',
                  flexWrap: 'wrap',
                  fontFamily: JOST,
                  fontSize: 9.5,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: INK3,
                }}
              >
                <span>bold · latest panel</span>
                <span>· · not on that panel</span>
                <span>↗ ↘ → · direction across panels, not a judgement</span>
                <span>no figure is marked, ranked or flagged</span>
              </div>
            </div>
          </div>
        )}

        <p
          style={{
            margin: '28px 0 0',
            fontSize: 15.5,
            lineHeight: 1.5,
            color: INK2,
            maxWidth: '68ch',
            textWrap: 'pretty',
          }}
        >
          This table reports what your labs printed and how each figure has moved against
          its own last reading. It does not evaluate a value, compare one to a reference
          range, or recommend a change. Reference ranges differ between laboratories and a
          value outside one is not by itself a finding. Educational reference only; not
          medical advice. Take your results to a licensed physician.
        </p>
      </div>
    </LibraryChrome>
  )
}
