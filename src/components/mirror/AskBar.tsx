'use client'

// The Mirror's footer — ask input, suggestion chips, hint line.
//
// Doubles as compound search: an exact or prefix match navigates straight to
// the compound. Otherwise it pattern-matches supply / interactions / labs /
// cycle intents and answers, moving the view as it answers — ported from the
// prototype's `answerFor()` (design_handoff_peptide_cortex/Peptide Cortex
// Mirror.dc.html, ~lines 859–928), rewired onto `ent` so every gated claim
// (supply comparison, cross-stack synthesis, labs, adherence) goes through the
// same accessor the rest of the Mirror uses — this file has no gating logic
// of its own.
//
// The prototype shows its answer bubble ("CORTEX ANSWERED") docked above the
// region list in the aside panel. MirrorPanel's contract (layer, regionId,
// compoundId, ent, onSelectCompound, onOpenVerify) has no slot for it, so this
// component owns the answer as local state and renders it in the footer band
// itself, directly above the input — same content, adjacent surface.

import { useState } from 'react'
import { CATEGORIES, COMPOUNDS, COMPOUND_LIST, COUNTS, MARKERS, type Compound } from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'

export interface AskBarProps {
  ent: Entitlements
  onNavigate: (target: { compoundId?: string; regionId?: string }) => void
}

interface Answer {
  text: string
  cite: string
}

function markerOff(m: { value: number; low: number; high: number }): boolean {
  return m.value < m.low || m.value > m.high
}

/** Every resolved stack entry, across every category — `ent` only answers per-category. */
function resolvedStack(ent: Entitlements) {
  return CATEGORIES.flatMap((c) => ent.resolvedIn(c.id))
}

function findCompound(query: string): Compound | null {
  const hit = COMPOUND_LIST.find((c) => {
    const name = c.name.toLowerCase()
    return name === query || name.startsWith(query)
  })
  return hit ?? null
}

function answerFor(
  raw: string,
  ent: Entitlements,
  onNavigate: (target: { compoundId?: string; regionId?: string }) => void,
): Answer | null {
  const q = raw.trim().toLowerCase()
  if (!q) return null

  // The ask bar is also the search field — an exact or prefix match wins first.
  const hit = findCompound(q)
  if (hit) {
    onNavigate({ compoundId: hit.id })
    return {
      text: `${hit.name} — ${hit.action} The library grades it ${hit.grade} (${hit.evidence}).`,
      cite: hit.bottomLine,
    }
  }

  if (q.includes('supply') || q.includes('decision') || q.includes('run out') || q.includes('reorder')) {
    if (ent.isFree) {
      return {
        text:
          `I can only weigh supply across compounds I can resolve, and right now that is ` +
          `${ent.resolvedCount === 1 ? 'one' : ent.resolvedCount}. ${ent.lockedCount} more are on your field but ` +
          `locked — the comparison that finds the real decision needs all of them.`,
        cite: `FREE TIER · ${ent.resolvedCount} OF ${ent.stackCount} RESOLVED`,
      }
    }
    const held = resolvedStack(ent)
    const low = [...held].sort((a, b) => a.supplyDays - b.supplyDays)[0]
    if (!low) {
      return { text: 'Nothing in your stack yet to weigh a supply decision against.', cite: 'FROM YOUR INVENTORY' }
    }
    const c = COMPOUNDS[low.id]
    const cycle = ent.cycleReport()
    onNavigate({ regionId: c?.catId })
    return {
      text:
        `${c?.name ?? low.id} has about ${low.supplyDays} days left at your logged rate, against ` +
        `${cycle ? cycle.daysLeft : '—'} days remaining in the cycle. Everything else in your stack has more ` +
        `than a fortnight.`,
      cite: 'FROM YOUR INVENTORY AND DOSE LOG · NOT A DOSING INSTRUCTION',
    }
  }

  if (q.includes('together') || q.includes('interaction') || q.includes('safe') || q.includes('stack')) {
    // Interaction text is a safety surface — readable at every tier, even for locked
    // compounds. Only the cross-stack synthesis below is gated.
    if (ent.isFree) {
      return {
        text:
          `Every compound’s own interaction and caution text stays readable, locked or not — open any node ` +
          `to see it. What I cannot do on Free is weigh them against each other, because that needs the whole ` +
          `stack resolved.`,
        cite: 'SAFETY TEXT IS NEVER GATED · VERIFY AGAINST PRIMARY LITERATURE AND A PHYSICIAN',
      }
    }
    const pool = resolvedStack(ent)
    const pairs = (pool.length * (pool.length - 1)) / 2
    const flagged = pool.filter((x) => !(COMPOUNDS[x.id]?.interactions ?? '').toLowerCase().includes('no well-'))
    return {
      text:
        `${pairs} pairs across your ${pool.length} compounds. ${flagged.length} of them carry documented ` +
        `interaction notes in the library — read each on its own node rather than trusting a single verdict.`,
      cite: `INTERACTION TEXT IS THE LIBRARY’S OWN · VERIFY AGAINST PRIMARY LITERATURE AND A PHYSICIAN`,
    }
  }

  if (q.includes('lab') || q.includes('blood') || q.includes('marker')) {
    if (ent.isFree) {
      return {
        text:
          `Bloodwork is a Pro capability. It re-tunes the whole form against your real values, and that only ` +
          `means something once every compound is resolved — right now ${ent.lockedCount} of yours are locked.`,
        cite: 'FREE TIER · BLOODWORK NOT ATTACHED',
      }
    }
    const markers = ent.markers(MARKERS)
    if (markers.length === 0) {
      return {
        text: 'No bloodwork attached yet. Attach it from the field to re-tune the form against your real values.',
        cite: 'BLOODWORK NOT ATTACHED',
      }
    }
    const off = markers.filter(markerOff)
    return {
      text:
        `${markers.length} markers attached. ${off.length} sit outside range` +
        `${off.length ? ' — ' + off.map((m) => m.label).join(', ') : ''}. Those goals have been re-tuned on ` +
        `the form; the rest are unchanged.`,
      cite: `MARKER KEYS AND UNITS AS DEFINED IN THE APP’S OWN MARKER CATALOG · NOT A DIAGNOSIS`,
    }
  }

  if (q.includes('cycle') || q.includes('washout')) {
    const report = ent.cycleReport()
    if (!report) return { text: 'No cycle on record yet.', cite: 'FROM YOUR CYCLE RECORD' }
    return {
      text: `Day ${report.day} of ${report.length}, started ${report.start}. Washout opens ${report.washout}. ${report.adherenceLine}`,
      cite: ent.isFree ? 'FROM YOUR CYCLE RECORD · FREE TIER' : 'FROM YOUR CYCLE RECORD',
    }
  }

  return {
    text:
      `I answer from what is on your field: ${COUNTS.compounds} compounds in the library, ${ent.stackCount} in ` +
      `your stack,  goals. Name a compound, or ask about supply, labs, the cycle, or how ` +
      `things sit together.`,
    cite: 'CORTEX ANSWERS FROM YOUR OWN DATA AND THE REFERENCED LIBRARY',
  }
}

const SUGGESTIONS: ReadonlyArray<{ label: string; ask: string; query: string }> = [
  { label: 'NEEDS A DECISION?', ask: 'What needs a decision?', query: 'supply' },
  { label: 'SIT WELL TOGETHER?', ask: 'Do these sit well together?', query: 'together' },
  { label: 'READ MY LABS', ask: 'Read my labs', query: 'labs' },
  { label: 'WHERE IS THE CYCLE?', ask: 'Where is the cycle?', query: 'cycle' },
]

export default function AskBar({ ent, onNavigate }: AskBarProps) {
  const [ask, setAsk] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)

  function run(query: string) {
    setAnswer(answerFor(query, ent, onNavigate))
  }

  function submit() {
    run(ask)
  }

  return (
    <div className="flex flex-col">
      {answer && (
        <div className="flex flex-col gap-[10px] border-b border-hair bg-panel px-[22px] py-5" style={{ animation: 'cxup 380ms cubic-bezier(.2,.7,.2,1) both' }}>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] tracking-[0.24em] text-accent">CORTEX ANSWERED</span>
            <button
              type="button"
              onClick={() => setAnswer(null)}
              className="min-h-[44px] font-mono text-[10px] tracking-[0.12em] text-faint hover:text-ink"
            >
              DISMISS
            </button>
          </div>
          <p className="text-[15px] leading-[1.75] text-ink">{answer.text}</p>
          <span className="font-mono text-[9.5px] leading-[1.7] tracking-[0.1em] text-faint">{answer.cite}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-[10px] px-[14px] py-3">
        <div className="flex h-12 min-w-[260px] flex-1 basis-[420px] items-center gap-3 border border-accentDim bg-accentWash px-4">
          <span className="font-mono text-[12px] text-accent">&rsaquo;</span>
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={`Ask, or search ${COUNTS.compounds} compounds`}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="-mr-[6px] flex min-h-[44px] items-center whitespace-nowrap px-[6px] font-mono text-[10px] tracking-[0.14em] text-accent"
          >
            ASK →
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setAsk(s.ask)
                run(s.query)
              }}
              className="flex min-h-[44px] items-center whitespace-nowrap border border-hair px-[14px] font-mono text-[10px] tracking-[0.08em] text-dim hover:text-ink"
            >
              {s.label}
            </button>
          ))}
        </div>

        <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.12em] text-faint">
          SCROLL OVER THE FORM = ZOOM · ESC = OUT
        </span>
      </div>
    </div>
  )
}
