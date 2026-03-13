import Link from 'next/link'
import { FlaskConical, Shield, Clock, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="bg-[#1A8A9E]/12 p-3 rounded-2xl">
            <FlaskConical className="w-10 h-10 text-[#1A8A9E]" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-[#1A1915] mb-4">
          Peptide<span className="text-[#1A8A9E]">Tracker</span>
        </h1>

        <p className="text-xl text-[#B0AAA0] mb-3 max-w-xl">
          Your intelligent companion for tracking peptides, medications, and supplements.
        </p>
        <p className="text-[#B0AAA0] mb-10 max-w-lg">
          AI-powered interaction checking, dosing reminders, and a complete dose log — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/signup"
            className="bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="bg-white hover:bg-[#F2F0ED] text-[#1A1915] font-semibold px-8 py-3 rounded-lg transition-colors border border-[#E8E5E0] text-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full">
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-[#1A8A9E]" />}
            title="AI Interaction Checker"
            desc="Powered by Claude — check interactions between any two compounds instantly."
          />
          <FeatureCard
            icon={<FlaskConical className="w-6 h-6 text-[#1A8A9E]" />}
            title="My Stack"
            desc="Keep track of every peptide, medication, and supplement with full dose info."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6 text-[#1A8A9E]" />}
            title="Dosing Reminders"
            desc="Set custom schedules for each compound — days of week, time, and dose."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6 text-[#1A8A9E]" />}
            title="Dose Log"
            desc="Log every dose you take and review your complete history."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[#B0AAA0] text-sm">
        <p>PeptideTracker &mdash; For informational purposes only. Always consult a healthcare provider.</p>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 text-left">
      <div className="mb-3">{icon}</div>
      <h3 className="text-[#1A1915] font-semibold mb-1">{title}</h3>
      <p className="text-[#B0AAA0] text-sm">{desc}</p>
    </div>
  )
}
