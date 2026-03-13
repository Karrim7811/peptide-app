'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Zap, Lock, Bot, Shield, Layers, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

const FEATURE_INFO: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
  'ai-chat': {
    title: 'PeptideAI Chat',
    desc: 'Unlimited conversations with your AI peptide expert — protocols, dosing, stacking advice powered by your full knowledge base.',
    icon: <Bot className="w-6 h-6 text-[#1A8A9E]" />,
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
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-8 text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 bg-[#1A8A9E]/8 border border-[#1A8A9E]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#1A8A9E]" />
          </div>

          <div className="w-10 h-10 bg-[#F2F0ED] rounded-xl flex items-center justify-center mx-auto mb-4">
            {info.icon}
          </div>

          <h2 className="text-2xl font-bold text-[#1A1915] mb-2">{info.title}</h2>
          <p className="text-[#B0AAA0] mb-6">{info.desc}</p>

          <div className="bg-[#F2F0ED]/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-[#3A3730] text-sm font-medium mb-2">Pro includes:</p>
            <ul className="space-y-1.5 text-sm text-[#B0AAA0]">
              <li>✓ Unlimited PeptideAI chat</li>
              <li>✓ Unlimited interaction checks</li>
              <li>✓ Unlimited stack items</li>
              <li>✓ Full dose log history</li>
              <li>✓ All 14 tracking tools</li>
            </ul>
          </div>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] py-3 rounded-xl font-semibold transition-colors mb-3"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro — from $6.67/mo
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full text-[#B0AAA0] hover:text-[#1A1915] py-2 rounded-xl text-sm transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8]" />}>
      <UpgradeContent />
    </Suspense>
  )
}
