'use client'

// The protocol planner.
//
// /api/protocol-plan has existed for months with nothing calling it. This is
// its surface.
//
// ── What makes this safe to ship ──────────────────────────────────────────
//
// Three layers, and only the last two are enforcement:
//
//   1. The prompt asks (src/lib/ai-dose-guardrail.ts, all 98 names attached).
//   2. readPlan() REPLACES any amount the model attached to a peptide with no
//      published human dose, before a single row reaches the DOM.
//   3. protocol.test.ts proves layer 2 happens, BPC-157 by name.
//
// If the model behaves, layer 2 is a no-op. If it does not, the page still
// cannot print a number that nobody published. The count of replacements is
// shown rather than hidden — a silent correction is a correction nobody can
// audit.
//
// ── The bench is context, not something this edits ────────────────────────
//
// The planner reads the stack to plan around it and never writes to it.
// Changing the bench happens on the bench. That keeps a generated plan from
// silently rewriting real user data.

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { useAiConsent } from '@/components/AiConsentProvider'
import { COMPOUND_LIST } from '@/lib/catalog'
import { readPlan } from '@/lib/protocol'
import type { Plan } from '@/lib/protocol'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = '1px solid #1A1D1F'
const HAIR = '1px solid rgba(26,29,31,.18)'
const JOST = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', monospace"

const LEVEL_LABEL: Record<string, string> = {
  safe: 'No concern reported',
  caution: 'Caution',
  danger: 'Reported concern',
}

export function ProtocolClient({ bench }: { bench: string[] }) {
  const { requireConsent } = useAiConsent()
  const [picked, setPicked] = useState<string[]>(bench)
  const [goals, setGoals] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)

  // The bench first, then everything else, so the common case is at the top.
  const options = useMemo(() => {
    const names = COMPOUND_LIST.map((entry) => entry.name)
    const onBench = names.filter((name) => bench.includes(name))
    return [...onBench, ...names.filter((name) => !bench.includes(name))]
  }, [bench])

  const toggle = (name: string) =>
    setPicked((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    )

  const run = useCallback(async () => {
    if (picked.length === 0) return
    setError(null)

    const consented = await requireConsent()
    if (!consented) return

    setBusy(true)
    try {
      const response = await fetch('/api/protocol-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peptides: picked,
          profile: { goals: goals.trim() ? [goals.trim()] : [] },
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(payload?.error ?? 'The plan could not be generated.')
        return
      }
      // Never rendered raw. Every amount goes through the classifier first.
      setPlan(readPlan(payload?.plan ?? payload))
    } catch {
      setError('The plan could not be generated.')
    } finally {
      setBusy(false)
    }
  }, [picked, goals, requireConsent])

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
        <span>Protocol</span>
        <span style={{ color: INK3 }}>Pro · goals + bench in · a week out</span>
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
        A protocol, drafted and argued with.
      </h1>
      <p
        style={{
          margin: '14px 0 0',
          fontSize: 18,
          lineHeight: 1.45,
          color: INK2,
          maxWidth: '62ch',
          textWrap: 'pretty',
        }}
      >
        Say what you are after. It drafts a week around what is already on the bench and
        explains each placement. Amounts come from the dosing reference with their
        sources, or not at all.
      </p>

      <div style={{ marginTop: 24, borderTop: RULE, paddingTop: 18 }}>
        <Label>What are you after</Label>
        <input
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="recovery from a shoulder injury, sleep quality, …"
          style={{
            marginTop: 8,
            width: '100%',
            maxWidth: 560,
            height: 48,
            padding: '0 12px',
            border: '1px solid rgba(26,29,31,.45)',
            background: '#F4F5F6',
            fontSize: 18,
            fontStyle: 'italic',
            borderRadius: 0,
            color: INK,
          }}
        />
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Label>Peptides · {picked.length} selected</Label>
          <Link
            href="/dashboard"
            style={{
              fontFamily: JOST,
              fontSize: 10,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: INK3,
              textDecoration: 'none',
            }}
          >
            Edit on the bench ↗
          </Link>
        </div>
        <div
          style={{
            marginTop: 10,
            maxHeight: 240,
            overflowY: 'auto',
            border: HAIR,
            padding: '10px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 12px',
          }}
        >
          {options.map((name) => {
            const on = picked.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                style={{
                  appearance: 'none',
                  border: `1px solid ${on ? INK : 'rgba(26,29,31,.3)'}`,
                  background: on ? INK : 'transparent',
                  color: on ? '#F4F5F6' : INK2,
                  fontFamily: JOST,
                  fontSize: 10,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
                  minHeight: 32,
                  cursor: 'pointer',
                  borderRadius: 0,
                }}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={run}
          disabled={busy || picked.length === 0}
          style={{
            appearance: 'none',
            border: RULE,
            background: picked.length === 0 || busy ? 'transparent' : INK,
            color: picked.length === 0 || busy ? INK3 : '#F4F5F6',
            fontFamily: JOST,
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '14px 22px',
            minHeight: 44,
            borderRadius: 0,
            cursor: picked.length === 0 || busy ? 'not-allowed' : 'pointer',
            opacity: picked.length === 0 || busy ? 0.4 : 1,
          }}
        >
          {busy ? 'Drafting…' : 'Draft a week'}
        </button>
        <span style={{ fontSize: 15, fontStyle: 'italic', color: INK2 }}>
          {picked.length === 0
            ? 'Pick at least one peptide.'
            : 'A draft to argue with, not a prescription.'}
        </span>
      </div>

      {error && (
        <p
          style={{
            margin: '18px 0 0',
            fontSize: 17,
            lineHeight: 1.4,
            borderLeft: `2px solid ${INK}`,
            paddingLeft: 12,
          }}
        >
          {error}
        </p>
      )}

      {plan && <PlanView plan={plan} goals={goals} />}

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
        treatment recommendation. Consult a licensed physician before any medical
        decision. For research purposes only; not for human consumption. Adults 18+.
      </p>
    </div>
  )
}

function PlanView({ plan, goals }: { plan: Plan; goals: string }) {
  return (
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
        {/* Provenance at the point of output. */}
        <span style={{ color: TEAL }}>
          AI-generated · Claude · a plan, not a prescription
        </span>
        <span>{goals.trim() || 'no goal stated'}</span>
      </div>

      {/* Shown, not hidden. A silent correction is one nobody can audit. */}
      {plan.overrides > 0 && (
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 16,
            lineHeight: 1.45,
            borderLeft: `2px solid ${TEAL}`,
            paddingLeft: 12,
            maxWidth: '66ch',
          }}
        >
          {plan.overrides} {plan.overrides === 1 ? 'amount was' : 'amounts were'} replaced.
          Where a peptide has no published human dose this page prints the sentence, not a
          figure — whatever the model proposed.
        </p>
      )}

      {plan.summary && (
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 19,
            lineHeight: 1.4,
            maxWidth: '64ch',
            textWrap: 'pretty',
          }}
        >
          {plan.summary}
        </p>
      )}

      <div style={{ marginTop: 20, borderTop: RULE }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,90px) minmax(0,1fr)',
            gap: '0 16px',
            padding: '8px 0 6px',
            borderBottom: HAIR,
          }}
        >
          <span />
          <span
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr) auto',
              gap: '0 14px',
              fontFamily: JOST,
              fontSize: 9.5,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: INK3,
            }}
          >
            <span>Peptide</span>
            <span>Amount · source</span>
            <span>Time</span>
          </span>
        </div>

        {plan.week.map((day) => (
          <div
            key={day.day}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,90px) minmax(0,1fr)',
              gap: '0 16px',
              padding: '12px 0',
              borderBottom: HAIR,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: JOST,
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: INK3,
              }}
            >
              {day.day}
            </span>
            <div style={{ minWidth: 0 }}>
              {day.doses.map((dose, i) => (
                <div
                  key={`${dose.peptide}-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr) auto',
                    gap: '4px 14px',
                    alignItems: 'baseline',
                    padding: i === 0 ? 0 : '10px 0 0',
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 18 }}>{dose.peptide}</span>
                    {dose.note && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14.5,
                          fontStyle: 'italic',
                          color: INK2,
                        }}
                      >
                        {dose.note}
                      </span>
                    )}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    {/* Mono for a figure, italic serif for the sentence. The
                        two must never be confusable. */}
                    <span
                      style={{
                        fontFamily: dose.isFigure ? MONO : 'inherit',
                        fontSize: dose.isFigure ? 13 : 16,
                        fontStyle: dose.isFigure ? 'normal' : 'italic',
                        lineHeight: 1.4,
                      }}
                    >
                      {dose.amount}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: JOST,
                        fontSize: 9,
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        color: INK3,
                        marginTop: 3,
                      }}
                    >
                      {dose.source}
                    </span>
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: INK2 }}>
                    {dose.time}
                  </span>
                </div>
              ))}
              {day.doses.length === 0 && (
                <span style={{ fontSize: 16, fontStyle: 'italic', color: INK3 }}>
                  Nothing scheduled.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {plan.interactions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Label>Interactions</Label>
          <div style={{ marginTop: 8, borderTop: RULE }}>
            {plan.interactions.map((row, i) => (
              <div
                key={`${row.a}-${row.b}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)',
                  gap: '4px 16px',
                  padding: '10px 0',
                  borderBottom: HAIR,
                  alignItems: 'baseline',
                }}
              >
                <span>
                  <span style={{ fontSize: 17 }}>
                    {row.a} + {row.b}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: JOST,
                      fontSize: 9.5,
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      color: INK3,
                    }}
                  >
                    {LEVEL_LABEL[row.level]}
                  </span>
                </span>
                <span style={{ fontSize: 16, lineHeight: 1.45, color: INK2 }}>{row.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.warnings.length > 0 && (
        <div style={{ marginTop: 24, border: RULE, padding: '18px 20px' }}>
          <Label>Cautions</Label>
          {plan.warnings.map((warning, i) => (
            <p key={i} style={{ margin: '10px 0 0', fontSize: 17, lineHeight: 1.45 }}>
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: JOST,
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: INK3,
      }}
    >
      {children}
    </span>
  )
}
