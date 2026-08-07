'use client'

import { Loader2 } from 'lucide-react'
import FeatureList from './FeatureList'
import { PRO_FEATURES } from './content'
import {
  TRIAL_MONTHS,
  priceLabel,
  priceUnit,
  priceEquivalent,
  priceFootnote,
  proCta,
  saveLabel,
  trialNote,
  type BillingCycle,
} from '@/lib/pricing'

// Ports the Pro plan card — prototype lines 81-112. Every price-bearing
// string comes from `src/lib/pricing.ts`; nothing here is a literal number.

interface ProCardProps {
  cycle: BillingCycle
  loading: boolean
  onUpgrade: () => void
}

export default function ProCard({ cycle, loading, onUpgrade }: ProCardProps) {
  const isAnnual = cycle === 'annual'
  const equivalent = priceEquivalent(cycle)

  return (
    <div
      className="flex flex-1 flex-col gap-6 bg-panelHi p-8"
      style={{
        minWidth: 280,
        flexBasis: 320,
        borderTop: '2px solid var(--accent)',
        animation: 'cxup 560ms cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] tracking-[0.26em] text-accent">PRO</span>
          {isAnnual && (
            <span
              className="font-mono text-[9px] tracking-[0.14em] text-gold"
              style={{ border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)', padding: '5px 8px' }}
            >
              {saveLabel}
            </span>
          )}
        </div>
        {/* The headline is the amount actually charged — see priceLabel(). On
            annual that is $119.88/yr, with the monthly equivalent restated
            below rather than standing in for it. */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-sans text-[52px] font-extralight leading-none text-ink">
            {priceLabel(cycle)}
          </span>
          <span className="font-mono text-[11px] text-faint">{priceUnit(cycle)}</span>
        </div>
        {equivalent && (
          <span className="font-mono text-[11px] tracking-[0.08em] text-dim">{equivalent}</span>
        )}
        <span className="font-mono text-[10px] tracking-[0.1em] text-faint">{priceFootnote(cycle)}</span>
        <span className="text-[14.5px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          Every compound resolved, weighed against each other, and read against your bloodwork.
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onUpgrade}
          disabled={loading}
          className="flex min-h-[52px] items-center justify-center gap-2 bg-accent font-mono text-[10.5px] tracking-[0.16em] text-ground disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> PROCESSING…
            </>
          ) : (
            proCta(cycle)
          )}
        </button>
        {TRIAL_MONTHS > 0 && (
          <span className="text-[13px] leading-[1.7] text-faint" style={{ textWrap: 'pretty' }}>
            {trialNote}
          </span>
        )}
      </div>

      <FeatureList features={PRO_FEATURES} />
    </div>
  )
}
