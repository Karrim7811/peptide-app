'use client'

import { useState } from 'react'
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

export default function AiConsentModal({ onAccept, onDecline }: Props) {
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAccept = async () => {
    if (!checked || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/ai-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to save')
      onAccept()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FAFAF8',
          borderRadius: 16,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '28px 24px 0', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(26, 138, 158, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Lock size={28} color="#1A8A9E" />
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              fontSize: 26,
              fontWeight: 600,
              color: '#1A1915',
              margin: '0 0 8px',
            }}
          >
            AI Data Disclosure
          </h2>
          <p
            style={{
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 14,
              color: '#3A3730',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Peptide Cortex uses AI features powered by{' '}
            <strong>Anthropic&apos;s Claude</strong> to analyze your data and
            provide personalized insights. Before using these features, please
            review what data is shared.
          </p>
        </div>

        {/* Data shared section */}
        <div style={{ padding: '20px 24px 0' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: '#B0AAA0',
              marginBottom: 10,
              fontFamily: "'Jost', sans-serif",
            }}
          >
            Data shared with Anthropic
          </div>
          <div
            style={{
              background: '#F2F0ED',
              borderRadius: 12,
              padding: '4px 0',
            }}
          >
            {DATA_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom:
                    i < DATA_ITEMS.length - 1
                      ? '1px solid rgba(176, 170, 160, 0.2)'
                      : 'none',
                }}
              >
                <item.icon size={16} color="#1A8A9E" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
                    fontSize: 14,
                    color: '#3A3730',
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How data is handled */}
        <div style={{ padding: '20px 24px 0' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: '#B0AAA0',
              marginBottom: 10,
              fontFamily: "'Jost', sans-serif",
            }}
          >
            How your data is handled
          </div>
          <div
            style={{
              background: '#F2F0ED',
              borderRadius: 12,
              padding: '12px 16px',
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 13,
              color: '#3A3730',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: '0 0 6px' }}>
              &bull; Sent securely via encrypted HTTPS connection
            </p>
            <p style={{ margin: '0 0 6px' }}>
              &bull; Anthropic does <strong>not</strong> use API data to train
              their models
            </p>
            <p style={{ margin: '0 0 6px' }}>
              &bull; Data is processed and not permanently stored by Anthropic
            </p>
            <p style={{ margin: 0 }}>
              &bull; Your data is never sold or shared for advertising
            </p>
          </div>
        </div>

        {/* Links */}
        <div
          style={{
            padding: '16px 24px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 13,
              color: '#1A8A9E',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={13} />
            Read our Privacy Policy
          </a>
          <a
            href="https://www.anthropic.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 13,
              color: '#1A8A9E',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={13} />
            Read Anthropic&apos;s Privacy Policy
          </a>
        </div>

        {/* Checkbox + Actions */}
        <div style={{ padding: '20px 24px 24px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                accentColor: '#1A8A9E',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
                fontSize: 13,
                color: '#3A3730',
                lineHeight: 1.5,
              }}
            >
              I understand and consent to sharing my data with Anthropic for
              AI-powered features
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked || saving}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 10,
              border: 'none',
              background: checked ? '#1A8A9E' : '#B0AAA0',
              color: '#fff',
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              cursor: checked ? 'pointer' : 'default',
              opacity: saving ? 0.7 : 1,
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>

          <button
            onClick={onDecline}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px 0',
              marginTop: 8,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: '#B0AAA0',
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Decline — I&apos;ll skip AI features
          </button>
        </div>
      </div>
    </div>
  )
}
