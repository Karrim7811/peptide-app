import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By using PeptideTracker, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">2. Educational Use Only</h2>
            <p>PeptideTracker provides information for <strong>educational and research purposes only</strong>. Nothing in the app constitutes medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before using any compound. You assume full responsibility for your use of any substances tracked in this app.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">3. Account Eligibility</h2>
            <p>You must be 18 years or older to use PeptideTracker. By creating an account, you confirm you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">4. Subscriptions & Billing</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Pro subscriptions are billed monthly or annually through Stripe.</li>
              <li>You may cancel at any time; Pro access continues until the end of the current billing period.</li>
              <li>Refunds are handled at our discretion — contact support within 7 days of a charge for refund requests.</li>
              <li>Prices may change with 30 days notice to active subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">5. Prohibited Use</h2>
            <p>You may not use PeptideTracker to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Violate any applicable law or regulation</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the service</li>
              <li>Impersonate another user or create accounts in bad faith</li>
              <li>Distribute or resell access to Pro features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">6. Disclaimer of Warranties</h2>
            <p>PeptideTracker is provided &quot;as is&quot; without warranties of any kind. We do not guarantee accuracy of information in the Peptide Bible or AI responses. AI-generated content may contain errors and should not be relied upon as medical guidance.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, PeptideTracker and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including any adverse health outcomes from compounds you track or information you receive through the app.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">8. Changes to Terms</h2>
            <p>We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-2">9. Contact</h2>
            <p>Legal questions: <a href="mailto:legal@peptidetracker.app" className="text-indigo-400 hover:underline">legal@peptidetracker.app</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
