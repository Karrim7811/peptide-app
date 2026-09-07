// The library.
//
// Free to read, no account. Principle 2 of the V3 design, and the home page
// sells it in exactly those words — until this commit /reference redirected to
// /login, so the most public page on the site promised something the next click
// refused.
//
// Server-rendered from the query string. Search and the category filter are a
// GET form and a set of links, so the whole thing works with JavaScript off and
// every result list has a URL someone can send to someone else.

import Link from 'next/link'
import type { Metadata } from 'next'
import {
  HAIR,
  INK,
  INK2,
  INK3,
  JOST,
  KICKER,
  LibraryChrome,
  MONO,
  RULE,
} from '@/components/library/LibraryChrome'
import { categoryChips, searchLibrary } from '@/lib/library'
import { doseCounts } from '@/lib/dosing'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The library · Peptide Cortex',
  description:
    'A reference on 124 peptides, graded by evidence rather than enthusiasm. Free to read, no account needed.',
}

export default async function ReferencePage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string }
}) {
  const query = (searchParams.q ?? '').slice(0, 100)
  const category = searchParams.cat ?? null

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const chips = categoryChips()
  const active = chips.find((chip) => chip.id === category) ?? chips[0]
  const results = searchLibrary(query, active.id)
  const counts = doseCounts()

  const href = (cat: string | null) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (cat) params.set('cat', cat)
    const qs = params.toString()
    return qs ? `/reference?${qs}` : '/reference'
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
            ...KICKER,
            color: '#1A8A9E',
          }}
        >
          <span>The reference</span>
          <span style={{ color: INK3 }}>
            {results.length} of {chips[0].n} · {active.name}
            {query ? ` · “${query}”` : ''}
          </span>
        </div>

        <form
          action="/reference"
          method="get"
          style={{
            marginTop: 16,
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
            placeholder="a peptide, a brand name, an indication"
            aria-label="Search the library"
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
          {/* Preserves the category when searching within it. */}
          {active.id && <input type="hidden" name="cat" value={active.id} />}
          {query && (
            <Link
              href={href(active.id)}
              style={{
                fontFamily: JOST,
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: INK3,
                textDecoration: 'none',
              }}
            >
              Clear
            </Link>
          )}
        </form>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 14px',
            padding: '12px 0 0',
            fontFamily: JOST,
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
          }}
        >
          {chips.map((chip) => (
            <Link
              key={chip.id ?? 'all'}
              href={href(chip.id)}
              style={{
                color: chip.id === active.id ? INK : INK2,
                borderBottom: `1px solid ${chip.id === active.id ? INK : 'transparent'}`,
                paddingBottom: 1,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              {chip.name} <span style={{ fontFamily: MONO, color: INK3 }}>{chip.n}</span>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: 'clamp(16px,2vw,24px) clamp(16px,3vw,32px) clamp(24px,3vw,40px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) auto auto',
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
          <span>Peptide · category</span>
          <span style={{ textAlign: 'right' }}>Grade</span>
          <span style={{ textAlign: 'right' }}>CV</span>
        </div>

        {results.map((row) => (
          <Link
            key={row.id}
            href={row.href}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto auto',
              gap: '0 clamp(12px,2vw,24px)',
              alignItems: 'baseline',
              padding: '12px 0',
              borderBottom: HAIR,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ fontSize: 22, lineHeight: 1.1 }}>{row.name}</span>
              {row.brand && (
                <span
                  style={{ fontSize: 15, fontStyle: 'italic', color: INK2, marginLeft: 10 }}
                >
                  {row.brand}
                </span>
              )}
              <span
                style={{
                  display: 'block',
                  marginTop: 4,
                  fontFamily: JOST,
                  fontSize: 10,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: INK3,
                }}
              >
                {row.category} · {row.purpose}
              </span>
            </span>
            <span
              style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, textAlign: 'right' }}
            >
              {row.grade}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 14,
                color: INK2,
                textAlign: 'right',
                minWidth: 36,
              }}
            >
              {row.cv}
            </span>
          </Link>
        ))}

        {results.length === 0 && (
          <p style={{ margin: '18px 0 0', fontSize: 20, fontStyle: 'italic', lineHeight: 1.3 }}>
            Nothing in the library matches “{query}”. Search covers names, brand names and
            indications.
          </p>
        )}

        <p
          style={{
            margin: '18px 0 0',
            fontFamily: JOST,
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: INK3,
            lineHeight: 1.8,
          }}
        >
          Grade maps one-to-one from regulatory status. CV is a cardiovascular score, 0–5, on
          its own axis; it never moves a grade. {counts.none} of {counts.total} entries state
          that no human dose is established.
        </p>
      </div>
    </LibraryChrome>
  )
}
