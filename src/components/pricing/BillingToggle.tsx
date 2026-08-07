'use client'

import type { BillingCycle } from '@/lib/pricing'
import { annualSavingPct } from '@/lib/pricing'

// Ports the monthly/annual tab pair — prototype lines 51-54 (`tab()` style
// factory in `renderVals()`). Selected tab: white fill, ground-colour text.
// Unselected: panel fill, dim text.

interface BillingToggleProps {
  cycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export default function BillingToggle({ cycle, onChange }: BillingToggleProps) {
  return (
    <div className="relative mt-1.5 flex items-center gap-px bg-hair">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        aria-pressed={cycle === 'monthly'}
        className={`flex min-h-[44px] items-center px-4 font-mono text-[10px] tracking-[0.14em] ${
          cycle === 'monthly' ? 'bg-ink text-ground' : 'bg-panel text-dim'
        }`}
      >
        MONTHLY
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        aria-pressed={cycle === 'annual'}
        className={`flex min-h-[44px] items-center px-4 font-mono text-[10px] tracking-[0.14em] ${
          cycle === 'annual' ? 'bg-ink text-ground' : 'bg-panel text-dim'
        }`}
      >
        ANNUAL · SAVE {annualSavingPct}%
      </button>
    </div>
  )
}
