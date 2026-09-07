// Refund policy.
//
// Copy from the V3 design handoff, approved 2026-09-06. The wording is shared
// with checkout through src/lib/legal.ts so the two cannot drift — a refund
// policy that says one thing at the point of sale and another on its own page
// is a discrepancy that gets read against you.
//
// The [ Draft · under legal review ] tag is deliberate and stays until the
// attorney review in CLAUDE.md §16.12 happens. Presenting an unreviewed draft
// as settled policy is the failure mode; saying it is a draft is not.

import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { REFUND_POLICY, REFUND_STATUS, SUPPORT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Refund policy · Peptide Cortex',
  description:
    'Unopened vials with the cold-chain seal intact, within 14 days of delivery. Refunds handled by hand.',
}

export default function RefundPolicyPage() {
  return (
    <LegalPage
      current="refund"
      kicker="Refund policy"
      title="Refunds are handled by hand."
      meta={`[ ${REFUND_STATUS} ] · shop and subscription`}
      lede={REFUND_POLICY}
      sections={[
        ['Shop', 'Unopened vials, cold-chain seal intact, within 14 days of delivery: full refund including original shipping. Opened vials cannot be returned.'],
        ['How', `Email ${SUPPORT_EMAIL} with your order reference (the four-character code from checkout). We confirm within one business day and refund the way you paid — to your Zelle account or your wallet.`],
        ['Why by hand', 'Neither payment rail has a card issuer behind it, so there is no chargeback. The policy is written down here and shown at checkout so it does not depend on one.'],
        ['Pro', 'Monthly: cancel within 7 days of a charge for a full refund. Yearly: 14 days. Cancelling stops future charges; the bench stays readable.'],
      ]}
    />
  )
}
