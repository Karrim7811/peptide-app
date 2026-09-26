'use client'

// The primary menu for the paper (V3 light) chromes: LibraryChrome, ShopChrome
// and Home. The Mirror draws the same three links in ground tokens (it can be
// dark), from the same `primaryNav()` list.
//
// The active section comes from the URL, not from whichever chrome happens to
// be rendering — the bench, the checker and bloodwork all sit inside
// LibraryChrome and used to be marked "Library" for that reason alone.
//
// Phones: every link is at least 44px tall and 12px type. From md up the
// header keeps its original 10.5px label size and compact height.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { SECTION_LABEL, primaryNav, sectionFor, type Section } from '@/lib/nav'

const INK = '#1A1D1F'
const INK3 = '#7E878E'

/** Link sizing shared by every item in a paper header. */
export const NAV_LINK =
  'inline-flex min-h-[44px] items-center whitespace-nowrap text-[12px] md:min-h-0 md:text-[10.5px]'

/** Font, tracking and case for a paper header item. */
export const NAV_TYPE: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  letterSpacing: '.26em',
  textTransform: 'uppercase',
  textDecoration: 'none',
}

export function useSection(override?: Section | null): Section | null {
  const pathname = usePathname()
  return override !== undefined ? override : sectionFor(pathname)
}

/** "The bench" / "The library" / "The shop" beside the wordmark. */
export function SectionLabel({ section }: { section?: Section | null }) {
  const current = useSection(section)
  if (!current) return null
  return (
    <span
      className="text-[10.5px]"
      style={{ ...NAV_TYPE, color: INK3, marginLeft: 6, whiteSpace: 'nowrap' }}
    >
      {SECTION_LABEL[current]}
    </span>
  )
}

export function PrimaryNav({
  signedIn,
  section,
  children,
}: {
  signedIn: boolean
  /** Force the active section; by default it is read from the URL. */
  section?: Section | null
  /** Extra items after the three primary links (orders, cart). */
  children?: ReactNode
}) {
  const current = useSection(section)
  return (
    <nav
      aria-label="Site"
      style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        columnGap: 'clamp(14px,2vw,24px)',
        flexWrap: 'wrap',
      }}
    >
      {primaryNav().map((item) => {
        const active = item.section === current
        return (
          <Link
            key={item.section}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={NAV_LINK}
            style={{ ...NAV_TYPE, color: active ? INK : INK3 }}
          >
            <span style={{ borderBottom: active ? `1px solid ${INK}` : '1px solid transparent' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
      {children}
      {!signedIn && (
        <Link href="/login" className={NAV_LINK} style={{ ...NAV_TYPE, color: INK }}>
          <span style={{ borderBottom: `1px solid ${INK}` }}>Sign in</span>
        </Link>
      )}
    </nav>
  )
}
