// View models for the shop.
//
// One place that turns PRODUCTS + LOTS into exactly what a card or a product
// page renders, so the components stay presentational and the rules that matter
// are testable without a browser.
//
// The rules encoded here rather than in JSX, because a rule in a template is a
// rule someone edits away while tidying markup:
//
//   • A blend has no unit price. `unitPrice` is null and `unitPriceNote` says
//     why, so the card has something to render rather than a gap.
//   • A pending lot publishes no figure. `purity` is null — never 0, never '—'.
//   • Everything numeric arrives pre-formatted, so two components cannot format
//     the same number two ways.

import { COMPOUNDS } from '@/lib/catalog'
import { PRODUCTS, assayHistory, currentLot, lotsFor } from '@/lib/shop/catalogue'
import { formatPrice, formatUnitPrice } from '@/lib/shop/pricing'
import type { Component, ShopLot, ShopProduct } from '@/lib/shop/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** '2026-01' → 'January 2026'. Returns null for anything unparseable. */
export function monthName(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}$/.test(iso)) return null
  const [year, month] = iso.split('-').map(Number)
  const name = MONTHS[month - 1]
  return name ? `${name} ${year}` : null
}

/**
 * Two decimals, always. The lab reports 11.20 and this page's whole argument is
 * that it prints what the lab said — trimming to 11.2 is a small unforced
 * inaccuracy, and in a column of measured figures it also breaks the alignment
 * that makes the column readable. Whole numbers keep their own form: a 30 mg
 * label is 30, not 30.00.
 */
export function mg(value: number | null): string | null {
  if (value === null || Number.isNaN(value)) return null
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function pct(value: number | null): string | null {
  if (value === null || Number.isNaN(value)) return null
  return `${Number(value.toFixed(3))}%`
}

export interface ShopCard {
  index: string
  slug: string
  href: string
  name: string
  subtitle: string
  purpose: string
  size: string
  price: string
  /** Null for a blend. Never a placeholder string — the UI decides how to say so. */
  unitPrice: string | null
  unitPriceNote: string | null
  state: 'assayed' | 'pending' | 'none'
  isBlend: boolean
  purity: string | null
  measured: string | null
  labelled: string | null
  components: Array<{ name: string; mg: string }>
  lot: string | null
  dates: string | null
  /** 'Expected October 2026', when pending. */
  expected: string | null
}

function purposeOf(product: ShopProduct): string {
  if (product.compoundId) return COMPOUNDS[product.compoundId]?.purpose ?? ''
  return product.blendOf ? 'Blend' : ''
}

function componentsOf(lot: ShopLot): Array<{ name: string; mg: string }> {
  return (lot.components ?? []).map((c: Component) => ({ name: c.name, mg: mg(c.mg) ?? '' }))
}

export function shopCard(product: ShopProduct, index: number): ShopCard {
  const lot = currentLot(product.slug)
  const isBlend = Boolean(product.blendOf)
  const unitPrice = formatUnitPrice(product)

  return {
    index: String(index).padStart(2, '0'),
    slug: product.slug,
    href: `/shop/${product.slug}`,
    name: product.name,
    subtitle: product.subtitle,
    purpose: purposeOf(product),
    size: `${product.sizeValue} ${product.sizeUnit}`,
    price: formatPrice(product.priceCents),
    unitPrice,
    // A blend gets a reason rather than an empty cell. Spec §5: a price per
    // milligram of a four-molecule mixture is meaningless, so we say that.
    unitPriceNote: unitPrice ? null : 'no per-mg · blend',
    state: lot?.assayState ?? 'none',
    isBlend,
    purity: lot?.assayState === 'assayed' && !isBlend ? pct(lot.purityPct) : null,
    measured: mg(lot?.measuredTotalMg ?? null),
    labelled: mg(lot?.labelMg ?? null),
    components: lot ? componentsOf(lot) : [],
    lot: lot?.lotCode ?? null,
    dates: lot?.mfg && lot?.exp ? `${lot.mfg} · ${lot.exp}` : null,
    expected: lot?.assayState === 'pending' ? monthName(lot.assayExpectedAt) : null,
  }
}

/**
 * The catalogue, in `sortOrder`. Never sorted by price or unit price — per-mg
 * compares within a compound, so ranking the grid by it would be misleading.
 * There is deliberately no comparator parameter.
 */
export function shopCards(): ShopCard[] {
  return PRODUCTS.filter((p) => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((product, i) => shopCard(product, i + 1))
}

export interface HistoryRow {
  lot: string | null
  purity: string | null
  measured: string | null
  mfg: string | null
  isCurrent: boolean
}

/**
 * Every assayed batch, current first. Empty for a product with one batch —
 * an archive of one is not a record, and the page should show nothing rather
 * than a table with a single row.
 */
export function historyRows(slug: string): HistoryRow[] {
  return assayHistory(slug).map((lot) => ({
    lot: lot.lotCode,
    purity: pct(lot.purityPct),
    measured: mg(lot.measuredTotalMg),
    mfg: lot.assayedAt,
    isCurrent: lot.isCurrent,
  }))
}

export interface Ledger {
  rows: HistoryRow[]
  /** 'low 99.466% · high 99.736%'. Empty when there is nothing assayed. */
  range: string
  /** 'every batch ≥ 99.466%'. Only meaningful across more than one batch. */
  floor: string
  /** The sentence under the ledger, which differs by what the ledger contains. */
  note: string
}

export interface ProductView extends ShopCard {
  action: string | null
  bottomLine: string | null
  /** Named components of a blend, with what each is for. */
  blendParts: Array<{ name: string; purpose: string }>
  /** True where the entry is in the library but is not actually a peptide. */
  notAPeptide: string | null
  history: HistoryRow[]
  batchCount: number
  ledger: Ledger
}

/**
 * The ledger's summary lines.
 *
 * The floor is the claim that carries: one certificate covers one vial, a run
 * covers a supplier. It only exists across more than one batch, so a product
 * with a single assay gets the range and no floor rather than a floor of one.
 */
export function ledgerFor(slug: string, isBlend: boolean, state: ShopLot['assayState']): Ledger {
  const rows = historyRows(slug)
  const assayed = lotsFor(slug).filter((l) => l.assayState === 'assayed' && l.purityPct !== null)
  const purities = assayed.map((l) => l.purityPct as number)

  const lo = purities.length ? Math.min(...purities) : null
  const hi = purities.length ? Math.max(...purities) : null

  let note = ''
  if (state === 'pending') {
    note = 'Nothing on the ledger yet. The first row is written when the lab returns.'
  } else if (isBlend) {
    note =
      'Four molecules in one vial, each measured separately. A blend has no single purity figure to quote.'
  } else if (rows.length > 1) {
    note =
      'Every batch we have shipped, with its assay. One certificate covers one vial; a run covers a supplier.'
  } else {
    note = 'First batch on the ledger. It grows by one row each time a batch ships and returns.'
  }

  return {
    rows,
    range: lo !== null && hi !== null ? `low ${pct(lo)} · high ${pct(hi)}` : '',
    floor: purities.length > 1 ? `every batch ≥ ${pct(lo)}` : '',
    note,
  }
}

/** NAD+ is a coenzyme, B12 a corrinoid, L-carnitine an amino-acid derivative. */
const NOT_PEPTIDE: Record<string, string> = {
  nad: 'a dinucleotide coenzyme',
  'vitamin-b12': 'a corrinoid',
  'l-carnitine': 'an amino-acid derivative',
}

export function productView(slug: string): ProductView | null {
  const product = PRODUCTS.find((p) => p.slug === slug && p.active)
  if (!product) return null

  const compound = product.compoundId ? COMPOUNDS[product.compoundId] : undefined

  return {
    ...shopCard(product, PRODUCTS.findIndex((p) => p.slug === slug) + 1),
    action: compound?.action ?? null,
    bottomLine: compound?.bottomLine ?? null,
    blendParts: (product.blendOf ?? []).map((id) => ({
      name: COMPOUNDS[id]?.name ?? id,
      purpose: COMPOUNDS[id]?.purpose ?? '',
    })),
    notAPeptide: product.compoundId ? (NOT_PEPTIDE[product.compoundId] ?? null) : null,
    history: historyRows(slug),
    batchCount: lotsFor(slug).length,
    ledger: ledgerFor(slug, Boolean(product.blendOf), currentLot(slug)?.assayState ?? 'none'),
  }
}
