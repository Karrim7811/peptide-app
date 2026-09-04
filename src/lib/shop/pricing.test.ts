// Per-mg is the entire pricing argument — we publish a unit price and let the
// reader compare it against whoever else they were about to buy from. We never
// make the comparison ourselves.
//
// Two rules it has to obey, both of which are easy to break by accident:
// blends get no figure, and the figure never ranks the catalogue.

import { describe, expect, it } from 'vitest'
import { PRODUCTS } from '@/lib/shop/catalogue'
import { formatPrice, formatUnitPrice, perMgCents } from '@/lib/shop/pricing'

const bySlug = (slug: string) => {
  const product = PRODUCTS.find((p) => p.slug === slug)
  if (!product) throw new Error(`no product ${slug}`)
  return product
}

describe('perMgCents', () => {
  it('divides price by milligrams', () => {
    expect(perMgCents(bySlug('glp-3-30mg'))).toBeCloseTo(416.667, 2)
    expect(perMgCents(bySlug('mots-c-10mg'))).toBe(300)
    expect(perMgCents(bySlug('semax-5mg'))).toBe(600)
    expect(perMgCents(bySlug('nad-1000mg'))).toBeCloseTo(7.5, 4)
  })

  // A price per milligram of unspecified mixture means nothing, and it is
  // ambiguous besides — per 80 mg labelled, or per 90.65 mg measured?
  it('refuses to price a blend per milligram', () => {
    expect(perMgCents(bySlug('klow-80mg'))).toBeNull()
  })

  it('refuses to price an IU product per milligram', () => {
    const iu = { ...bySlug('mots-c-10mg'), sizeUnit: 'IU' as const }
    expect(perMgCents(iu)).toBeNull()
  })

  it('refuses to divide by zero', () => {
    const broken = { ...bySlug('mots-c-10mg'), sizeValue: 0 }
    expect(perMgCents(broken)).toBeNull()
  })
})

describe('display formatting', () => {
  it('formats money', () => {
    expect(formatPrice(12500)).toBe('$125.00')
    expect(formatPrice(3000)).toBe('$30.00')
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('formats the unit price', () => {
    expect(formatUnitPrice(bySlug('glp-3-30mg'))).toBe('$4.17 / mg')
    expect(formatUnitPrice(bySlug('mots-c-10mg'))).toBe('$3.00 / mg')
  })

  // NAD+ is dosed in hundreds of milligrams, so two decimal places would round
  // it to $0.01 and make it look ten times its price.
  it('keeps sub-cent compounds legible', () => {
    expect(formatUnitPrice(bySlug('nad-1000mg'))).toBe('$0.075 / mg')
  })

  it('returns null for a blend rather than a placeholder string', () => {
    expect(formatUnitPrice(bySlug('klow-80mg'))).toBeNull()
  })
})

describe('the catalogue is never ranked by unit price', () => {
  // NAD+ at $0.075/mg beside Semax at $6.00/mg is not an eighty-fold difference
  // in value — they are different molecules dosed in different ranges. Any
  // "best value" ordering built on this number would mislead, so the module
  // exposes no comparator, no sort, and no ranking helper. This test is a
  // reminder in executable form: if one is added, delete it, don't fix this.
  it('exposes no comparator or sort helper', async () => {
    const module = await import('@/lib/shop/pricing')
    const suspicious = Object.keys(module).filter((name) =>
      /sort|rank|compare|best|cheap|value/i.test(name),
    )
    expect(suspicious).toEqual([])
  })
})
