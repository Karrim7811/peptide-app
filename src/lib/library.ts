// The library, as data.
//
// The library is free to read and needs no account — principle 2 of the V3
// design, and the home page sells it in those words. Until now /reference
// redirected to /login, so the most public page on the site promised something
// the next click refused.
//
// Everything here is pure so the pages stay presentational and the rules that
// matter are testable. The rules:
//
//   • Dosing renders NO_DOSE_LINE for anything without a published figure.
//     Never a dash, never "N/A", never a number borrowed from a rodent study.
//     See src/lib/dosing.ts for why that classification is three-valued.
//   • A batch with no purity says "no purity figure"; one with no date says
//     "undated". Both are states, and the page prints the state.
//   • Grade comes from regulatory status alone. CV is a separate axis and never
//     moves a grade — they are rendered side by side and must not be conflated.

import {
  CATEGORIES,
  CATEGORY_BY_ID,
  COMPOUNDS,
  COMPOUND_LIST,
  vialsFor,
} from '@/lib/catalog'
import type { Compound } from '@/lib/catalog'
import { NO_DOSE_LINE, doseState, noDoseContext } from '@/lib/dosing'
import { PRODUCTS } from '@/lib/shop/catalogue'

/** NAD+ is a coenzyme, B12 a corrinoid, L-carnitine an amino-acid derivative. */
const NOT_PEPTIDE: Record<string, string> = {
  nad: 'a dinucleotide coenzyme',
  'vitamin-b12': 'a corrinoid vitamin',
  'l-carnitine': 'an amino-acid derivative',
}

/** compound id → shop slug, for the cross-link to the assay. */
const SHOP_BY_ID: Record<string, string> = Object.fromEntries(
  PRODUCTS.filter((product) => product.compoundId).map((product) => [
    product.compoundId as string,
    product.slug,
  ]),
)

export interface LibraryRow {
  id: string
  href: string
  name: string
  /** The parenthesised half of fullName, where there is one. */
  brand: string
  category: string
  purpose: string
  grade: string
  cv: number
}

function brandOf(entry: Compound): string {
  return entry.fullName
    .replace(entry.name, '')
    .replace(/^\s*\((.*)\)\s*$/, '$1')
    .trim()
}

export function libraryRow(entry: Compound): LibraryRow {
  return {
    id: entry.id,
    href: `/reference/${entry.id}`,
    name: entry.name,
    brand: brandOf(entry),
    category: entry.category,
    purpose: entry.purpose,
    grade: entry.grade,
    cv: entry.cv,
  }
}

/**
 * Search across name, brand and what the entry is for.
 *
 * Indications are included because people arrive with a symptom rather than a
 * molecule — "sleep" should find something. Matching is substring and
 * case-insensitive; there is no ranking, because a ranked list of 124 entries
 * invites the reader to believe the top one is recommended.
 */
export function searchLibrary(query: string, categoryId?: string | null): LibraryRow[] {
  const needle = query.trim().toLowerCase()
  let entries = COMPOUND_LIST

  if (categoryId) entries = entries.filter((entry) => entry.catId === categoryId)

  if (needle) {
    entries = entries.filter((entry) =>
      [entry.name, entry.fullName, entry.purpose, entry.category, entry.effects]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }

  return entries.map(libraryRow)
}

export interface CategoryChip {
  id: string | null
  name: string
  n: number
}

export function categoryChips(): CategoryChip[] {
  return [
    { id: null, name: 'All', n: COMPOUND_LIST.length },
    ...[...CATEGORIES]
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        id: category.id,
        name: category.name,
        n: COMPOUND_LIST.filter((entry) => entry.catId === category.id).length,
      })),
  ]
}

export interface Fact {
  label: string
  value: string
  mono: boolean
}

export interface BatchRow {
  qty: string
  lot: string
  /** '99.62%', or 'no purity figure'. Never a dash. */
  purity: string
  hasPurity: boolean
}

export interface CompoundView {
  id: string
  name: string
  brand: string
  category: string
  grade: string
  evidence: string
  cv: number
  /** Five booleans, filled up to cv. The score is 0–5 on its own axis. */
  cvDots: boolean[]
  cvNote: string
  notPeptideLine: string | null
  facts: Fact[]
  /** Preclinical or community figures under a no-dose entry. Never a dose. */
  noDoseContext: string | null
  batches: BatchRow[]
  stacks: Array<{ id: string; name: string; href: string }>
  cautions: string
  interactions: string
  /** Where the same thing is sold, so its assay can be read. */
  shopHref: string | null
}

export function compoundView(id: string): CompoundView | null {
  const entry = COMPOUNDS[id]
  if (!entry) return null

  const undosed = doseState(entry) !== 'published'

  const batches: BatchRow[] = vialsFor(entry.id).map((vial) => ({
    qty: `${vial.qty} ${vial.unit}`,
    lot: `${vial.blendOf ? 'blend · ' : ''}${vial.lot} · ${vial.mfg ?? 'undated'}`,
    // A null purity is a state, printed as one. Not 0, not '—'.
    purity: vial.purity === null ? 'no purity figure' : `${vial.purity.toFixed(2)}%`,
    hasPurity: vial.purity !== null,
  }))

  return {
    id: entry.id,
    name: entry.name,
    brand: brandOf(entry),
    category: CATEGORY_BY_ID[entry.catId]?.name ?? entry.category,
    grade: entry.grade,
    evidence: entry.evidence,
    cv: entry.cv,
    cvDots: [0, 1, 2, 3, 4].map((i) => i < entry.cv),
    cvNote: `CV ${entry.cv} of 5 — ${entry.cvNotes}`,
    notPeptideLine: NOT_PEPTIDE[entry.id]
      ? `Not a peptide — ${NOT_PEPTIDE[entry.id]}. Listed because it is commonly discussed alongside them.`
      : null,
    facts: [
      { label: 'Purpose', value: entry.purpose, mono: false },
      { label: 'Mechanism', value: entry.action, mono: false },
      { label: 'Effects', value: entry.effects, mono: false },
      // The load-bearing line. Anything that is not a published figure says so
      // in words rather than showing the source field's shorthand.
      { label: 'Dosing', value: undosed ? NO_DOSE_LINE : entry.dosage, mono: false },
      { label: 'Bottom line', value: entry.bottomLine, mono: false },
    ],
    noDoseContext: noDoseContext(entry),
    batches,
    stacks: (entry.stacksWith ?? [])
      .map((stackId) => COMPOUNDS[stackId])
      .filter((other): other is Compound => Boolean(other))
      .map((other) => ({ id: other.id, name: other.name, href: `/reference/${other.id}` })),
    cautions: entry.cautions,
    interactions: entry.interactions,
    shopHref: SHOP_BY_ID[entry.id] ? `/shop/${SHOP_BY_ID[entry.id]}` : null,
  }
}
