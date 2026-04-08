import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[#B0AAA0] hover:text-[#1A1915] text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-[#1A1915] mb-2">Terms of Service</h1>
        <p className="text-[#B0AAA0] text-sm mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-[#3A3730] text-sm leading-relaxed">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of the Peptide Cortex
            application (the &quot;App&quot;) operated by Tigris Tech Labs (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;). By accessing or using the App, you agree to be bound by these
            Terms. If you do not agree, do not use the App.
          </p>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">1. Educational and Research Purposes Only</h2>
            <div className="bg-[#F0EFEB] border border-[#D5D0C8] rounded-lg p-4">
              <p>
                Peptide Cortex is provided strictly for <strong>educational and
                research reference purposes</strong>. The App does <strong>not</strong> provide
                medical advice, diagnosis, or treatment recommendations. The App is <strong>not</strong> a
                medical device and has not received regulatory clearance from the FDA or any other
                health authority. Nothing in the App &mdash; including the Peptide Bible, AI-generated responses,
                interaction references, dosing reference information, unit converters, or any other feature &mdash;
                should be interpreted as medical guidance or as a substitute for professional medical advice.
              </p>
              <p className="mt-2">
                All dosing information displayed in the App reflects published research literature and
                community-reported data. It is not personalized medical guidance. You must always consult
                a qualified, licensed healthcare professional before using, combining, or altering the
                usage of any peptide, supplement, or compound. You assume full and sole responsibility for
                any decisions you make based on information obtained through the App.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">2. Eligibility</h2>
            <p>
              You must be at least <strong>18 years of age</strong> to create an
              account and use Peptide Cortex. By registering, you represent and
              warrant that you are 18 or older and have the legal capacity to enter
              into these Terms. If we learn that a user is under 18, we will
              terminate their account and delete associated data.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You agree to notify us immediately if you suspect unauthorized access to your account.</li>
              <li>We reserve the right to suspend or disable your account if we reasonably believe it has been compromised.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">4. Subscriptions and Billing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pro subscriptions are billed monthly or annually through Stripe.</li>
              <li>You may cancel your subscription at any time; Pro access continues until the end of the current billing period.</li>
              <li>Refunds are handled at our discretion. Contact support within 7 days of a charge for refund requests.</li>
              <li>Prices may change with 30 days&apos; written notice to active subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">5. Acceptable Use Policy</h2>
            <p className="mb-2">You agree not to use Peptide Cortex to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Provide medical advice or present yourself as a medical professional using the App</li>
              <li>Attempt to reverse-engineer, decompile, scrape, or extract proprietary data from the App</li>
              <li>Interfere with or disrupt the integrity or performance of the App or its infrastructure</li>
              <li>Impersonate another person or create accounts under false pretenses</li>
              <li>Distribute, resell, or sublicense access to the App or its Pro features</li>
              <li>Upload malicious code, viruses, or any harmful content</li>
              <li>Use automated bots or scripts to access the App without our written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">6. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time,
              with or without notice, for conduct that we determine, in our sole
              discretion, violates these Terms, is harmful to other users or the
              App, or is otherwise objectionable. Upon termination, your right to
              use the App ceases immediately. You may also delete your account at
              any time by contacting us at{' '}
              <a
                href="mailto:support@tigristechlabs.com"
                className="text-[#1A8A9E] hover:underline"
              >
                support@tigristechlabs.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">7. Disclaimer of Warranties</h2>
            <p>
              Peptide Cortex is provided on an <strong>&quot;AS IS&quot;</strong> and{' '}
              <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any
              kind, whether express, implied, or statutory. We expressly disclaim all
              warranties including, but not limited to, implied warranties of
              merchantability, fitness for a particular purpose, accuracy, and
              non-infringement. We do not warrant that the App will be
              uninterrupted, error-free, or free of harmful components. AI-generated
              content, interaction checks, and information in the Peptide Bible may
              contain errors and should never be relied upon as medical or
              professional guidance.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Tigris Tech Labs,
              its officers, directors, employees, agents, and affiliates shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of profits, data,
              health outcomes, or goodwill, arising out of or in connection with your
              use of or inability to use the App. In no event shall our total
              aggregate liability exceed the amount you have paid us in the twelve
              (12) months preceding the claim. This limitation applies regardless of
              the theory of liability, whether based in contract, tort, negligence,
              strict liability, or otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">9. Intellectual Property</h2>
            <p>
              All content, features, and functionality of Peptide Cortex &mdash;
              including but not limited to text, graphics, logos, icons, the Peptide
              Bible database, AI prompts, software code, and design &mdash; are the
              exclusive property of Tigris Tech Labs or its licensors and are
              protected by copyright, trademark, and other intellectual property
              laws. You may not reproduce, distribute, modify, create derivative
              works from, publicly display, or exploit any content from the App
              without our prior written consent.
            </p>
            <p className="mt-2">
              Your use of the App does not grant you any ownership rights in the App
              or its content. User-generated data (your logs, notes, and entries)
              remains yours.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Tigris Tech Labs and its
              officers, directors, employees, and agents from any claims, damages,
              losses, liabilities, and expenses (including reasonable legal fees)
              arising out of or related to your use of the App, your violation of
              these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the
              laws of the United States, without regard to conflict of law
              principles. Any disputes arising from these Terms or your use of the
              App shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">12. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time by posting an updated version
              within the App. Material changes will be communicated via email to
              registered users. Your continued use of the App after changes take
              effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">13. Contact</h2>
            <p>
              For questions about these Terms or to report a violation, contact us
              at:{' '}
              <a
                href="mailto:support@tigristechlabs.com"
                className="text-[#1A8A9E] hover:underline"
              >
                support@tigristechlabs.com
              </a>
            </p>
            <p className="mt-2 text-[#B0AAA0]">
              Tigris Tech Labs
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
