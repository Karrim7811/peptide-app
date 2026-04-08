import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[#B0AAA0] hover:text-[#1A1915] text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-[#1A1915] mb-2">Privacy Policy</h1>
        <p className="text-[#B0AAA0] text-sm mb-8">Effective date: March 2026</p>

        <div className="space-y-6 text-[#3A3730] text-sm leading-relaxed">
          <p>
            Tigris Tech Labs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Peptide Cortex
            mobile application (the &quot;App&quot;). This Privacy Policy explains how we
            collect, use, store, and protect your information when you use the App.
          </p>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="mb-2">We collect the following categories of data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Account information:</strong> Your email address, collected
                when you create an account and used for authentication and
                communication.
              </li>
              <li>
                <strong>Bloodwork and health data:</strong> Any bloodwork panels,
                biomarker values, or health-related data you voluntarily enter into
                the App. We never collect this data automatically.
              </li>
              <li>
                <strong>Stack and tracking data:</strong> Peptide and supplement
                names, dosages, dose logs, reminders, cycle data, notes, and
                reconstitution calculations you enter.
              </li>
              <li>
                <strong>Usage analytics:</strong> Anonymized feature usage patterns
                such as screens visited, feature frequency, and session duration. No
                personally identifiable information is included in analytics data.
              </li>
              <li>
                <strong>Payment information:</strong> Subscription status and billing
                history. Full payment card details are handled exclusively by Stripe
                and are never stored on our servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the Peptide Cortex service</li>
              <li>To authenticate your account and manage access</li>
              <li>To process subscription payments via Stripe</li>
              <li>To deliver push notification reminders you have configured</li>
              <li>
                To generate AI-powered responses and analysis (queries are sent to
                Anthropic&apos;s Claude API; see Section 4 for details)
              </li>
              <li>To diagnose technical issues and improve App stability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">3. How Your Data Is Stored and Secured</h2>
            <p className="mb-2">
              All user data is stored in <strong>Supabase</strong>, a hosted
              PostgreSQL platform with encryption at rest and in transit. We enforce
              Row-Level Security (RLS) so that only you can access your own records.
              All communication between the App and our servers uses HTTPS/TLS
              encryption.
            </p>
            <p>
              While we take commercially reasonable measures to protect your data,
              no method of electronic storage or transmission is 100% secure. We
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">4. Third-Party Services</h2>
            <p className="mb-2">Peptide Cortex integrates with the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase</strong> &mdash; Authentication, database hosting,
                and data storage. Your account credentials and app data are stored
                here with encryption and row-level access controls.
              </li>
              <li>
                <strong>Stripe</strong> &mdash; Payment processing for Pro
                subscriptions. Stripe handles all card information directly; we never
                see or store your full card number.
              </li>
              <li>
                <strong>Anthropic (Claude AI)</strong> &mdash; AI-powered analysis,
                interaction checking, protocol planning, and chat features. When you
                use AI features, the following data may be sent to Anthropic&apos;s
                Claude API for processing:
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                  <li>Bloodwork markers and lab values you enter or upload</li>
                  <li>Lab report images and PDFs (for OCR extraction)</li>
                  <li>Chat conversation history with the AI assistant</li>
                  <li>Peptide stack details including names, dosages, and cycles</li>
                  <li>Health goals and profile information (age, weight, sex)</li>
                  <li>Medical conditions and current medications</li>
                  <li>Vial photos (for identification)</li>
                </ul>
                <p className="mt-1">
                  This data is sent securely via encrypted HTTPS. Anthropic does not
                  use API inputs to train their models, and data is not permanently
                  stored by Anthropic. Your data is never sold or shared for
                  advertising purposes. You will be asked for explicit consent before
                  any data is shared with Anthropic. Refer to{' '}
                  <a
                    href="https://www.anthropic.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1A8A9E] hover:underline"
                  >
                    Anthropic&apos;s Privacy Policy
                  </a>{' '}
                  for their data handling practices.
                </p>
              </li>
              <li>
                <strong>Vercel</strong> &mdash; Application hosting and deployment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">5. We Do Not Sell Your Data</h2>
            <p>
              We do <strong>not</strong> sell, rent, trade, or otherwise share your
              personal information or health data with third parties for marketing,
              advertising, or any commercial purpose. Your data is used solely to
              provide and improve the Peptide Cortex service.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">6. Account and Data Deletion</h2>
            <p>
              You may request deletion of your account and all associated data at
              any time by emailing{' '}
              <a
                href="mailto:support@tigristechlabs.com"
                className="text-[#1A8A9E] hover:underline"
              >
                support@tigristechlabs.com
              </a>
              . Upon receiving your request, we will permanently delete your account
              and all data from our systems within 30 days. Data that has already
              been anonymized for analytics purposes cannot be attributed back to you
              and may be retained in aggregate form.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">7. HIPAA Disclaimer</h2>
            <div className="bg-[#F0EFEB] border border-[#D5D0C8] rounded-lg p-4">
              <p className="mb-2">
                <strong>Peptide Cortex is NOT a HIPAA-compliant application.</strong>
              </p>
              <p>
                The App is designed for <strong>educational and research purposes
                only</strong>. It is not intended to be used as a medical device, electronic
                health record (EHR), or protected health information (PHI) storage
                system. Do not enter information into the App that you require to be
                stored in a HIPAA-compliant environment. Tigris Tech Labs makes no
                representations regarding compliance with the Health Insurance
                Portability and Accountability Act (HIPAA) or any similar healthcare
                data regulation. Always consult a licensed healthcare professional
                for medical advice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">8. Children&apos;s Privacy</h2>
            <p>
              Peptide Cortex is not intended for use by anyone under the age of 18.
              We do not knowingly collect personal information from minors. If we
              become aware that we have collected data from a minor, we will take
              steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              material changes, we will notify you via email or an in-app notice. Your
              continued use of the App after changes take effect constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">10. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or your
              data, contact us at:{' '}
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
