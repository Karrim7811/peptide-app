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
// unchanged, and the routes that redirect into it (/stack, /log, /cycle,
// /sites, /inventory, /notes, /reminders, /side-effects, /reconstitution,
// /welcome) were repointed there with their query params intact.
//
// /checker and /bloodwork were among them and are now real screens of their
// own, so ten routes still redirect rather than twelve.
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
import { AddVialTile, BenchVial } from '@/components/bench/BenchVial'
import { loginUrl } from '@/lib/auth/next'
import { benchView } from '@/lib/bench'
import { COMPOUND_LIST } from '@/lib/catalog'
import { categoryChips } from '@/lib/library'
import { resolveCompoundId } from '@/lib/mirror/mapping'
import { isAdminUserId } from '@/lib/shop/admin-id'
import { ANNUAL_PRICE, MONTHLY_PRICE, money, priceFootnote, proCta } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'The bench · Peptide Cortex' }

type Tool = [href: string, name: string, what: string]

/** Where the Mirror's capabilities live now, and what each one is. */
const TOOLS: Tool[] = [
  ['/mirror', 'The field', 'Your stack, dose log, cycles, sites and notes. Everything you can edit.'],
  ['/checker', 'Interactions', 'Any two things compared. Free, three checks a day.'],
  ['/dosing', 'Dosing reference', 'What the label or the trial says, with its source. Never gated.'],
  ['/bloodwork', 'Bloodwork', 'Your markers across panels. Pro.'],
  ['/protocol', 'Protocol planner', 'A week drafted around the bench. Pro.'],
  ['/scanner', 'Vial scanner', 'Photograph a shelf and check the reading. Pro.'],
]

// The order queue had no link anywhere in the app — /admin/orders was reachable
// only by typing it, which is how the operator ends up believing the route is
// broken when it is merely unlinked. It renders here for the one account whose
// id matches SHOP_ADMIN_USER_ID and for nobody else. This is a convenience, not
// a gate: the real check is server-side in /admin/orders and in every action it
// calls, and an unset variable means no admin, so the row simply never appears.
const ADMIN_TOOL: Tool = [
  '/admin/orders',
  'Order queue',
  'Confirm Zelle payments, record lots, ship. Admin only.',
]

export default async function BenchPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // /dashboard is also DEFAULT_NEXT, so loginUrl() omits the parameter here;
  // written through the helper anyway so every gate reads the same.
  if (!user) redirect(loginUrl('/dashboard'))

  const isPro = await isProUser()

  const tools = isAdminUserId(user.id) ? [...TOOLS, ADMIN_TOOL] : TOOLS

  const [{ data: stackRows }, { data: inventoryRows }] = await Promise.all([
    supabase
      .from('stack_items')
      .select('id, name, dose, unit, notes, active')
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
      notes: row.notes,
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
              alignItems: 'flex-start',
              gap: 'clamp(14px,2.4vw,30px)',
              flexWrap: 'wrap',
            }}
          >
            {view.vials.map((vial) => (
              <BenchVial key={vial.id} vial={vial} />
            ))}
            <AddVialTile />
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
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto auto',
                gap: '0 14px',
                padding: '12px 0',
                borderBottom: HAIR,
                alignItems: 'baseline',
              }}
            >
              <Link href={row.href} style={{ minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
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
              </Link>
              <span
                style={{ fontFamily: MONO, fontSize: 13, color: INK2, whiteSpace: 'nowrap' }}
              >
                {row.right}
              </span>
              <Link
                href={row.editHref}
                style={{
                  fontFamily: JOST,
                  fontSize: 10,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: INK,
                  textDecoration: 'underline',
                }}
              >
                Edit
              </Link>
            </div>
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

          {view.rows.length > 0 && (
            <p style={{ margin: '14px 0 0', fontSize: 16 }}>
              <Link href="/mirror" style={{ color: INK, textDecoration: 'underline' }}>
                + Add a peptide
              </Link>
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
          {tools.map(([href, name, what]) => (
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
