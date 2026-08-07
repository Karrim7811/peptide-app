import Link from 'next/link'
import FeatureList from './FeatureList'
import { FREE_FEATURES } from './content'

// Ports the Free plan card — prototype lines 59-79. `freeSummary` verbatim.

export default function FreeCard() {
  return (
    <div
      className="flex flex-1 flex-col gap-6 bg-ground p-8"
      style={{ minWidth: 280, flexBasis: 320, animation: 'cxup 460ms cubic-bezier(.2,.7,.2,1) both' }}
    >
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-[10px] tracking-[0.26em] text-faint">FREE</span>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[52px] font-extralight leading-none text-ink">$0</span>
          <span className="font-mono text-[11px] text-faint">forever</span>
        </div>
        <span className="text-[14.5px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          The whole reference library, one compound of your own resolved on the form.
        </span>
      </div>

      <Link
        href="/signup"
        className="flex min-h-[52px] items-center justify-center border border-hair font-mono text-[10.5px] tracking-[0.16em] text-ink"
      >
        START FREE →
      </Link>

      <FeatureList features={FREE_FEATURES} />
    </div>
  )
}
