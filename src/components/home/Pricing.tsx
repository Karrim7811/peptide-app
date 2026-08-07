import Link from 'next/link'
import { MONTHLY_PRICE, annualPerMonth, annualSaving, money, priceFootnote, proCta } from '@/lib/pricing'

/**
 * Pricing teaser + closing CTA.
 *
 * The prototype's pricing block sold three tiers (Free / Pro $9.99mo / Lifetime
 * $99.99 once) — that model is superseded (see src/lib/pricing.ts: lifetime is
 * no longer sold, Pro is $14.99/mo or $119.88/yr with a one-month trial), and
 * the Mirror's real free-tier shape is "1 resolved compound" (see
 * src/lib/entitlement.ts), not "3 interaction checks/day". Every price and CTA
 * string below is derived from src/lib/pricing.ts rather than hardcoded, and
 * the feature bullets describe the current entitlement rules. This section
 * also serves as the page's closing call to action — the prototype has no
 * separate closing-CTA block after pricing, and its cards' CTAs already are
 * one (START FREE / the Pro trial CTA).
 */
export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-hair px-5 py-20">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-9">
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-faint">PRICING</span>
          <span className="font-sans text-[clamp(28px,4vw,48px)] font-extralight leading-[1.12] text-ink">
            Start free. Upgrade when it earns it.
          </span>
        </div>

        <div
          className="grid gap-px bg-hair"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {/* Free */}
          <div className="flex flex-col gap-[18px] bg-panel px-[26px] py-8">
            <span className="font-mono text-[10px] tracking-[0.22em] text-faint">FREE</span>
            <span className="font-sans text-[46px] font-extralight leading-none text-ink">$0</span>
            <div className="flex flex-col gap-2.5">
              <span className="text-[14.5px] leading-[1.7] text-dim">
                The full 58-compound library, evidence grades and sources
              </span>
              <span className="text-[14.5px] leading-[1.7] text-dim">
                Your stack, dose log, cycle and reconstitution maths
              </span>
              <span className="text-[14.5px] leading-[1.7] text-dim">
                One resolved compound — everything else stays visible
              </span>
            </div>
            <Link
              href="/signup"
              className="mt-auto flex min-h-11 items-center justify-center border border-hair font-mono text-[10px] tracking-[0.16em] text-dim hover:border-hue-cy hover:text-ink"
            >
              START FREE
            </Link>
          </div>

          {/* Pro */}
          <div
            className="flex flex-col gap-[18px] bg-panelHi px-[26px] py-8"
            style={{ borderLeft: '1px solid var(--accentDim)', borderRight: '1px solid var(--accentDim)' }}
          >
            <span className="font-mono text-[10px] tracking-[0.22em] text-accent">PRO</span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-[46px] font-extralight leading-none text-ink">
                {money(MONTHLY_PRICE)}
              </span>
              <span className="font-mono text-[11px] text-faint">/ month</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[14.5px] leading-[1.7] text-dim">Everything in Free</span>
              <span className="text-[14.5px] leading-[1.7] text-dim">
                Bloodwork that re-tunes the form
              </span>
              <span className="text-[14.5px] leading-[1.7] text-dim">
                Unlimited resolved compounds and unlimited Cortex
              </span>
            </div>
            <Link
              href="/pricing"
              className="mt-auto flex min-h-11 items-center justify-center bg-accent font-mono text-[10px] tracking-[0.16em] text-ground hover:bg-hue-cy"
            >
              {proCta('monthly')}
            </Link>
            <span className="font-mono text-[9.5px] leading-[1.6] tracking-[0.06em] text-faint">
              {priceFootnote('monthly')}
            </span>
          </div>
        </div>

        <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">
          Pay yearly instead and it works out to {money(annualPerMonth)}/mo — save{' '}
          {money(annualSaving)} · full plan details on the{' '}
          <Link href="/pricing" className="text-accent hover:text-hue-cy">
            pricing page
          </Link>
          .
        </span>
      </div>
    </section>
  )
}
