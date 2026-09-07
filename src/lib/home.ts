// The figures the home page publishes about itself.
//
// The page's whole claim is that it prints numbers rather than adjectives, so
// every number on it is derived here from the catalogue and the vial records
// rather than typed into the markup. A figure typed into a template is a figure
// that goes stale silently — which is exactly how five different dose counts
// ended up in the docs.
//
// The tally deliberately counts the gaps as well as the assays. "17 with a
// purity figure" is only meaningful beside "10 print no purity", and hiding the
// second number would make the first a boast.

import { VIALS } from '@/lib/catalog'
import { COMPOUND_LIST, CATEGORIES } from '@/lib/catalog'
import { doseCounts } from '@/lib/dosing'
import { PRODUCTS, currentLot } from '@/lib/shop/catalogue'

export interface Tally {
  n: string
  label: string
}

export interface VialTally {
  rows: Tally[]
  /** The min–max purity sentence under the grid. Null if nothing is assayed. */
  note: string | null
}

export function vialTally(): VialTally {
  const assayed = VIALS.filter((vial) => vial.purity !== null)
  const undated = VIALS.filter((vial) => !vial.mfg)
  const purities = assayed.map((vial) => vial.purity as number)

  const rows: Tally[] = [
    { n: String(VIALS.length), label: 'vials on file' },
    { n: String(assayed.length), label: 'with a purity figure' },
    // Stated, not omitted. A null is a state, and the page says so.
    { n: String(VIALS.length - assayed.length), label: 'print no purity · shown as such' },
    { n: String(undated.length), label: 'went out undated' },
  ]

  const note = purities.length
    ? `Purity on the assayed batches runs ${Math.min(...purities).toFixed(2)}–${Math.max(
        ...purities,
      ).toFixed(2)}%. The gaps are real and stay visible: a null is a state, not missing data.`
    : null

  return { rows, note }
}

export interface LibraryFigures {
  compounds: number
  categories: number
  /** Entries that state no human dose exists. See src/lib/dosing.ts. */
  noDose: number
  /** Entries carrying an actual amount. Deliberately separate from the above. */
  published: number
}

export function libraryFigures(): LibraryFigures {
  const doses = doseCounts()
  return {
    compounds: COMPOUND_LIST.length,
    categories: CATEGORIES.length,
    noDose: doses.none,
    published: doses.published,
  }
}

/** '6 of 7 assayed · 1 pending, stated on the card'. */
export function shopLine(): string {
  const pending = PRODUCTS.filter(
    (product) => currentLot(product.slug)?.assayState !== 'assayed',
  ).length
  const assayed = PRODUCTS.length - pending
  return `${assayed} of ${PRODUCTS.length} assayed · ${pending} pending, stated on the card`
}
