// The EU notice.
//
// This is what the edge geoblock serves, so it hides the header nav and the
// legal tab column: every destination on this site is blocked for whoever is
// reading it, and offering links to them would be a maze.
//
// It reads as a decision rather than a fault, because it is one. See CLAUDE.md
// §16.11 — the compliance work is real and deliberately deferred, and saying so
// plainly is more defensible than an outage page.

import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Not available in the EU · Peptide Cortex',
  description: 'Peptide Cortex does not serve EU member states. This is deliberate.',
  robots: { index: false, follow: false },
}

export default function EuPage() {
  return (
    <LegalPage
      current={null}
      kicker="European Union"
      title="Peptide Cortex is not available in the EU."
      meta="Deliberate · not an outage"
      lede="Traffic from EU member states is blocked at the edge. This is a decision about where we operate, not an error, and nothing on your side needs fixing."
      sections={[
        ['Why', 'We are a small US operation. Serving EU visitors would bring the reference, the bench and the shop under GDPR and EU medicines rules we are not set up to meet properly, and doing it badly is worse than not doing it.'],
        ['What is blocked', 'Everything: the library, the bench, the shop and account creation. No EU personal data is processed.'],
        ['Shipping', 'The shop ships to US addresses only, independently of this block.'],
        ['If this is wrong', 'Geolocation is imperfect. If you are outside the EU, write to us with your location and we will look.'],
      ]}
    >
      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid #1A1D1F',
            color: '#1A1D1F',
            textDecoration: 'none',
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '14px 22px',
            minHeight: 44,
          }}
        >
          Write to us
        </a>
        <span style={{ fontSize: 15.5, fontStyle: 'italic', color: '#3B4045' }}>
          If you are outside the EU and seeing this, say so and include your location.
        </span>
      </div>
    </LegalPage>
  )
}
