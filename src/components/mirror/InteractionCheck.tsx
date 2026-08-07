'use client'

// Contextual interaction check tool, mounted on the compound view (Layer 3).
//
// Two different claims live in this component and they are gated completely
// differently:
//
//   1. The compound's OWN documented-interactions prose — `compound.interactions`
//      from the catalog. This is safety text. The pricing page prints
//      "cautions, contraindications and documented interactions" as NEVER
//      paywalled, and MirrorPanel already repeats that promise in its own
//      "WHAT THE LIBRARY SAYS" block. This component renders it again, first,
//      unconditionally — no tier check, no `ent.held()`, not even a null
//      check on `entry` — because it must show for a compound the user does
//      not own at all, let alone a locked one.
//
//   2. The AI CROSS-CHECK against a second, arbitrary compound — any peptide,
//      Rx, supplement or OTC, in the library or free-typed. This calls
//      POST /api/check-interaction, which enforces FREE_LIMITS.interactionChecksPerDay
//      server-side and logs to `interaction_checks`. This component does NOT
//      keep its own counter as a gate — the only source of truth for "have I
//      hit the limit" is the route's own 429 { code: 'RATE_LIMIT' } response,
//      surfaced verbatim. `ent.isFree` is used only for a display hint above
//      the button, never to block the request client-side.
//
// Verdict copy is deliberately never framed as clearance to combine anything:
// the API's own "safe" level is relabeled "NO DOCUMENTED INTERACTION FOUND"
// rather than any synonym for safe, and is paired with an explicit note that
// an absence of a documented interaction is not evidence of safety.
//
// Shape matched to LogDoseButton.tsx: closed by default, expands in place.

import { useState } from 'react'
import { COMPOUNDS, COMPOUND_LIST } from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'
// From tier.ts, not subscription.ts — the latter pulls next/headers through the
// Supabase server client and cannot be imported from a client component.
import { FREE_LIMITS } from '@/lib/tier'
import { useAiConsent } from '@/components/AiConsentProvider'

export interface InteractionCheckProps {
  compoundId: string
  ent: Entitlements
}

interface CheckResult {
  level: 'safe' | 'caution' | 'danger' | 'unknown'
  summary: string
  details: string
  recommendations: string[]
}

/**
 * Never a synonym for "safe to combine" — "safe" from the API becomes
 * "no documented interaction found", which is a claim about the literature,
 * not a clearance.
 */
const LEVEL_COPY: Record<CheckResult['level'], { label: string; color: string }> = {
  safe: { label: 'NO DOCUMENTED INTERACTION FOUND', color: 'text-dim' },
  caution: { label: 'INTERACTION DOCUMENTED · CAUTION', color: 'text-gold' },
  danger: { label: 'INTERACTION DOCUMENTED · SIGNIFICANT', color: 'text-gold' },
  unknown: { label: 'NOT WELL DOCUMENTED', color: 'text-faint' },
}

const DISCLAIMER =
  'EDUCATIONAL REFERENCE ONLY · CORTEX DESCRIBES HOW COMPOUNDS ARE STUDIED · IT DOES NOT DIAGNOSE, TREAT OR PRESCRIBE.'

export default function InteractionCheck({ compoundId, ent }: InteractionCheckProps) {
  const compound = COMPOUNDS[compoundId]
  const { requireConsent } = useAiConsent()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [checkedAgainst, setCheckedAgainst] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limitHit, setLimitHit] = useState(false)

  if (!compound) return null

  const q = query.trim().toLowerCase()
  const suggestions = q
    ? COMPOUND_LIST.filter((c) => c.id !== compoundId && c.name.toLowerCase().includes(q)).slice(0, 8)
    : []

  async function runCheck(raw: string) {
    const target = raw.trim()
    if (!target || pending) return

    const consented = await requireConsent()
    if (!consented) return

    setPending(true)
    setError(null)
    setLimitHit(false)
    setResult(null)

    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemA: compound!.name, itemB: target }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        // The route is the only source of truth on the limit — surface its
        // response rather than deciding client-side whether to allow the call.
        if (res.status === 429 || data?.code === 'RATE_LIMIT') {
          setLimitHit(true)
          setError(data?.error ?? 'Daily AI cross-check limit reached.')
        } else if (res.status === 401 || data?.code === 'AUTH_REQUIRED') {
          setError('Sign in to run an AI cross-check.')
        } else {
          setError(data?.error ?? 'Could not check that interaction. Please try again.')
        }
        return
      }

      setResult(data as CheckResult)
      setCheckedAgainst(target)
    } catch {
      setError('Could not reach Cortex. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Claim (1): the library's own interaction text. Unconditional — no
          tier check, no ownership check, no held()/entry gate of any kind. */}
      <div className="flex flex-col gap-[5px]">
        <span className="font-mono text-[9px] tracking-[0.16em] text-faintest">
          DOCUMENTED INTERACTIONS · {compound.name.toUpperCase()}
        </span>
        <p className="text-[14px] leading-[1.75] text-dim">{compound.interactions}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-dim hover:text-ink"
      >
        {open ? 'CLOSE CROSS-CHECK' : 'CHECK AGAINST SOMETHING ELSE'}
      </button>

      {open && (
        <div className="flex flex-col gap-3 bg-panel p-[14px]">
          <span className="font-mono text-[9px] tracking-[0.16em] text-faintest">
            {compound.name.toUpperCase()} &harr; ANYTHING ELSE &mdash; PEPTIDE, RX, SUPPLEMENT OR OTC
          </span>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSuggestOpen(true)
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setSuggestOpen(false)
                  runCheck(query)
                }
              }}
              placeholder="e.g. Ibuprofen, Metformin, TB-500…"
              className="min-h-[44px] w-full border border-hair bg-panelHi px-3 text-[14px] text-ink placeholder:text-faint focus:outline-none focus:border-accentDim"
            />
            {suggestOpen && suggestions.length > 0 && (
              <div className="absolute top-full z-20 mt-1 max-h-52 w-full overflow-y-auto border border-hair bg-panelHi">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => {
                      setQuery(c.name)
                      setSuggestOpen(false)
                    }}
                    className="flex min-h-[38px] w-full items-center px-3 text-left text-[13px] text-dim hover:bg-panelHot hover:text-ink"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => runCheck(query)}
            disabled={pending || !query.trim()}
            className="min-h-[44px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
          >
            {pending ? 'ASKING CORTEX…' : 'RUN AI CROSS-CHECK'}
          </button>

          {/* Display hint only — the free-tier count itself is never tracked
              here, and this text never decides whether the button is enabled. */}
          {ent.isFree && !error && (
            <span className="font-mono text-[9.5px] leading-[1.7] tracking-[0.06em] text-faintest">
              FREE TIER · UP TO {FREE_LIMITS.interactionChecksPerDay} AI CROSS-CHECKS/DAY · ENFORCED SERVER-SIDE
            </span>
          )}

          {error && (
            <div
              className={`flex flex-col gap-[6px] border-l-2 ${limitHit ? 'border-gold' : 'border-hair'} bg-panelHot px-[14px] py-3`}
            >
              <span role="alert" className={`font-mono text-[10px] tracking-[0.1em] ${limitHit ? 'text-gold' : 'text-faint'}`}>
                {error}
              </span>
              {limitHit && (
                <a href="/pricing" className="font-mono text-[9.5px] tracking-[0.1em] text-accent">
                  UPGRADE FOR UNLIMITED CROSS-CHECKS →
                </a>
              )}
            </div>
          )}

          {result && checkedAgainst && (
            <div className="flex flex-col gap-3 border-l-2 border-hair pl-[14px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[9px] tracking-[0.2em] text-faintest">
                  {compound.name.toUpperCase()} &harr; {checkedAgainst.toUpperCase()}
                </span>
                <span className={`font-mono text-[9.5px] tracking-[0.14em] ${LEVEL_COPY[result.level]?.color ?? 'text-faint'}`}>
                  {LEVEL_COPY[result.level]?.label ?? 'NOT WELL DOCUMENTED'}
                </span>
              </div>

              <p className="text-[14px] leading-[1.75] text-ink">{result.summary}</p>
              <p className="text-[13.5px] leading-[1.75] text-dim">{result.details}</p>

              {result.recommendations?.length > 0 && (
                <ul className="flex flex-col gap-[6px]">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.6] text-dim">
                      <span className="text-accent">&middot;</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="font-mono text-[10px] leading-[1.8] tracking-[0.06em] text-faint">
                {result.level === 'safe'
                  ? 'AN ABSENCE OF A DOCUMENTED INTERACTION IS NOT EVIDENCE THESE ARE SAFE TOGETHER — IT MEANS CORTEX FOUND NOTHING DOCUMENTED, NOT THAT NOTHING EXISTS.'
                  : 'THIS DESCRIBES WHAT IS DOCUMENTED, NOT A CLEARANCE OR REFUSAL TO COMBINE ANYTHING.'}
              </p>
            </div>
          )}

          <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">{DISCLAIMER}</p>
        </div>
      )}
    </div>
  )
}
