'use client'

// The interaction checker.
//
// Free at three checks a day; the API enforces that and this screen relays what
// it says rather than counting on its own. A client-side counter would be both
// wrong across devices and trivially reset.
//
// Two things carry the design's argument:
//
//   • The badge never stands alone. Every level is rendered with a sentence
//     spelling out what it means, because "Safe" as a bare word is read as a
//     clearance and it is not one — it means nothing was reported, which is
//     often because nobody looked.
//   • The AI label appears at the point of output, every time. The lede says
//     the answer "is written by a model, which it says every time", so the
//     provenance is part of the answer rather than a footer.
//
// Anything the model returns that this code does not recognise resolves to
// "unknown", never "safe". See src/lib/interaction.ts.

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useAiConsent } from '@/components/AiConsentProvider'
import {
  LEVEL_LABEL,
  LEVEL_NOTE,
  readInteraction,
  type InteractionResult,
} from '@/lib/interaction'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = '1px solid #1A1D1F'
const HAIR = '1px solid rgba(26,29,31,.18)'
const JOST = 'Jost, sans-serif'

export function CheckerClient({ isPro }: { isPro: boolean }) {
  const { requireConsent } = useAiConsent()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limited, setLimited] = useState(false)
  const [pair, setPair] = useState<[string, string] | null>(null)
  const [result, setResult] = useState<InteractionResult | null>(null)

  const ready = a.trim().length > 0 && b.trim().length > 0 && !busy

  const check = useCallback(async () => {
    if (!ready) return
    setError(null)
    setLimited(false)

    const consented = await requireConsent()
    if (!consented) return

    setBusy(true)
    try {
      const response = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemA: a.trim(), itemB: b.trim() }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        // The daily cap is not an error. It is the free tier working.
        if (response.status === 429 || payload?.code === 'RATE_LIMIT') setLimited(true)
        setError(payload?.error ?? 'The check could not be completed.')
        setResult(null)
        return
      }

      const parsed = readInteraction(payload)
      if (!parsed) {
        setError('The answer came back unreadable. Nothing is being shown rather than a guess.')
        setResult(null)
        return
      }
      setPair([a.trim(), b.trim()])
      setResult(parsed)
    } catch {
      setError('The check could not be completed.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }, [a, b, ready, requireConsent])

  return (
    <div style={{ padding: 'clamp(22px,3vw,40px) clamp(16px,3vw,32px) clamp(24px,3vw,40px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
          fontFamily: JOST,
          fontSize: 10.5,
          letterSpacing: '.26em',
          textTransform: 'uppercase',
          color: TEAL,
        }}
      >
        <span>Interactions</span>
        <span style={{ color: INK3 }}>
          {isPro ? 'Pro · unlimited' : 'Free · three checks a day'}
        </span>
      </div>

      <h1
        style={{
          margin: '14px 0 0',
          fontWeight: 300,
          fontSize: 'clamp(30px,3.6vw,46px)',
          lineHeight: 1,
          letterSpacing: '-.028em',
        }}
      >
        Two things, compared.
      </h1>
      <p
        style={{
          margin: '14px 0 0',
          fontSize: 18,
          lineHeight: 1.45,
          color: INK2,
          maxWidth: '64ch',
          textWrap: 'pretty',
        }}
      >
        Three peptides, two prescriptions and a handful of supplements, and nowhere to ask
        whether the set is a problem. Put any two here. The answer comes with its reasoning
        and is written by a model, which it says every time.
      </p>

      <div
        style={{
          marginTop: 24,
          borderTop: RULE,
          paddingTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,240px),1fr))',
          gap: '14px 20px',
          alignItems: 'end',
        }}
      >
        <Field label="The first thing" value={a} onChange={setA} hint="a peptide, a drug, a supplement" />
        <Field label="The second thing" value={b} onChange={setB} hint="anything you take alongside it" />
      </div>

      <div
        style={{ marginTop: 18, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <button
          type="button"
          onClick={check}
          disabled={!ready}
          style={{
            appearance: 'none',
            border: RULE,
            background: ready ? INK : 'transparent',
            color: ready ? '#F4F5F6' : INK3,
            fontFamily: JOST,
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '14px 22px',
            minHeight: 44,
            borderRadius: 0,
            cursor: ready ? 'pointer' : 'not-allowed',
            opacity: ready ? 1 : 0.4,
          }}
        >
          {busy ? 'Checking…' : 'Check the pair'}
        </button>
        <span style={{ fontSize: 15, fontStyle: 'italic', color: INK2 }}>
          {ready ? 'Reference, not advice.' : 'Name both things to check them.'}
        </span>
      </div>

      {error && (
        <div
          style={{
            margin: '18px 0 0',
            borderLeft: `2px solid ${limited ? TEAL : INK}`,
            paddingLeft: 12,
            maxWidth: '64ch',
          }}
        >
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45 }}>{error}</p>
          {limited && !isPro && (
            <p style={{ margin: '8px 0 0', fontSize: 16, color: INK2 }}>
              The library and the dosing reference stay free and unlimited.{' '}
              <Link href="/upgrade" style={{ color: INK, textDecoration: 'underline' }}>
                Pro removes the cap
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {result && pair && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontFamily: JOST,
              fontSize: 9.5,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: INK3,
              borderBottom: RULE,
              paddingBottom: 8,
            }}
          >
            <span style={{ color: TEAL }}>AI-generated · Claude · reference, not advice</span>
            <span>
              {pair[0]} + {pair[1]}
            </span>
          </div>

          {/* The badge never stands alone — the sentence under it is what stops
              a one-word label being read as a verdict. No colour carries
              meaning here; ink and grey only. */}
          <div style={{ marginTop: 16 }}>
            <span
              style={{
                display: 'inline-block',
                border: RULE,
                padding: '8px 12px',
                fontFamily: JOST,
                fontSize: 10.5,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              {LEVEL_LABEL[result.level]}
            </span>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 16,
                lineHeight: 1.45,
                color: INK2,
                maxWidth: '66ch',
              }}
            >
              {LEVEL_NOTE[result.level]}
            </p>
          </div>

          <p
            style={{
              margin: '18px 0 0',
              fontSize: 21,
              lineHeight: 1.35,
              maxWidth: '62ch',
              textWrap: 'pretty',
            }}
          >
            {result.summary}
          </p>

          {result.details && (
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 17,
                lineHeight: 1.5,
                color: INK2,
                maxWidth: '68ch',
                textWrap: 'pretty',
              }}
            >
              {result.details}
            </p>
          )}

          {result.recommendations.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <span
                style={{
                  fontFamily: JOST,
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: INK3,
                }}
              >
                What the literature suggests watching
              </span>
              <div style={{ marginTop: 8, borderTop: HAIR }}>
                {result.recommendations.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      margin: 0,
                      padding: '10px 0',
                      borderBottom: HAIR,
                      fontSize: 17,
                      lineHeight: 1.45,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p
        style={{
          margin: '28px 0 0',
          fontSize: 15.5,
          lineHeight: 1.5,
          color: INK2,
          maxWidth: '68ch',
          textWrap: 'pretty',
        }}
      >
        Educational reference only. This is not medical advice, not a diagnosis and not a
        treatment recommendation. An absence of reported interactions is not a clearance.
        Consult a licensed physician before any medical decision. Adults 18+.
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: JOST,
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: INK3,
        }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        placeholder={hint}
        style={{
          height: 48,
          padding: '0 12px',
          border: '1px solid rgba(26,29,31,.45)',
          background: '#F4F5F6',
          fontSize: 18,
          borderRadius: 0,
          color: INK,
        }}
      />
    </label>
  )
}
