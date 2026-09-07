// What the library actually knows about dosing.
//
// ── Why this module exists ────────────────────────────────────────────────
//
// Five different counts of "how many entries carry a published dose" have been
// written into the docs across as many sessions: 81/43, 49/75, 43/81, 63/61,
// 73/51. None was a transcription error. They disagreed because the question was
// asked as a binary — dosed or not — and the data has three states. Any binary
// rule has to put the middle state on one side, and different rules chose
// differently.
//
// The three states, measured off src/lib/catalog.ts:
//
//   published   26   a real amount: a number attached to a dose unit, from an
//                    FDA label, a regional label, a product PI or a trial.
//   labelOnly   25   defers to a label, a PI, a country or a hospital protocol
//                    without naming an amount. "Product-specific dosing
//                    (endocrinology)". Not a figure, and counting it as one is
//                    what produced the inflated 51 and 81.
//   none        73   no human dose. 25 say so in researched prose, 48 are the
//                    spreadsheet port's "N/A".
//
// Only `published` may ever render a number. The other two render NO_DOSE_LINE.
//
// ── Why the no-dose test is anchored ──────────────────────────────────────
//
// The earlier classifier matched /no .{0,45} dose/ anywhere in the prose. That
// is wrong in both directions: it caught "no pediatric dose has been
// established" inside an entry with a perfectly good adult label, and it
// discarded cited figures sitting inside otherwise no-dose entries. The
// statement that no dose exists is made at the start of the field or not at all,
// so the test is anchored there.
//
// ── The figures that survive a no-dose entry ──────────────────────────────
//
// Ten of the 25 researched no-dose entries go on to cite something real —
// rodent mg/kg, a discontinued Phase 1 range, a community protocol. Discarding
// that was not acceptable, and printing it as an amount was less so. It comes
// back from noDoseContext() to be rendered under the no-dose line, rule-
// separated and labelled as not a dose.

import type { Compound } from '@/lib/catalog'
import { COMPOUND_LIST } from '@/lib/catalog'

/** The only sentence any un-dosed entry is allowed to render. Never a dash, never "N/A". */
export const NO_DOSE_LINE = 'No human dose established.'

export type DoseState = 'published' | 'labelOnly' | 'none'

/**
 * An opening statement that no dose exists. Anchored to the start of the field:
 * a later "no pediatric dose" inside a dosed entry must not match.
 */
const NO_DOSE_OPENING =
  /^\s*(?:n\/a\b|none\b|no\b[^.]{0,70}?\bdos(?:e|ing|age)\b|no\s+(?:established|standard|published|approved|human)\b)/i

/** Defers to a label or a protocol without naming an amount. */
const DEFERS_TO_LABEL =
  /^\s*(?:(?:product|country|region|formulation|protocol|indication)[-/ ]?(?:and|or|\/)?\s*(?:specific|dependent)|labell?ed dosing varies|dosing varies|hospital protocols|per local prescribing|topical (?:concentrations|product)|oral\/iv protocols|not dosed\b|.{0,40}\bvar(?:y|ies)\b)/i

/** A number attached to a dose unit. */
const FIGURE = /\d[\d.,]*\s*(?:–|-|to\s)?\s*[\d.,]*\s*(?:mcg|µg|ug|mg|g\b|iu\b|units?\b)/i

export function doseState(entry: Pick<Compound, 'dosage'>): DoseState {
  const text = (entry.dosage ?? '').trim()
  // Order matters. A no-dose entry that cites rodent mg/kg would otherwise be
  // read as dosed by the figure test below.
  if (NO_DOSE_OPENING.test(text)) return 'none'
  if (DEFERS_TO_LABEL.test(text)) return 'labelOnly'
  if (FIGURE.test(text)) return 'published'
  // No statement, no deferral, no number. Nothing to publish.
  return 'labelOnly'
}

/** True only where an actual amount can be shown. */
export function hasPublishedDose(entry: Pick<Compound, 'dosage'>): boolean {
  return doseState(entry) === 'published'
}

/**
 * What a no-dose entry says after saying it. Rodent work, a discontinued
 * programme, a community protocol — real, cited, and not a dose. Null when the
 * entry stops at the disclaimer, which most do.
 */
export function noDoseContext(entry: Pick<Compound, 'dosage'>): string | null {
  if (doseState(entry) !== 'none') return null
  const text = (entry.dosage ?? '').trim()
  // Everything after the first sentence. The first sentence is the disclaimer
  // and is replaced by NO_DOSE_LINE at render time.
  const rest = text.replace(/^[^.]*\.\s*/, '').trim()
  if (!rest || rest === text) return null
  return FIGURE.test(rest) ? rest : null
}

export interface DoseCounts {
  total: number
  published: number
  labelOnly: number
  none: number
}

/**
 * Counted live off the catalogue, never hard-coded. Every stale number in the
 * docs got there by being written down once and then diverging quietly.
 */
export function doseCounts(entries: Compound[] = COMPOUND_LIST): DoseCounts {
  const counts: DoseCounts = { total: entries.length, published: 0, labelOnly: 0, none: 0 }
  for (const entry of entries) counts[doseState(entry)]++
  return counts
}

// ── Where a figure comes from ─────────────────────────────────────────────
//
// A figure without its source is indistinguishable from a recommendation. The
// dosing reference prints one beside every row, and where nothing can be cited
// the row says that instead of leaving the column blank.
//
// Derived from the entry rather than stored, which is a compromise: the
// catalogue should carry a real source field, and until it does this reads the
// regulatory grade and the shape of the prose. It is honest about the class of
// source ("FDA label", "Published trial") and does not invent a citation.

export interface DoseSource {
  /** The class of source. Short, for the label above the reference. */
  kind: string
  /** What to look at. Never a fabricated citation. */
  ref: string
}

export function doseSource(entry: Pick<Compound, 'dosage' | 'fullName' | 'name' | 'grade'>): DoseSource {
  const text = entry.dosage ?? ''
  const brand = (entry.fullName.match(/\(([^)]+)\)/) ?? [])[1] ?? ''
  const named = (text.match(/\(([^)]+)\)/) ?? [])[1]

  if (doseState(entry) === 'none') {
    return { kind: 'Nothing to cite', ref: 'research-tier · no approval' }
  }
  if (/product PI|see product|product-specific|indication-specific|country-specific|protocol|prescribing information/i.test(text)) {
    return { kind: 'PI', ref: 'Product prescribing information' }
  }
  if (/topical|cosmetic/i.test(text)) {
    return { kind: 'Product', ref: 'Product labelling · topical' }
  }
  if (entry.grade === 'A') {
    return { kind: 'FDA label', ref: named || brand.split('/')[0] || entry.name }
  }
  if (entry.grade === 'B') {
    return { kind: 'Regional label', ref: named || brand.split('/')[0] || entry.name }
  }
  return { kind: 'Published trial', ref: named || 'Human trial report' }
}
