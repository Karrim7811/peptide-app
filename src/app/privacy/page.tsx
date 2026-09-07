// Privacy notice.
//
// Copy from the V3 design handoff, approved 2026-09-06.
//
// Two claims here are enforced elsewhere in the codebase rather than merely
// asserted: bench data is protected by row-level security (supabase/*.sql), and
// there is genuinely no analytics SDK in the tree. If either changes, this page
// becomes false and has to change with it.

import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { LEGAL_EFFECTIVE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Privacy notice · Peptide Cortex',
  description: 'What Peptide Cortex stores, and why. No trackers, no advertising pixels.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      kicker="Privacy notice"
      title="What we store, and why."
      meta={`Effective ${LEGAL_EFFECTIVE} · US only`}
      lede="We keep the minimum needed to run an account, a bench and an order, and we do not sell it."
      sections={[
        ['Account', 'Email, a hashed password and date of birth. The date is stored because we sell to adults only and verify it at signup and at sale.'],
        ['The bench', 'Vials, dose logs, notes, reminders and bloodwork you enter. Visible only to your account; row-level security enforces it.'],
        ['Orders', 'Shipping address, the items and their lot codes, and the payment reference. Lot codes are kept so a batch recall can reach exactly the people who hold it.'],
        ['Payments', 'We never see card numbers: there are none. Crypto is handled by a hosted checkout; Zelle payments arrive in our bank with your memo reference.'],
        ['Analytics', 'None. No third-party trackers, no advertising pixels.'],
        ['EU', 'Traffic from the EU is blocked at the edge and no EU personal data is processed. See the EU notice.'],
      ]}
    />
  )
}
