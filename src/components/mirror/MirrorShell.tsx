'use client'

// The Mirror's three horizontal bands.
//
//   Header  status dot, breadcrumb, ground toggle, tier toggle, Ledger, avatar
//   Stage   the field (flex 1 1 480px) and the panel (flex 1 1 360px)
//   Footer  ask bar, suggestion chips, hint
//
// RESPONSIVE WITH NO MEDIA QUERIES. The stage is a wrapping flex row: the panel
// sits as a right rail on desktop and stacks under the field below ~800px.
// Reproduce with flex-wrap, not breakpoints.

import type { ReactNode } from 'react'
import { GROUNDS, type Ground } from '@/lib/design/grounds'
import { useGround } from '@/components/GroundProvider'
import { VERIFY_TABS, type MirrorLayer, type VerifyTab } from '@/lib/mirror/useMirrorNav'

export interface Crumb {
  label: string
  onClick?: () => void
}

interface MirrorShellProps {
  crumbs: Crumb[]
  layer: MirrorLayer
  verifyTab: VerifyTab
  onSelectVerifyTab: (tab: VerifyTab) => void
  isFree: boolean
  onToggleTier: () => void
  onOpenLedger: () => void
  field: ReactNode
  panel: ReactNode
  footer: ReactNode
  ledger?: ReactNode
}

const LAYER_MARKS: ReadonlyArray<{ layer: MirrorLayer; label: string }> = [
  { layer: 1, label: 'WHOLE' },
  { layer: 2, label: 'REGION' },
  { layer: 3, label: 'MOLECULE' },
  { layer: 4, label: 'VERIFY' },
]

function GroundToggle() {
  const { ground, setGround } = useGround()
  return (
    <div className="flex">
      {GROUNDS.map((option: Ground) => {
        const active = option === ground
        return (
          <button
            key={option}
            type="button"
            onClick={() => setGround(option)}
            aria-pressed={active}
            className={`min-h-[44px] px-3 font-mono text-[10px] tracking-[0.12em] ${
              active ? 'bg-ink text-ground' : 'bg-panel text-dim hover:text-ink'
            }`}
          >
            {option.toUpperCase()}
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
  isFree,
  onToggleTier,
  onOpenLedger,
  field,
  panel,
  footer,
  ledger,
}: MirrorShellProps) {
  return (
    <div className="cx-surface relative flex h-screen flex-col overflow-hidden bg-ground font-sans text-ink">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-[18px] gap-y-[10px] border-b border-hair px-[14px] py-[9px]">
        <div className="flex min-w-0 flex-wrap items-center gap-[10px]">
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
                    className="font-mono text-[10px] tracking-[0.14em] text-dim hover:text-ink"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="font-mono text-[10px] tracking-[0.14em] text-ink">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          <GroundToggle />
          <div className="flex">
            <button
              type="button"
              onClick={onToggleTier}
              aria-pressed={isFree}
              className={`min-h-[44px] px-3 font-mono text-[10px] tracking-[0.12em] ${
                isFree ? 'bg-ink text-ground' : 'bg-panel text-dim hover:text-ink'
              }`}
            >
              FREE
            </button>
            <button
              type="button"
              onClick={onToggleTier}
              aria-pressed={!isFree}
              className={`min-h-[44px] px-3 font-mono text-[10px] tracking-[0.12em] ${
                !isFree ? 'bg-ink text-ground' : 'bg-panel text-dim hover:text-ink'
              }`}
            >
              PRO
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenLedger}
            className="min-h-[44px] px-3 font-mono text-[10px] tracking-[0.12em] text-dim hover:text-ink"
          >
            LEDGER
          </button>
        </div>
      </header>

      {/* ── Stage ──────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-wrap overflow-auto">
        <div className="relative flex h-full min-w-[300px] flex-[1_1_480px]">
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

        <aside className="min-w-[300px] max-w-[520px] flex-[1_1_360px] overflow-auto border-l border-hair">
          {layer === 4 && (
            <div className="flex flex-wrap border-b border-hair">
              {VERIFY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectVerifyTab(tab.id)}
                  aria-pressed={tab.id === verifyTab}
                  className={`min-h-[44px] flex-1 px-3 font-mono text-[10px] tracking-[0.14em] ${
                    tab.id === verifyTab ? 'bg-panelHi text-ink' : 'text-dim hover:text-ink'
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
      <footer className="flex-shrink-0 border-t border-hair">{footer}</footer>

      {/* The Ledger is full-bleed and deliberately styleless by comparison:
          the form is for understanding, the Ledger is for proving. */}
      {ledger}
    </div>
  )
}
