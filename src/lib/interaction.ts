// An interaction answer, as the page is allowed to render it.
//
// The model returns JSON. Every field is untrusted, and one of them is a safety
// label, so the normalising here is not tidying — it is the difference between
// "we could not tell" and "safe".
//
// ── Unknown is not safe ───────────────────────────────────────────────────
//
// A level this code does not recognise becomes `unknown`, never `safe`. The
// two are rendered differently and mean opposite things: `safe` is a claim that
// the literature reports no concern; `unknown` is an admission that nothing was
// found. Defaulting a malformed response to `safe` would turn every parsing
// failure into a reassurance, which is the worst direction for this particular
// field to fail in.
//
// ── Two named things, or nothing ──────────────────────────────────────────
//
// The answer is meaningless without knowing what was compared, so a result with
// no pair is not rendered at all.

export type InteractionLevel = 'safe' | 'caution' | 'danger' | 'unknown'

export const LEVELS: readonly InteractionLevel[] = ['safe', 'caution', 'danger', 'unknown']

/** What the badge says. Deliberately not one word — a word invites a glance. */
export const LEVEL_LABEL: Record<InteractionLevel, string> = {
  safe: 'No interaction reported',
  caution: 'Reported caution',
  danger: 'Reported concern',
  unknown: 'Nothing found',
}

/** What the level means, spelled out so a badge is never read as a verdict. */
export const LEVEL_NOTE: Record<InteractionLevel, string> = {
  safe: 'The literature reports no interaction between these two. That is not the same as a study having looked.',
  caution: 'The literature reports something worth knowing about this pair.',
  danger: 'The literature reports a concern about this pair.',
  unknown:
    'Nothing was found for this pair. Absence of a report is not evidence of safety — it is often evidence that nobody has looked.',
}

export interface InteractionResult {
  level: InteractionLevel
  summary: string
  details: string | null
  recommendations: string[]
}

function str(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export function readInteraction(raw: unknown): InteractionResult | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>

  const summary = str(row.summary, 400)
  // With no summary there is nothing to show but a badge, and a badge on its
  // own is a verdict with no reasoning behind it.
  if (!summary) return null

  const level = row.level
  return {
    level: LEVELS.includes(level as InteractionLevel) ? (level as InteractionLevel) : 'unknown',
    summary,
    details: str(row.details, 4000),
    recommendations: (Array.isArray(row.recommendations) ? row.recommendations : [])
      .map((entry) => str(entry, 400))
      .filter((entry): entry is string => entry !== null)
      .slice(0, 8),
  }
}
