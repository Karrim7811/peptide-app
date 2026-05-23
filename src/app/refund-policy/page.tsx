import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Refund Policy — Peptide Cortex',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#B0AAA0] hover:text-[#1A1915] text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold text-[#1A1915] mb-2">Refund Policy</h1>
        <p className="text-[#B0AAA0] text-sm mb-8">
          Last updated: May 2026 &middot; Tigris Tech Labs
        </p>

        <div className="space-y-6 text-[#3A3730] text-sm leading-relaxed">
          <p>
            Peptide Cortex offers two Pro purchase options: a recurring monthly
            subscription and a one-time lifetime purchase. All payments are
            processed by Stripe. This page summarizes our refund terms. The
            authoritative version lives in &sect;4 of the{' '}
            <Link href="/terms" className="text-[#1A8A9E] hover:underline">Terms of Service</Link>;
            the language here is provided for clarity and quick reference.
          </p>

          <section className="bg-[#F0EFEB] border border-[#D5D0C8] rounded-lg p-5 space-y-3">
            <h2 className="text-[#1A1915] text-lg font-semibold">Monthly Pro</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>7-day money-back guarantee on the initial charge.</strong>{' '}
                Request a refund within 7 days of your first monthly charge and
                we will refund it in full, no questions asked.
              </li>
              <li>
                No refunds are offered for monthly charges after the 7-day window.
              </li>
              <li>
                You can cancel at any time from your account billing portal.
                Cancellation takes effect at the end of the current billing
                period.
              </li>
              <li>
                Auto-renews monthly at the price shown on the{' '}
                <Link href="/pricing" className="text-[#1A8A9E] hover:underline">pricing page</Link>{' '}
                until cancelled.
              </li>
            </ul>
          </section>

          <section className="bg-[#F0EFEB] border border-[#D5D0C8] rounded-lg p-5 space-y-3">
            <h2 className="text-[#1A1915] text-lg font-semibold">Lifetime Pro</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>14-day money-back guarantee.</strong> Request a refund
                within 14 days of your lifetime purchase and we will refund it
                in full, no questions asked.
              </li>
              <li>
                No refunds are offered for lifetime purchases after the 14-day
                window.
              </li>
              <li>
                Lifetime is a one-time charge for permanent Pro access. It does
                not auto-renew and cannot be &quot;cancelled&quot; — only refunded
                within the 14-day window.
              </li>
              <li>
                Lifetime customers are unaffected by future price changes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">How to request a refund</h2>
            <p>
              Email{' '}
              <a
                href="mailto:support@tigristechlabs.com"
                className="text-[#1A8A9E] hover:underline"
              >
                support@tigristechlabs.com
              </a>{' '}
              from the email address on your account. Include the date of the
              charge. We process refunds back to the original payment method
              via Stripe — depending on your bank, the funds may take up to 10
              business days to appear.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">California subscription auto-renewal disclosure</h2>
            <p>
              For California residents and others, the dollar amount, billing
              frequency, cancellation method, and minimum purchase obligation
              for any auto-renewing subscription are clearly displayed at the
              point of purchase on the{' '}
              <Link href="/pricing" className="text-[#1A8A9E] hover:underline">pricing page</Link>.
              Cancellation is available at any time from your account&apos;s
              billing portal and takes effect at the end of the current billing
              period.
            </p>
          </section>

          <p className="text-[#B0AAA0]">
            Questions? Contact{' '}
            <a
              href="mailto:support@tigristechlabs.com"
              className="text-[#1A8A9E] hover:underline"
            >
              support@tigristechlabs.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
