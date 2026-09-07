// Terms of use.
//
// Copy from the V3 design handoff, approved 2026-09-06. It replaces wording
// that predated the shop and so described neither orders nor either payment
// rail. The framing is unchanged and load-bearing: educational reference, not
// medical advice, adults only, research use.

import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { LEGAL_EFFECTIVE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Terms of use · Peptide Cortex',
  description:
    'Educational reference, not medical advice. Adults 18+. Research peptides sold for research and reference purposes only.',
}

export default function TermsPage() {
  return (
    <LegalPage
      current="terms"
      kicker="Terms of use"
      title="Educational reference. Not medical advice."
      meta={`Effective ${LEGAL_EFFECTIVE} · applies to the library, the bench and the shop`}
      lede="Peptide Cortex publishes reference material about research peptides and sells research peptides to adults in the United States. Nothing here is a recommendation to use anything on a person or an animal."
      sections={[
        ['Who', 'Adults 18 and over. Date of birth is collected at signup and checked again at checkout; accounts and orders that fail either check are refused.'],
        ['The library', 'Every entry is reference material. Where the source data states that no human dose is established, the page says exactly that and nothing is filled in.'],
        ['The math', 'The math panel describes solution chemistry — what a vial contains once water is added. It is not a dosing tool and issues no instruction to the reader.'],
        ['The shop', 'Peptides are sold for research and reference purposes only, not for human consumption. Independent lab assays are published per batch; where an assay is pending the product says so.'],
        ['Subscriptions', 'Pro is billed monthly or yearly after a one-month free trial. The amount, frequency and cancellation method are shown before payment and can be cancelled at any time from the account.'],
        ['Liability', 'The reference is provided as-is. Consult a licensed physician before any medical decision.'],
      ]}
    />
  )
}
