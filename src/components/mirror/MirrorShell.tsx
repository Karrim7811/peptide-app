'use client'

// The Mirror's chrome, in the V3 idiom.
//
//   Header   row 1 — brand, "The field · Free|Pro", Bench | Library | Shop ↗
//            row 2 — breadcrumb, ground switch, tier preview, Bloodwork, Ledger
//   Stage    the field (flex 1 1 480px) and the panel (flex 1 1 360px)
//   Footer   ask bar, suggestion chips, hint
//
// ── Why the ground is applied here and not on <html> ──────────────────────
//
// Every Mirror component reads var(--ink), var(--panel) and friends. The
// global GroundProvider writes those onto <html> and defaults to midnight,
// because the AI consent screen, the pricing page and the guides were designed
// dark and still read them. The Mirror is the surface that moved to V3, so it
// writes its OWN ground onto this root element — custom properties cascade, so
// every descendant (the overlays included; nothing here portals) resolves
// against it — and defaults to paper. Switching the ground in the Mirror does
// not touch the rest of the site, and vice versa.
//
// V3 structure: 1px ink rules, hairline dividers, zero radius, no shadows.
// Everything below is still expressed in ground tokens, so the dark grounds
// keep working; on paper the tokens resolve to the V3 palette exactly.
//
// RESPONSIVE. The stage is a wrapping flex row: the panel sits as a right rail
// on desktop and stacks under the field below ~800px. Below md (768px) the
// shell also stops being a 100vh app frame: the page scrolls like any other,
// the field is capped at 40vh so the panel (the add form, LOG A DOSE) is one
// short scroll away instead of below a full-height canvas, and the ground and
// tier switches are hidden — the ground is a desktop nicety and the tier
// preview is an owner's tool. From md up nothing here changes.

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { MIRROR_GROUNDS, groundVars, type Ground } from '@/lib/design/grounds'
import { VERIFY_TABS, type MirrorLayer, type VerifyTab } from '@/lib/mirror/useMirrorNav'
import { NAV_LINK } from '@/components/nav/PrimaryNav'

export interface Crumb {
  label: string
  onClick?: () => void
}

interface MirrorShellProps {
  crumbs: Crumb[]
  layer: MirrorLayer
  verifyTab: VerifyTab
  onSelectVerifyTab: (tab: VerifyTab) => void
  ground: Ground
  onSelectGround: (ground: Ground) => void
  isFree: boolean
  /**
   * Whether to offer the tier switch at all. Only a Pro user may preview the
   * free surface — offering a free user a switch to Pro would advertise a
   * bypass, even though the real gate is server-side.
   */
  canPreviewFree: boolean
  onToggleTier: () => void
  onOpenLedger: () => void
  onOpenBloodwork: () => void
  field: ReactNode
  panel: ReactNode
  footer: ReactNode
  ledger?: ReactNode
}

const LAYER_MARKS: ReadonlyArray<{ layer: MirrorLayer; label: string }> = [
  { layer: 1, label: 'WHOLE' },
  { layer: 2, label: 'GOAL' },
  { layer: 3, label: 'MOLECULE' },
  { layer: 4, label: 'VERIFY' },
]

/** V3 label: Jost, 10.5px, .26em, uppercase. */
const KICKER = 'font-sans text-[10.5px] uppercase tracking-[0.26em]'

/** A 44px-tall control in the header's second row. */
const CONTROL = 'flex min-h-[44px] items-center px-3 font-mono text-[12px] tracking-[0.12em] md:text-[10px]'

function Segmented<T extends string>({
  options,
  value,
  onSelect,
  label,
  title,
}: {
  options: readonly T[]
  value: T
  onSelect: (next: T) => void
  label: (option: T) => string
  title?: string
}) {
  return (
    <div className="flex border border-hair" role="group" title={title}>
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            aria-pressed={active}
            className={`${CONTROL} ${active ? 'bg-ink text-ground' : 'text-dim hover:text-ink'}`}
          >
            {label(option)}
          </button>
        )
      })}
    </div>
  )
}

export default function MirrorShell({
  crumbs,
  layer,
  verifyTab,
  onSelectVerifyTab,
  ground,
  onSelectGround,
  isFree,
  canPreviewFree,
  onToggleTier,
  onOpenLedger,
  onOpenBloodwork,
  field,
  panel,
  footer,
  ledger,
}: MirrorShellProps) {
  return (
    <div
      className="cx-surface relative flex min-h-screen flex-col bg-ground font-display text-ink md:h-screen md:overflow-hidden"
      style={groundVars(ground) as CSSProperties}
      data-ground={ground}
    >
      {/* ── Header · row 1: the site's chrome ─────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-ink">
        <div className="flex flex-wrap items-center gap-x-[clamp(10px,2vw,28px)] px-[clamp(16px,3vw,32px)] py-1 md:gap-y-2 md:py-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center gap-[9px] whitespace-nowrap text-ink no-underline md:min-h-0"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-accent" aria-hidden />
            <span className="text-[15px] font-medium tracking-[0.22em]">PEPTIDE CORTEX</span>
          </Link>
          <span className={`${KICKER} whitespace-nowrap text-faint`}>
            The field · {isFree ? 'Free' : 'Pro'}
          </span>
          <nav
            aria-label="Site"
            className="ml-auto flex flex-wrap items-center gap-x-[clamp(12px,2vw,24px)] font-sans text-[12px] uppercase tracking-[0.26em] md:gap-y-2 md:text-[10.5px]"
          >
            <Link
              href="/dashboard"
              aria-current="page"
              className={`${NAV_LINK} text-ink`}
            >
              <span className="border-b border-ink">Bench</span>
            </Link>
            <Link href="/reference" className={`${NAV_LINK} text-dim`}>
              Library
            </Link>
            <Link href="/shop" className={`${NAV_LINK} text-dim`}>
              Shop ↗
            </Link>
          </nav>
        </div>

        {/* ── Header · row 2: the Mirror's own controls ───────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-x-[18px] gap-y-2 border-t border-hair px-[clamp(16px,3vw,32px)]">
          <div className="flex min-w-0 flex-wrap items-center gap-[10px]">
            {/* The way home, where the eye already is. The header's BENCH link
                sits in the far corner and people did not find it. */}
            <Link
              href="/dashboard"
              className="mr-[6px] flex min-h-[44px] items-center border-r border-hair pr-[16px] font-mono text-[12px] tracking-[0.14em] text-accent hover:text-ink md:text-[10px]"
            >
              ← YOUR BENCH
            </Link>
            <span
              className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-hue-cy"
              style={{ animation: 'cxpulse 2.4s ease-in-out infinite' }}
              aria-hidden
            />
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-[8px]">
              {crumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex items-center gap-[8px]">
                  {i > 0 && <span className="font-mono text-[10px] text-faintest">/</span>}
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="min-h-[44px] font-mono text-[12px] tracking-[0.14em] text-dim hover:text-ink md:text-[10px]"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="font-mono text-[12px] tracking-[0.14em] text-ink md:text-[10px]">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-[10px] py-[6px]">
            {/* Ground and tier preview: desktop only (see the header note). */}
            <div className="hidden flex-wrap items-center gap-[10px] md:flex">
            <Segmented
              options={MIRROR_GROUNDS}
              value={ground}
              onSelect={onSelectGround}
              label={(option) => option.toUpperCase()}
              title="Ground"
            />
            {canPreviewFree ? (
              <Segmented
                options={['FREE', 'PRO'] as const}
                value={isFree ? 'FREE' : 'PRO'}
                onSelect={(next) => {
                  if ((next === 'FREE') !== isFree) onToggleTier()
                }}
                label={(option) => option}
                title="Preview the free surface"
              />
            ) : (
              <span className="font-mono text-[10px] tracking-[0.12em] text-faintest">FREE</span>
            )}
            </div>
            <button type="button" onClick={onOpenBloodwork} className={`${CONTROL} text-dim hover:text-ink`}>
              BLOODWORK
            </button>
            <button type="button" onClick={onOpenLedger} className={`${CONTROL} text-dim hover:text-ink`}>
              LEDGER
            </button>
          </div>
        </div>
      </header>

      {/* ── Stage ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-wrap md:min-h-0 md:overflow-auto">
        <div className="relative flex h-[40vh] min-w-[300px] flex-[1_1_480px] md:h-full">
          {field}
          {/* Zoom rail — marks the current layer, WHOLE at top, MOLECULE at foot. */}
          <div
            className="pointer-events-none absolute right-0 top-0 flex h-full w-[34px] flex-col items-center justify-center gap-3"
            aria-hidden
          >
            {LAYER_MARKS.map((mark) => (
              <span
                key={mark.layer}
                className={`h-[6px] w-[6px] rotate-45 border ${
                  mark.layer === layer ? 'border-ink bg-ink' : 'border-faintest'
                }`}
              />
            ))}
          </div>
        </div>

        <aside className="min-w-[300px] max-w-full flex-[1_1_360px] border-t border-ink bg-panel md:max-w-[520px] md:overflow-auto md:border-l md:border-t-0">
          {layer === 4 && (
            <div className="flex flex-wrap border-b border-hair">
              {VERIFY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectVerifyTab(tab.id)}
                  aria-pressed={tab.id === verifyTab}
                  className={`min-h-[44px] flex-1 px-3 font-mono text-[10px] tracking-[0.14em] ${
                    tab.id === verifyTab
                      ? 'border-b border-ink bg-panelHi text-ink'
                      : 'border-b border-transparent text-dim hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {panel}
        </aside>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 border-t border-ink">{footer}</footer>

      {/* The Ledger is full-bleed and deliberately styleless by comparison:
          the form is for understanding, the Ledger is for proving. */}
      {/* On phones the page scrolls, so an overlay pinned to this root could
          open above the fold; pin it to the viewport instead. The wrapper
          takes no clicks itself — only the overlay inside it does. */}
      <div className="pointer-events-none fixed inset-0 z-20 md:absolute [&>*]:pointer-events-auto">
        {ledger}
      </div>
    </div>
  )
}
