'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldCheck,
  FileText,
  MessageSquare,
  FlaskConical,
  Heart,
  Camera,
  Activity,
  Lock,
  ExternalLink,
} from 'lucide-react'

// Restyled onto the dark Mirror surface. EVERY USER-FACING STRING IS VERBATIM
// from the light-theme original — the consent text, the data list, the handling
// bullets and the decline wording are what the user is agreeing to, and
// changing them is an explicit ask-first item (CLAUDE.md §15). This change is
// presentation only.

type Props = {
  onAccept: () => void
  onDecline: () => void
}

const DATA_ITEMS = [
  { icon: Activity, text: 'Bloodwork markers and lab values' },
  { icon: FileText, text: 'Lab report images and PDFs' },
  { icon: MessageSquare, text: 'Chat conversation history' },
  { icon: FlaskConical, text: 'Peptide stack details (names, doses, cycles)' },
  { icon: Heart, text: 'Health goals and profile info (age, weight, sex)' },
  { icon: ShieldCheck, text: 'Medical conditions and medications' },
  { icon: Camera, text: 'Vial photos for identification' },
]

const HANDLING = [
  <>Sent securely via encrypted HTTPS connection</>,
  <>
    Anthropic does <strong className="font-medium text-ink">not</strong> use API data to train
    their models
  </>,
  <>Data is processed and not permanently stored by Anthropic</>,
  <>Your data is never sold or shared for advertising</>,
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-faint">{children}</span>
  )
}

export default function AiConsentModal({ onAccept, onDecline }: Props) {
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    if (!checked || saving) return
    setSaving(true)
    setError('')
    try {
      // Send the access token explicitly. The browser is the one place the
      // session is reliably available — server-side the route could validate
      // the cookie with getUser() but could not get a *session* out of it, so
      // the write failed with "Auth session missing!" while auth itself looked
      // fine. This puts web on the same known-good path the iOS app uses.
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Please sign in again to continue.')
      }

      const res = await fetch('/api/ai-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save consent')
      }
      onAccept()
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-heading"
      className="cx-surface fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans"
      style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)' }}
    >
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-y-auto border border-hair bg-ground">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-7 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-hair bg-panelHi">
            <Lock size={26} strokeWidth={1.6} className="text-hue-cy" />
          </div>
          <h2
            id="ai-consent-heading"
            className="font-display text-[30px] font-light leading-[1.15] text-ink"
          >
            AI Data Disclosure
          </h2>
          <p className="text-[14px] leading-[1.7] text-dim" style={{ textWrap: 'pretty' }}>
            Peptide Cortex uses AI features powered by{' '}
            <strong className="font-medium text-ink">Anthropic&apos;s Claude</strong> to analyze
            your data and provide personalized insights. Before using these features, please review
            what data is shared.
          </p>
        </div>

        {/* Data shared */}
        <div className="flex flex-col gap-[10px] px-6 pt-6">
          <SectionLabel>Data shared with Anthropic</SectionLabel>
          <div className="flex flex-col gap-px bg-hair">
            {DATA_ITEMS.map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-panel px-4 py-[11px]">
                <item.icon size={15} strokeWidth={1.7} className="flex-shrink-0 text-hue-cy" />
                <span className="text-[14px] leading-[1.5] text-dim">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How data is handled */}
        <div className="flex flex-col gap-[10px] px-6 pt-6">
          <SectionLabel>How your data is handled</SectionLabel>
          <ul className="flex flex-col gap-[7px] bg-panel px-4 py-[14px]">
            {HANDLING.map((line, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-dim">
                <span aria-hidden className="text-faintest">
                  &bull;
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-1 px-6 pt-5">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center gap-2 text-[13px] text-accent hover:text-ink"
          >
            <ExternalLink size={13} />
            Read our Privacy Policy
          </a>
          <a
            href="https://www.anthropic.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center gap-2 text-[13px] text-accent hover:text-ink"
          >
            <ExternalLink size={13} />
            Read Anthropic&apos;s Privacy Policy
          </a>
        </div>

        {/* Consent + actions */}
        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-[6px] border-l-2 border-gold bg-panelHot px-4 py-3"
            >
              <span className="font-mono text-[9.5px] tracking-[0.18em] text-gold">CHECK THIS</span>
              <span className="text-[13px] leading-[1.6] text-ink">{error}</span>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-[2px] h-[18px] w-[18px] flex-shrink-0 cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="text-[13px] leading-[1.6] text-dim">
              I understand and consent to sharing my data with Anthropic for AI-powered features
            </span>
          </label>

          <div className="flex flex-col gap-px bg-hair">
            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked || saving}
              // Uppercased with CSS, not in the string. The label the user
              // reads is the same text as the original, character for
              // character — only its presentation changed.
              className="flex min-h-[52px] items-center justify-center bg-accent font-mono text-[10px] uppercase tracking-[0.18em] text-ground transition-opacity disabled:cursor-default disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={saving}
              className="flex min-h-[48px] items-center justify-center bg-panel font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-ink disabled:opacity-50"
            >
              Decline — I&apos;ll skip AI features
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
