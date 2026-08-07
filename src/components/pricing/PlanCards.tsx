import FreeCard from './FreeCard'
import ProCard from './ProCard'
import type { BillingCycle } from '@/lib/pricing'

// Ports the two-card divider grid — prototype lines 57-113. The 1px gap
// between cards is a `--hair` background showing through, not a border.

interface PlanCardsProps {
  cycle: BillingCycle
  loading: boolean
  onUpgrade: () => void
}

export default function PlanCards({ cycle, loading, onUpgrade }: PlanCardsProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-wrap gap-px border border-hair bg-hair px-5 pb-5">
      <FreeCard />
      <ProCard cycle={cycle} loading={loading} onUpgrade={onUpgrade} />
    </div>
  )
}
