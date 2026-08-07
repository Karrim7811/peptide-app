'use client'

import Link from 'next/link'
import { useGround } from '@/components/GroundProvider'
import { GROUNDS, GROUND_DEFINITIONS } from '@/lib/design/grounds'

const NAV_LINKS = [
  { href: '#how', label: 'HOW IT WORKS' },
  { href: '#library', label: 'THE LIBRARY' },
  { href: '#pricing', label: 'PRICING' },
]

/**
 * Sticky marketing nav.
 *
 * Also carries the live ground switcher. The Home prototype
 * (design_handoff_peptide_cortex/Peptide Cortex Home.dc.html) has no "three
 * grounds" content section of its own — verified by grep, zero references to
 * ground/midnight/dusk/daylight anywhere in that file. Rather than invent a
 * marketing section and copy for one, the switcher is wired here with the
 * real `useGround()` hook and the real ground names/colours from
 * `src/lib/design/grounds.ts`. Every section on this page is built on the
 * ground-reactive tokens (`bg-ground`, `text-ink`, `--hue-*`, …), so toggling
 * this control actually re-themes the whole page live, not just the nav.
 */
export default function Nav() {
  const { ground, setGround } = useGround()

  return (
    <div
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 border-b border-hair px-5 py-2.5 backdrop-blur-[14px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}
    >
      <div className="flex items-center gap-[11px]">
        <span
          aria-hidden
          className="h-[7px] w-[7px] rounded-full bg-accent"
          style={{ boxShadow: '0 0 12px var(--accent)', animation: 'cxpulse 2.4s infinite' }}
        />
        <span className="font-mono text-xs tracking-[0.32em] text-ink">PEPTIDE CORTEX</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex min-h-11 items-center px-3 font-mono text-[10px] tracking-[0.16em] text-dim hover:text-ink"
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/login"
          className="flex min-h-11 items-center px-3 font-mono text-[10px] tracking-[0.16em] text-dim hover:text-ink"
        >
          LOG IN
        </Link>
        <Link
          href="/signup"
          className="ml-2 flex min-h-11 items-center bg-accent px-[18px] font-mono text-[10px] tracking-[0.16em] text-ground hover:bg-hue-cy"
        >
          CREATE ACCOUNT
        </Link>

        <div className="ml-2 flex items-center gap-1.5 pl-2" role="group" aria-label="Interface ground">
          {GROUNDS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGround(g)}
              aria-label={`Switch to ${g} ground`}
              aria-pressed={ground === g}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                aria-hidden
                className="h-3.5 w-3.5"
                style={{
                  background: GROUND_DEFINITIONS[g].vars['--bg'],
                  border: ground === g ? '1.5px solid var(--accent)' : '1px solid var(--hair)',
                  boxShadow: ground === g ? '0 0 8px var(--accent)' : 'none',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
