'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Zap, Star, Loader2,
  Bot, Shield, Library, Bell, RotateCcw, Layers, Package
} from 'lucide-react'

const FREE_FEATURES = [
  { label: 'Up to 5 stack items', included: true },
  { label: 'Interaction Checker (3/day)', included: true },
  { label: 'Peptide Bible reference (58 peptides)', included: true },
  { label: 'Dose Log (last 30 days)', included: true },
  { label: 'Popular Stacks browsing', included: true },
  { label: 'Basic reminders (up to 3)', included: true },
  { label: 'PeptideAI chat', included: false },
  { label: 'Unlimited interaction checks', included: false },
  { label: 'Unlimited stack items', included: false },
  { label: 'Full dose log history', included: false },
  { label: 'Cycle Tracker & Injection Sites', included: false },
  { label: 'Fridge Inventory', included: false },
  { label: 'Research Notes & Side Effect Log', included: false },
  { label: 'Export data as CSV', included: false },
]

const PRO_FEATURES = [
  { label: 'Everything in Free', included: true },
  { label: 'PeptideAI — unlimited AI chat', included: true, highlight: true },
  { label: 'Unlimited interaction checks', included: true },
  { label: 'Unlimited stack items', included: true },
  { label: 'Full dose log history', included: true },
  { label: 'Cycle Tracker & Injection Sites', included: true },
  { label: 'Fridge Inventory tracker', included: true },
  { label: 'Research Notes & Side Effect Log', included: true },
  { label: 'Unlimited reminders', included: true },
  { label: 'Export data as CSV', included: true },
  { label: 'Early access to new features', included: true },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billing }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        window.location.href = '/login?next=/pricing'
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const monthlyPrice = billing === 'yearly' ? 6.67 : 9.99
  const yearlyTotal = 79.99
  const savings = Math.round((1 - 79.99 / (9.99 * 12)) * 100)

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1A8A9E]/12 border border-[#1A8A9E]/30 text-[#1A8A9E] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold text-[#1A1915] mb-3">
            Upgrade to <span className="text-[#1A8A9E]">Pro</span>
          </h1>
          <p className="text-[#B0AAA0] text-lg max-w-xl mx-auto">
            The most comprehensive peptide tracking platform. Used by serious biohackers and researchers.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === 'monthly' ? 'bg-[#F2F0ED] text-[#1A1915]' : 'text-[#B0AAA0] hover:text-[#1A1915]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === 'yearly' ? 'bg-[#F2F0ED] text-[#1A1915]' : 'text-[#B0AAA0] hover:text-[#1A1915]'
            }`}
          >
            Yearly
            <span className="ml-2 bg-emerald-500/15 text-emerald-600 text-xs px-1.5 py-0.5 rounded-full">
              Save {savings}%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Free */}
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#1A1915] mb-1">Free</h2>
              <p className="text-[#B0AAA0] text-sm">Perfect for getting started</p>
              <div className="mt-3">
                <span className="text-4xl font-bold text-[#1A1915]">$0</span>
                <span className="text-[#B0AAA0] text-sm ml-1">forever</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-[#F2F0ED] hover:bg-[#E8E5E0] text-[#1A1915] py-2.5 rounded-xl text-sm font-medium transition-colors mb-5"
            >
              Current plan
            </Link>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5">
                  {f.included
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-[#B0AAA0] shrink-0" />
                  }
                  <span className={`text-sm ${f.included ? 'text-[#3A3730]' : 'text-[#B0AAA0]'}`}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-[#1A1915] border-2 border-[#1A8A9E]/60 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#1A8A9E] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> MOST POPULAR
              </span>
            </div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <p className="text-[#B0AAA0] text-sm">For serious peptide users</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold text-white">
                  ${monthlyPrice.toFixed(2)}
                </span>
                <span className="text-[#B0AAA0] text-sm mb-1">/mo</span>
                {billing === 'yearly' && (
                  <span className="text-[#B0AAA0] text-xs mb-1 ml-1">
                    (${yearlyTotal}/yr)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-70 text-[#1A1915] py-2.5 rounded-xl text-sm font-semibold transition-colors mb-5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Zap className="w-4 h-4" /> Upgrade to Pro</>
              )}
            </button>
            <ul className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${f.highlight ? 'text-[#1A8A9E]' : 'text-emerald-400'}`} />
                  <span className={`text-sm ${f.highlight ? 'text-[#1A8A9E] font-medium' : 'text-[#B0AAA0]'}`}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: <Bot className="w-5 h-5 text-[#1A8A9E]" />, title: 'PeptideAI', desc: 'Unlimited AI chat with full protocol knowledge' },
            { icon: <Shield className="w-5 h-5 text-emerald-400" />, title: 'Interaction Checker', desc: 'Unlimited safety checks, powered by Claude AI' },
            { icon: <Library className="w-5 h-5 text-blue-400" />, title: 'Peptide Bible', desc: '58 peptides with CV ratings and drug interactions' },
            { icon: <Bell className="w-5 h-5 text-yellow-400" />, title: 'Smart Reminders', desc: 'Unlimited reminders for every compound in your stack' },
            { icon: <RotateCcw className="w-5 h-5 text-purple-400" />, title: 'Cycle Tracker', desc: 'Plan and monitor on/off cycles automatically' },
            { icon: <Layers className="w-5 h-5 text-orange-400" />, title: 'Unlimited Stack', desc: 'Track as many compounds as you run' },
            { icon: <Package className="w-5 h-5 text-pink-400" />, title: 'Fridge Inventory', desc: 'Know exactly what you have and when it expires' },
            { icon: <Star className="w-5 h-5 text-yellow-400" />, title: 'Always improving', desc: 'New features ship to Pro users first' },
          ].map((item) => (
            <div key={item.title} className="bg-[#F2F0ED] border border-[#E8E5E0] rounded-xl p-4">
              <div className="mb-2">{item.icon}</div>
              <p className="text-[#1A1915] text-sm font-semibold mb-1">{item.title}</p>
              <p className="text-[#B0AAA0] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6 mb-8">
          <h3 className="text-[#1A1915] font-bold text-lg mb-4">Frequently asked questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account settings and you keep Pro access until the end of your billing period. No questions asked.' },
              { q: 'Is my data private?', a: 'All data is encrypted and stored securely. We never sell your stack data or health information to third parties.' },
              { q: 'What payment methods are accepted?', a: 'All major credit/debit cards via Stripe. Apple Pay and Google Pay supported on compatible devices.' },
              { q: 'Is there a student or discount option?', a: 'Reach out at support@peptidecortex.com for special cases. We want to support the research community.' },
            ].map((item) => (
              <div key={item.q}>
                <p className="text-[#1A1915] font-medium text-sm mb-1">{item.q}</p>
                <p className="text-[#B0AAA0] text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#B0AAA0] text-xs">
          By upgrading, you agree to our{' '}
          <Link href="/terms" className="text-[#1A8A9E] hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#1A8A9E] hover:underline">Privacy Policy</Link>.
          Payments processed securely by Stripe.
        </p>
    </div>
  )
}
