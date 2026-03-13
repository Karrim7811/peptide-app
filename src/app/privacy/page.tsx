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
        <p className="text-[#B0AAA0] text-sm mb-8">Last updated: March 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-[#3A3730] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p>PeptideTracker collects the following information when you use our service:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account information:</strong> Email address and authentication data via Supabase.</li>
              <li><strong>Stack & tracking data:</strong> Peptide/supplement names, dosages, reminders, dose logs, notes, and cycle data you enter.</li>
              <li><strong>Usage data:</strong> Feature usage patterns (no personally identifiable information sold or shared).</li>
              <li><strong>Payment data:</strong> Subscription status. Full payment details are handled by Stripe and never stored on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the PeptideTracker service</li>
              <li>To process subscription payments via Stripe</li>
              <li>To send push reminders you have configured</li>
              <li>To generate AI responses (queries are sent to Anthropic&apos;s Claude API — no personal health data is stored by Anthropic beyond their standard API retention policies)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">3. Data Storage & Security</h2>
            <p>All data is stored in Supabase with Row-Level Security (RLS) enabled — only you can access your data. We use HTTPS for all data transmission. We do not sell, rent, or share your personal or health data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> — Database and authentication</li>
              <li><strong>Anthropic (Claude)</strong> — AI chat and interaction checking</li>
              <li><strong>Stripe</strong> — Payment processing</li>
              <li><strong>Vercel</strong> — Hosting and deployment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">5. Data Deletion</h2>
            <p>You may request deletion of your account and all associated data at any time by emailing <a href="mailto:support@peptidetracker.app" className="text-[#1A8A9E] hover:underline">support@peptidetracker.app</a>. We will process your request within 30 days.</p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">6. Health Disclaimer</h2>
            <p>PeptideTracker is an informational and tracking tool only. It is not a medical device, does not provide medical advice, and is not a substitute for professional healthcare guidance. All information in the Peptide Bible is for educational and research purposes only.</p>
          </section>

          <section>
            <h2 className="text-[#1A1915] text-lg font-semibold mb-2">7. Contact</h2>
            <p>Questions? Email us at <a href="mailto:privacy@peptidetracker.app" className="text-[#1A8A9E] hover:underline">privacy@peptidetracker.app</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
