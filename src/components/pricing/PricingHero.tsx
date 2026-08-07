import { COUNTS } from '@/lib/catalog'
import type { BillingCycle } from '@/lib/pricing'
import BillingToggle from './BillingToggle'

// Ports the hero band — prototype lines 43-55. Two decorative layers behind
// the copy: a breathing radial glow (`cxbreathe`, matches `pbreathe`) and a
// drifting dot texture (`cxdriftB`, matches `pdriftB`), both masked to an
// ellipse over the headline. Colours come from the ground's glow/dot tokens,
// not the prototype's hardcoded rgba — same visual weight, ground-reactive.

interface PricingHeroProps {
  cycle: BillingCycle
  onChangeCycle: (cycle: BillingCycle) => void
}

export default function PricingHero({ cycle, onChangeCycle }: PricingHeroProps) {
  return (
    <div className="relative flex flex-col items-center gap-6 overflow-hidden px-5 pb-10 pt-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 50% 60% at 50% 30%, var(--glowA), transparent 70%), radial-gradient(ellipse 30% 40% at 32% 22%, var(--glowB), transparent 68%)',
          animation: 'cxbreathe 11s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--dotA) 0.9px, transparent 1.1px)',
          backgroundSize: '9px 9px',
          opacity: 0.34,
          animation: 'cxdriftB 34s linear infinite alternate',
          maskImage:
            'radial-gradient(ellipse 46% 56% at 50% 28%, #000 6%, rgba(0,0,0,0.4) 40%, transparent 76%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 46% 56% at 50% 28%, #000 6%, rgba(0,0,0,0.4) 40%, transparent 76%)',
        }}
      />

      <span className="relative font-mono text-[10px] tracking-[0.32em] text-accent">PRICING</span>
      <span className="relative max-w-[760px] font-display text-[clamp(34px,5vw,58px)] font-light leading-[1.1] text-ink" style={{ textWrap: 'pretty' }}>
        The library is free. Reading your own stack is what you pay for.
      </span>
      <span className="relative max-w-[580px] text-base leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
        All {COUNTS.compounds} compounds, every evidence grade and every source stay open at both
        tiers. Pro is for when the form has to weigh your compounds against each other.
      </span>

      <BillingToggle cycle={cycle} onChange={onChangeCycle} />
    </div>
  )
}
