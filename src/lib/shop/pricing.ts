// Per-mg unit pricing — the whole pricing argument, per spec §5.
//
// The brief was to convey that other vendors overcharge without naming a number
// and without naming anyone. The resolution was to make no comparative claim at
// all: publish our own unit price and let the reader do the arithmetic against
// whoever they were about to buy from. A unit is not a claim, so there is
// nothing to substantiate and nobody to provoke.
//
// TWO RULES, both easy to break by accident:
//
//   1. Per-mg compares WITHIN a compound, never across the catalogue. NAD+ at
//      $0.075/mg beside Semax at $6.00/mg is not eighty times the value — they
//      are different molecules dosed in different ranges. This module therefore
//      exports no comparator, no sort, and no "best value" helper, and a test
//      fails if one is added. Do not add one.
//
//   2. Blends get no figure. KLOW is four molecules; a price per milligram of
//      unspecified mixture is meaningless, and ambiguous besides — per 80 mg
//      labelled or per 90.65 mg measured? The measured component table stands
//      in its place, and is the stronger disclosure anyway.

import type { ShopProduct } from '@/lib/shop/types'

/**
 * Cents per milligram, or null where the figure would be meaningless — a blend,
 * a product dosed in IU, or a zero size. Null is a state the UI renders as
 * "no unit price", never as zero.
 */
export function perMgCents(product: ShopProduct): number | null {
  if (product.blendOf) return null
  if (product.sizeUnit !== 'mg') return null
  if (product.sizeValue <= 0) return null
  return product.priceCents / product.sizeValue
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * The unit price as displayed, or null where there is none.
 *
 * Sub-cent compounds get three decimal places: NAD+ is dosed in hundreds of
 * milligrams and rounds to $0.01 at two places, which reads as ten times its
 * actual price.
 */
export function formatUnitPrice(product: ShopProduct): string | null {
  const perMg = perMgCents(product)
  if (perMg === null) return null
  const dollars = perMg / 100
  const text = dollars < 0.1 ? dollars.toFixed(3) : dollars.toFixed(2)
  return `$${text} / mg`
}
