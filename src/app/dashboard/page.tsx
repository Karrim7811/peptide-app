// The bench.
//
// Rebuilt from App.dc.html's bench view (V3). The signed-in landing screen:
// what is on the shelf, what is on the schedule, and the way into the tools.
//
// ── What happened to the Mirror ───────────────────────────────────────────
//
// This route used to render MirrorClient — the zoomable field with the
// interaction checker, the bloodwork overlay, THE MATH, and every write path
// the app has. It has NOT been deleted or reimplemented. It lives at /mirror,
// unchanged, and twelve routes that redirect into it (/stack, /log, /cycle,
// /sites, /inventory, /notes, /reminders, /side-effects, /checker, /bloodwork,
// /reconstitution, /welcome) were repointed there with their query params
// intact.
//
// That order matters. Those redirects carry params only the Mirror reads —
// ?bloodwork=1, ?tab=cycle, ?ledger=1, ?tab=rotation — and this screen
// understands none of them. Pointing them here instead would have left the
// app's only data entry reachable by no route at all, which is exactly what
// docs/design-integration-prompt.md §5 warns about: "InteractionCheck and
// BloodworkOverlay are live inside the dashboard today. If the new bench shell
// replaces the old dashboard, those must still be reachable or the app loses
// its most valuable features."
//
// So this screen adds a surface; it does not remove one. Everything the Mirror
// does is one labelled link away, and the link says what is behind it.

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
import { benchView } from '@/lib/bench'
import { COMPOUND_LIST } from '@/lib/catalog'
import { categoryChips } from '@/lib/library'
import { resolveCompoundId } from '@/lib/mirror/mapping'
import { ANNUAL_PRICE, MONTHLY_PRICE, money, priceFootnote, proCta } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'The bench · Peptide Cortex' }

/** Where the Mirror's capabilities live now, and what each one is. */
const TOOLS: Array<[string, string, string]> = [
  ['/mirror', 'The field', 'Your stack, dose log, cycles, sites and notes. Everything you can edit.'],
  ['/mirror?bloodwork=1', 'Bloodwork', 'Markers read against what is on your bench.'],
  ['/dosing', 'Dosing reference', 'What the label or the trial says, with its source. Never gated.'],
  ['/protocol', 'Protocol planner', 'A week drafted around the bench. Pro.'],
  ['/scanner', 'Vial scanner', 'Photograph a shelf and check the reading. Pro.'],
]

export default async function BenchPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isPro = await isProUser()

  const [{ data: stackRows }, { data: inventoryRows }] = await Promise.all([
    supabase
      .from('stack_items')
      .select('id, name, dose, unit, active')
      .eq('user_id', user.id)
      .eq('active', true),
    supabase
      .from('inventory')
      .select('id, name, vial_size_mg, quantity_remaining')
      .eq('user_id', user.id),
  ])

  const view = benchView(
    (stackRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      compoundId: resolveCompoundId(row.name),
      dose: row.dose,
      unit: row.unit,
    })),
    (inventoryRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      compoundId: resolveCompoundId(row.name),
      vialSizeMg: row.vial_size_mg,
      quantityRemaining: row.quantity_remaining,
    })),
    isPro,
  )

  const chips = categoryChips().slice(1, 9)

  return (
    <LibraryChrome signedIn>
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
          <span>The bench</span>
          <span style={{ color: INK3 }}>{isPro ? 'Pro' : 'Free'}</span>
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
          {view.title}
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 17, color: INK2 }}>{view.subtitle}</p>

        {view.vials.length > 0 && (
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'clamp(12px,2.4vw,30px)',
              flexWrap: 'wrap',
            }}
          >
            {view.vials.map((glyph) => (
              <Link
                key={glyph.id}
                href={glyph.href}
                title={glyph.name}
                style={{
                  width: 74,
                  flex: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 16,
                    borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(90deg,#9AA3A9,#D6DBDE 35%,#B7BFC4 60%,#7E878E)',
                    border: '1px solid rgba(26,29,31,.45)',
                    borderBottom: 'none',
                  }}
                />
                <span
                  style={{
                    width: 74,
                    height: 130,
                    position: 'relative',
                    border: '1px solid rgba(26,29,31,.42)',
                    borderRadius: '10px 10px 12px 12px',
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,.85) 0%, rgba(255,255,255,.25) 22%, rgba(26,29,31,.04) 55%, rgba(255,255,255,.55) 86%, rgba(26,29,31,.08) 100%)',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  {/* Drawn only where a level is actually known. */}
                  {glyph.fill !== null && glyph.fill > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 6,
                        right: 6,
                        bottom: 6,
                        height: `${Math.min(glyph.fill, 100) * 0.55}%`,
                        background: 'rgba(26,138,158,.18)',
                        border: '1px solid rgba(26,138,158,.5)',
                        borderRadius: '3px 3px 8px 8px',
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 28,
                      height: 62,
                      background: '#FAFAF8',
                      borderTop: '1px solid rgba(26,29,31,.35)',
                      borderBottom: '1px solid rgba(26,29,31,.35)',
                      padding: '5px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ fontSize: 5, letterSpacing: '.14em', fontWeight: 500 }}>
                      PEPTIDE CORTEX
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        lineHeight: 1,
                        color: TEAL,
                        marginTop: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {glyph.name}
                    </span>
                    {glyph.size && (
                      <span style={{ fontFamily: JOST, fontSize: 5, color: INK2 }}>
                        {glyph.size}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  style={{
                    marginTop: 10,
                    fontFamily: JOST,
                    fontSize: 9.5,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    color: INK3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {glyph.caption}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,32px) clamp(24px,3vw,40px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px),1fr))',
          gap: 'clamp(20px,3vw,36px)',
          alignItems: 'start',
        }}
      >
        <div>
          <SectionHead left={view.tableTitle} right={`${view.rows.length}`} />
          {view.rows.map((row) => (
            <Link
              key={row.id}
              href={row.href}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                gap: '0 14px',
                padding: '12px 0',
                borderBottom: HAIR,
                alignItems: 'baseline',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{row.name}</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 15,
                    fontStyle: 'italic',
                    color: INK2,
                    marginTop: 3,
                  }}
                >
                  {row.subtitle}
                </span>
              </span>
              <span
                style={{ fontFamily: MONO, fontSize: 13, color: INK2, whiteSpace: 'nowrap' }}
              >
                {row.right}
              </span>
            </Link>
          ))}

          {view.rows.length === 0 && (
            <p style={{ margin: '14px 0 0', fontSize: 17, fontStyle: 'italic', color: INK2 }}>
              Nothing on the bench yet.{' '}
              <Link href="/mirror" style={{ color: INK, textDecoration: 'underline' }}>
                Add your first peptide
              </Link>
              .
            </p>
          )}

          <p style={{ margin: '14px 0 0', fontSize: 15.5, color: INK2, maxWidth: '54ch' }}>
            {view.tableNote}
          </p>

          {!view.isPro && (
            <div
              style={{
                marginTop: 16,
                border: '1px dashed rgba(26,138,158,.6)',
                padding: '16px 18px',
              }}
            >
              <Label>Pro keeps the rest</Label>
              <p style={{ margin: '8px 0 0', fontSize: 20, lineHeight: 1.3, textWrap: 'pretty' }}>
                {view.hidden > 0
                  ? `${view.hidden} more ${view.hidden === 1 ? 'entry is' : 'entries are'} on your bench. `
                  : ''}
                A full bench: every vial you hold, a dose log with times and sites,
                reminders, cycles, notes and bloodwork read against your stack.
              </p>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: INK2,
                }}
              >
                <span style={{ color: INK, fontWeight: 500 }}>{money(MONTHLY_PRICE)}</span> per
                month · <span style={{ color: INK, fontWeight: 500 }}>{money(ANNUAL_PRICE)}</span>{' '}
                per year
                <br />
                {priceFootnote('monthly')}
              </div>
              <Link
                href="/upgrade"
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  border: RULE,
                  background: INK,
                  color: '#F4F5F6',
                  padding: '12px 20px',
                  fontFamily: JOST,
                  fontSize: 10.5,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  minHeight: 44,
                  lineHeight: '20px',
                  textDecoration: 'none',
                }}
              >
                {proCta('monthly')}
              </Link>
            </div>
          )}
        </div>

        <div>
          <SectionHead left="Tools" right="" />
          {TOOLS.map(([href, name, what]) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '12px 0',
                borderBottom: HAIR,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 20 }}>{name}</span>
              <span
                style={{
                  display: 'block',
                  fontSize: 15.5,
                  lineHeight: 1.4,
                  color: INK2,
                  marginTop: 2,
                }}
              >
                {what}
              </span>
            </Link>
          ))}

          <div style={{ marginTop: 24 }}>
            <SectionHead left="The library" right={`${COMPOUND_LIST.length} · free to read`} />
            <form
              action="/reference"
              method="get"
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: HAIR,
              }}
            >
              <span
                style={{ fontStyle: 'italic', fontSize: 18, color: INK3, whiteSpace: 'nowrap' }}
              >
                Look up —
              </span>
              <input
                name="q"
                placeholder="a peptide, a brand, an indication"
                aria-label="Search the library"
                style={{
                  flex: 1,
                  font: 'inherit',
                  fontStyle: 'italic',
                  fontSize: 19,
                  minHeight: 32,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: INK,
                }}
              />
            </form>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px 14px',
                padding: '12px 0',
                fontFamily: JOST,
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
              }}
            >
              {chips.map((chip) => (
                <Link
                  key={chip.id ?? 'all'}
                  href={`/reference?cat=${chip.id}`}
                  style={{ color: INK2, whiteSpace: 'nowrap', textDecoration: 'none' }}
                >
                  {chip.name} <span style={{ fontFamily: MONO, color: INK3 }}>{chip.n}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LibraryChrome>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: JOST,
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: TEAL,
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
        alignItems: 'baseline',
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
