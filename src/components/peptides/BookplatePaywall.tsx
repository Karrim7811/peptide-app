'use client'

// Ornate brass-bordered "bookplate" paywall card. Visual placeholder
// only — gating logic and Stripe wiring deferred to Phase 2.

export default function BookplatePaywall() {
  return (
    <div className="relative my-20">
      {/* outer ornate frame */}
      <div className="relative border border-apo-brass/50 p-6 md:p-10">
        {/* corner ornaments */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* inner hairline frame */}
        <div className="border border-apo-brass/30 p-6 md:p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass mb-6">
            Ex Libris · Membership
          </p>

          <h2 className="font-display text-4xl md:text-5xl font-light italic text-apo-ink leading-tight">
            Continue your study
          </h2>

          <div className="mx-auto my-6 h-px w-16 bg-apo-brass" />

          <p className="font-display text-lg md:text-xl text-apo-ink/80 leading-relaxed max-w-md mx-auto">
            Members of the Cortex library access full dosing protocols,
            reconstitution math, stacking guidance, and the complete safety
            matrix — for every compound in the bible.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-md mx-auto">
            <PlanCard
              tier="Monthly"
              price="$9.99"
              suffix="/ month"
              note="Cancel any time"
              primary={false}
            />
            <PlanCard
              tier="Lifetime"
              price="$99.99"
              suffix="once"
              note="One payment. Always."
              primary
            />
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-specimen-caps text-apo-mute/70">
            For research & reference · Not medical advice
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  tier,
  price,
  suffix,
  note,
  primary,
}: {
  tier: string
  price: string
  suffix: string
  note: string
  primary: boolean
}) {
  return (
    <button
      type="button"
      className={[
        'group relative border p-5 text-left transition-colors duration-300',
        primary
          ? 'border-apo-brass bg-apo-brass/5 hover:bg-apo-brass/10'
          : 'border-apo-brass/40 hover:border-apo-brass',
      ].join(' ')}
    >
      <div className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass">
        {tier}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl text-apo-ink">{price}</span>
        <span className="font-mono text-xs text-apo-mute">{suffix}</span>
      </div>
      <div className="mt-3 font-display italic text-sm text-apo-mute">{note}</div>
      <div className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-apo-neural">
        Join
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </button>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-4 h-4 border-apo-brass'
  const map: Record<string, string> = {
    tl: '-top-px -left-px border-t border-l',
    tr: '-top-px -right-px border-t border-r',
    bl: '-bottom-px -left-px border-b border-l',
    br: '-bottom-px -right-px border-b border-r',
  }
  return <span className={`${base} ${map[pos]}`} aria-hidden />
}
