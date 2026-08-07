'use client'

import { useState } from 'react'
import type { BillingCycle } from '@/lib/pricing'
import PricingNav from '@/components/pricing/PricingNav'
import PricingHero from '@/components/pricing/PricingHero'
import PlanCards from '@/components/pricing/PlanCards'
import FreeTierDiagram from '@/components/pricing/FreeTierDiagram'
import SafetyBlock from '@/components/pricing/SafetyBlock'
import FaqAccordion from '@/components/pricing/FaqAccordion'
import ClosingCta from '@/components/pricing/ClosingCta'
import LegalFooter from '@/components/pricing/LegalFooter'

// Peptide Cortex — Pricing screen, "Mirror" redesign.
// Ports design_handoff_peptide_cortex/Peptide Cortex Pricing.dc.html.
// Sections top to bottom match the prototype: nav, hero + billing toggle,
// plan cards, free-tier diagram, safety-never-paywalled block, FAQ
// accordion, closing CTA, legal footer.
//
// The selected billing cycle is what gets purchased. `ProPlan` carries an
// 'annual' arm and the checkout route fails closed with PLAN_UNAVAILABLE if the
// matching Stripe price is not configured — it will never quietly substitute a
// different price than the one the customer chose.
//
// OPERATIONAL PREREQUISITE: annual needs a live Stripe price behind
// STRIPE_PRO_ANNUAL_PRICE_ID ($119.88/yr). Until that exists, picking ANNUAL
// surfaces an error instead of checking out.
export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: cycle === 'annual' ? 'annual' : 'monthly' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        window.location.href = '/login?next=/pricing'
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cx-surface flex min-h-screen flex-col bg-ground font-sans text-ink">
      <PricingNav />
      <PricingHero cycle={cycle} onChangeCycle={setCycle} />
      <PlanCards cycle={cycle} loading={loading} onUpgrade={handleUpgrade} />
      {error && (
        <p
          role="alert"
          className="mx-auto max-w-2xl border-l-2 border-gold bg-panelHot px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
        >
          {error}
        </p>
      )}
      <FreeTierDiagram />
      <SafetyBlock />
      <FaqAccordion />
      <ClosingCta />
      <LegalFooter />
    </div>
  )
}
