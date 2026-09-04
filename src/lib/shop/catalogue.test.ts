// The seven launch SKUs. Like VIALS, this is hand-carried data with nothing
// deriving it at build time, so these tests are the only thing between a typo
// and a product page that advertises a purity nobody measured.
//
// The invariants that matter are the spec's: assay state is never null, a
// pending batch names the month it is waiting for, an assayed batch carries the
// figure its type requires, and no Janoshik code appears anywhere.

import { describe, expect, it } from 'vitest'
import { COMPOUNDS } from '@/lib/catalog'
import { LOTS, PRODUCTS, currentLot, lotsFor } from '@/lib/shop/catalogue'
import { REPORT_CODES } from '@/lib/vial-reports.server'

describe('launch catalogue', () => {
  it('carries the seven launch SKUs', () => {
    expect(PRODUCTS).toHaveLength(7)
  })

  it('keeps slugs unique', () => {
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length)
  })

  it('resolves every compoundId against the peptide catalog', () => {
    const unresolved = PRODUCTS.filter((p) => p.compoundId && !COMPOUNDS[p.compoundId])
    expect(unresolved.map((p) => p.slug)).toEqual([])
  })

  it('resolves every blend component against the peptide catalog', () => {
    const unresolved = PRODUCTS.flatMap((p) =>
      (p.blendOf ?? []).filter((id) => !COMPOUNDS[id]).map((id) => `${p.slug}:${id}`),
    )
    expect(unresolved).toEqual([])
  })

  it('gives a blend no compoundId and a single compound no blendOf', () => {
    const confused = PRODUCTS.filter((p) => Boolean(p.compoundId) === Boolean(p.blendOf))
    expect(confused.map((p) => p.slug)).toEqual([])
  })

  it('points every lot at a real product', () => {
    const orphans = LOTS.filter((l) => !PRODUCTS.some((p) => p.slug === l.productSlug))
    expect(orphans.map((l) => l.productSlug)).toEqual([])
  })

  it('gives every product exactly one current lot', () => {
    const wrong = PRODUCTS.filter((p) => lotsFor(p.slug).filter((l) => l.isCurrent).length !== 1)
    expect(wrong.map((p) => p.slug)).toEqual([])
  })
})

describe('assay invariants', () => {
  it('gives every pending lot the month it is waiting for', () => {
    const undated = LOTS.filter((l) => l.assayState === 'pending' && !l.assayExpectedAt)
    expect(undated.map((l) => l.productSlug)).toEqual([])
  })

  it('formats every expected date as YYYY-MM', () => {
    const malformed = LOTS.filter(
      (l) => l.assayExpectedAt && !/^\d{4}-\d{2}$/.test(l.assayExpectedAt),
    )
    expect(malformed.map((l) => l.productSlug)).toEqual([])
  })

  it('gives every assayed lot the figure its type requires', () => {
    const broken = LOTS.filter(
      (l) =>
        l.assayState === 'assayed' &&
        (l.assayType === 'purity'
          ? l.purityPct === null
          : (l.components ?? []).length === 0 || l.measuredTotalMg === null),
    )
    expect(broken.map((l) => l.productSlug)).toEqual([])
  })

  it('never publishes a purity figure for a pending lot', () => {
    const leaking = LOTS.filter((l) => l.assayState === 'pending' && l.purityPct !== null)
    expect(leaking.map((l) => l.productSlug)).toEqual([])
  })

  it('keeps a composition lot honest — components sum to the measured total', () => {
    for (const lot of LOTS.filter((l) => l.assayType === 'composition' && l.components)) {
      const sum = lot.components!.reduce((total, c) => total + c.mg, 0)
      expect(sum, lot.productSlug).toBeCloseTo(lot.measuredTotalMg!, 2)
    }
  })

  // Overfill is a real, verifiable selling point, but only if the figure is the
  // lab's. A measured content below the label would be the opposite of a
  // selling point and must never be published as one by accident.
  it('never records a measured content below what the label claims', () => {
    const short = LOTS.filter(
      (l) => l.measuredTotalMg !== null && l.measuredTotalMg < l.labelMg,
    )
    expect(short.map((l) => l.productSlug)).toEqual([])
  })

  it('records no measured content for a lot with no assay', () => {
    const impossible = LOTS.filter((l) => l.assayState !== 'assayed' && l.measuredTotalMg !== null)
    expect(impossible.map((l) => l.productSlug)).toEqual([])
  })

  // Spec D3. The shop must not reintroduce what Task 1 removed.
  it('carries no Janoshik report code', () => {
    const serialized = JSON.stringify(LOTS)
    const found = Object.values(REPORT_CODES).filter((code) => serialized.includes(code))
    expect(found).toEqual([])
  })
})

describe('the GLP-3 track record', () => {
  it('carries three consecutive assayed lots', () => {
    expect(lotsFor('glp-3-30mg').map((l) => l.purityPct)).toEqual([99.62, 99.73, 99.46])
  })

  it('ships the one marked current', () => {
    expect(currentLot('glp-3-30mg')?.lotCode).toBe('JA-102107')
  })

  it('is the only product with a history worth showing', () => {
    const withHistory = PRODUCTS.filter(
      (p) => lotsFor(p.slug).filter((l) => l.assayState === 'assayed').length > 1,
    )
    expect(withHistory.map((p) => p.slug)).toEqual(['glp-3-30mg'])
  })
})
