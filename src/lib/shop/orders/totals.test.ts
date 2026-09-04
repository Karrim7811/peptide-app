// Prices are read from the catalogue exactly once — here, at order time — and
// then snapshotted onto order_items. Everything downstream reads the snapshot,
// so a price change can never rewrite what a past customer was charged.

import { describe, expect, it } from 'vitest'
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_CENTS,
  orderTotals,
  priceLine,
} from '@/lib/shop/orders/totals'

describe('pricing a line', () => {
  it('takes name, size and price from the catalogue', () => {
    expect(priceLine('glp-3-30mg', 2)).toEqual({
      productSlug: 'glp-3-30mg',
      productName: 'GLP-3 (Retatrutide)',
      sizeDisplay: '30 mg',
      qty: 2,
      unitPriceCents: 12500,
      lineCents: 25000,
    })
  })

  it('prices a blend the same way as a single compound', () => {
    const line = priceLine('klow-80mg', 1)
    expect(line.unitPriceCents).toBe(10000)
    expect(line.sizeDisplay).toBe('80 mg')
  })

  it('refuses a product that does not exist', () => {
    expect(() => priceLine('not-a-product', 1)).toThrow(/no active product/)
  })

  it('refuses a quantity that is not a positive whole number', () => {
    expect(() => priceLine('glp-3-30mg', 0)).toThrow(/quantity/)
    expect(() => priceLine('glp-3-30mg', -1)).toThrow(/quantity/)
    expect(() => priceLine('glp-3-30mg', 1.5)).toThrow(/quantity/)
  })
})

describe('order totals', () => {
  it('sums lines and adds flat shipping below the threshold', () => {
    const totals = orderTotals([priceLine('mots-c-10mg', 1)])
    expect(totals.subtotalCents).toBe(3000)
    expect(totals.shippingCents).toBe(SHIPPING_CENTS)
    expect(totals.totalCents).toBe(3000 + SHIPPING_CENTS)
  })

  it('ships free at or above the threshold', () => {
    const totals = orderTotals([priceLine('glp-3-30mg', 2)])
    expect(totals.subtotalCents).toBe(25000)
    expect(totals.shippingCents).toBe(0)
    expect(totals.totalCents).toBe(25000)
  })

  it('treats the threshold itself as free, not as the last paid step', () => {
    const atThreshold = { lineCents: FREE_SHIPPING_THRESHOLD_CENTS } as never
    expect(orderTotals([atThreshold]).shippingCents).toBe(0)
  })

  it('adds several lines together', () => {
    const totals = orderTotals([priceLine('mots-c-10mg', 1), priceLine('semax-5mg', 2)])
    expect(totals.subtotalCents).toBe(3000 + 6000)
  })

  it('rejects an empty order rather than charging for shipping alone', () => {
    expect(() => orderTotals([])).toThrow(/empty/)
  })

  // The schema has a matching CHECK constraint. Both exist because this is the
  // arithmetic a customer disputes.
  it('always balances', () => {
    for (const lines of [
      [priceLine('nad-1000mg', 1)],
      [priceLine('glp-3-30mg', 1), priceLine('klow-80mg', 3)],
      [priceLine('vip-5mg', 1), priceLine('selank-5mg', 1), priceLine('semax-5mg', 1)],
    ]) {
      const totals = orderTotals(lines)
      expect(totals.totalCents).toBe(totals.subtotalCents + totals.shippingCents)
    }
  })
})
