'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Zap, Lock, Bot, Shield, Layers, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

const FEATURE_INFO: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
  'ai-chat': {
    title: 'PeptideAI Chat',
    desc: 'Unlimited conversations with your AI peptide expert — protocols, dosing, stacking advice powered by your full knowledge base.',
    icon: <Bot className="w-6 h-6 text-indigo-400" />,
  },
  'interaction-checker': {
    title: 'Unlimited Interaction Checks',
    desc: "Free plan includes 3 checks/day. Upgrade for unlimited safety checks — know before you pin.",
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
  },
  'stack': {
    title: 'Unlimited Stack Items',
    desc: 'Free plan supports up to 5 items. Pro lets you track every compound, medication, and supplement you run.',
    icon: <Layers className="w-6 h-6 text-orange-400" />,
  },
}

function UpgradeContent() {
  const searchParams = useSearchParams()
  const feature = searchParams.get('feature') ?? 'ai-chat'
  const info = FEATURE_INFO[feature] ?? FEATURE_INFO['ai-chat']

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>

          <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            {info.icon}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{info.title}</h2>
          <p className="text-slate-400 mb-6">{info.desc}</p>

          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-slate-300 text-sm font-medium mb-2">Pro includes:</p>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li>✓ Unlimited PeptideAI chat</li>
              <li>✓ Unlimited interaction checks</li>
              <li>✓ Unlimited stack items</li>
              <li>✓ Full dose log history</li>
              <li>✓ All 14 tracking tools</li>
            </ul>
          </div>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors mb-3"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro — from $6.67/mo
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-white py-2 rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <UpgradeContent />
    </Suspense>
  )
}
