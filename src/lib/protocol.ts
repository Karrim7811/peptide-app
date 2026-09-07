// The protocol plan, as the page is allowed to render it.
//
// ── Why the renderer does not trust the model ─────────────────────────────
//
// src/lib/ai-dose-guardrail.ts tells the model, in the imperative and with all
// 98 names attached, never to put a number against a peptide that has no
// published human dose. That is a prompt. Prompts are asked, not enforced.
//
// This module is the enforcement. Every amount that comes back is checked
// against the same classifier the library and the dosing reference use, and an
// amount for an un-dosed peptide is REPLACED with the no-dose sentence before
// anything reaches the screen. The model can be wrong; the page cannot.
//
// That makes three layers: the prompt asks, this replaces, and a test proves
// the replacement happens. The design handoff singles out BPC-157 in the sample
// plan as exactly this case, and there is a test for it by name.
//
// ── Everything here is untrusted input ────────────────────────────────────
//
// It is JSON parsed out of model output. Fields are missing, wrongly typed, or
// absent entirely. Nothing is assumed and nothing throws — a malformed row is
// dropped, a malformed plan renders as an empty plan.

import { COMPOUND_LIST } from '@/lib/catalog'
import { NO_DOSE_LINE, doseSource, doseState } from '@/lib/dosing'
import { resolveCompoundId } from '@/lib/mirror/mapping'

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export interface PlanDose {
  peptide: string
  /** A real amount, or NO_DOSE_LINE. Never a number for an un-dosed peptide. */
  amount: string
  /** True where `amount` is an actual figure. Drives mono vs italic serif. */
  isFigure: boolean
  /** 'FDA label · Wegovy', or 'nothing to cite · research-tier · no approval'. */
  source: string
  time: string
  note: string | null
  /** True where the model proposed a number this module removed. */
  wasOverridden: boolean
}

export interface PlanDay {
  day: string
  doses: PlanDose[]
}

export interface Interaction {
  a: string
  b: string
  level: 'safe' | 'caution' | 'danger'
  note: string
}

export interface Plan {
  week: PlanDay[]
  interactions: Interaction[]
  warnings: string[]
  summary: string | null
  /** How many amounts had to be replaced. Surfaced, never hidden. */
  overrides: number
}

function str(value: unknown, max = 300): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

/** The library entry a model-supplied name refers to, if any. */
function entryFor(name: string) {
  const id = resolveCompoundId(name)
  return id ? COMPOUND_LIST.find((compound) => compound.id === id) : undefined
}

/**
 * One scheduled dose, with the amount checked against the catalogue.
 *
 * An unknown peptide is treated as un-dosed. That is deliberate: a name this
 * codebase cannot resolve is a name whose dosing status it cannot vouch for,
 * and printing a model's figure for it would be the exact failure this module
 * exists to prevent.
 */
export function planDose(raw: unknown): PlanDose | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>

  const peptide = str(row.peptide, 80)
  if (!peptide) return null

  const proposed = str(row.dose, 80)
  const entry = entryFor(peptide)
  const publishable = entry ? doseState(entry) === 'published' : false

  if (publishable && entry) {
    const source = doseSource(entry)
    return {
      peptide,
      // The catalogue's figure, not the model's. Even where a figure is
      // permitted, the published one is the one with a source behind it.
      amount: entry.dosage,
      isFigure: true,
      source: `${source.kind} · ${source.ref}`,
      time: str(row.time, 40) ?? 'Unspecified',
      note: str(row.notes, 200),
      wasOverridden: proposed !== null && proposed !== entry.dosage,
    }
  }

  return {
    peptide,
    amount: NO_DOSE_LINE,
    isFigure: false,
    source: entry
      ? 'nothing to cite · research-tier · no approval'
      : 'not in the library · nothing to cite',
    time: str(row.time, 40) ?? 'Unspecified',
    note: str(row.notes, 200),
    // The thing worth counting: the model proposed an amount and it was removed.
    wasOverridden: proposed !== null,
  }
}

export function readPlan(raw: unknown): Plan {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const byDay = new Map<string, PlanDose[]>()
  const schedule = Array.isArray(root.weeklySchedule) ? root.weeklySchedule : []

  for (const entry of schedule) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const day = str(row.day, 20)
    if (!day) continue
    const match = DAYS.find((candidate) => candidate.toLowerCase() === day.toLowerCase())
    if (!match) continue

    const doses = (Array.isArray(row.doses) ? row.doses : [])
      .map(planDose)
      .filter((dose): dose is PlanDose => dose !== null)

    byDay.set(match, [...(byDay.get(match) ?? []), ...doses])
  }

  // Always seven rows. A week with Thursday missing is a rendering bug that
  // looks like a plan.
  const week: PlanDay[] = DAYS.map((day) => ({ day, doses: byDay.get(day) ?? [] }))

  const interactions: Interaction[] = (Array.isArray(root.interactions) ? root.interactions : [])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const row = entry as Record<string, unknown>
      const a = str(row.peptideA, 80)
      const b = str(row.peptideB, 80)
      const note = str(row.note, 400)
      if (!a || !b || !note) return null
      const level = row.level
      return {
        a,
        b,
        // Anything unrecognised is caution, not safe. Failing open on a safety
        // label is the wrong direction to fail.
        level:
          level === 'safe' || level === 'caution' || level === 'danger' ? level : 'caution',
        note,
      } as Interaction
    })
    .filter((row): row is Interaction => row !== null)

  const warnings = (Array.isArray(root.warnings) ? root.warnings : [])
    .map((entry) => str(entry, 400))
    .filter((entry): entry is string => entry !== null)

  return {
    week,
    interactions,
    warnings,
    summary: str(root.summary, 800),
    overrides: week.reduce(
      (total, day) => total + day.doses.filter((dose) => dose.wasOverridden).length,
      0,
    ),
  }
}
