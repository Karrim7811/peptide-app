// Prices are read from the catalogue exactly once — here, at order time — and
// then snapshotted onto order_items. Everything downstream reads the snapshot,
// so a price change can never rewrite what a past customer was charged.
//
// Shipping is whatever method the customer picked. None of them are priced yet,
// which is why most of these tests assert a refusal.

import { describe, expect, it, vi } from 'vitest'
import { orderTotals, priceLine } from '@/lib/shop/orders/totals'
import { SHIPPING_METHODS, sellableMethods, shippingMethod } from '@/lib/shop/orders/shipping'

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

describe('shipping methods', () => {
  it('offers a slow, a middle and a guaranteed option', () => {
    expect(SHIPPING_METHODS.map((m) => m.id)).toEqual(['standard', 'priority', 'overnight'])
  })

  it('guarantees only the overnight window', () => {
    const guaranteed = SHIPPING_METHODS.filter((m) => m.guaranteed).map((m) => m.id)
    expect(guaranteed).toEqual(['overnight'])
  })

  it('names a carrier and a transit window for every method', () => {
    for (const method of SHIPPING_METHODS) {
      expect(method.carrier, method.id).toBeTruthy()
      expect(method.transit, method.id).toBeTruthy()
    }
  })

  it('refuses an unknown method', () => {
    expect(() => shippingMethod('teleport')).toThrow(/no such shipping method/)
  })

  // Until Karim prices them, nothing is sellable — which is what keeps an
  // unpriced method off a checkout screen rather than trusting a UI to filter.
  it('sells nothing while nothing is priced', () => {
    expect(sellableMethods()).toEqual([])
  })
})

describe('order totals', () => {
  it('refuses to total against an unpriced method rather than assuming zero', () => {
    expect(() => orderTotals([priceLine('mots-c-10mg', 1)], 'priority')).toThrow(
      /has no price set/,
    )
  })

  it('rejects an empty order before it even looks at shipping', () => {
    expect(() => orderTotals([], 'standard')).toThrow(/empty/)
  })

  it('adds the chosen method and balances, once priced', () => {
    vi.spyOn(SHIPPING_METHODS[2], 'priceCents', 'get').mockReturnValue(4995)
    try {
      const totals = orderTotals([priceLine('mots-c-10mg', 1), priceLine('semax-5mg', 2)], 'overnight')
      expect(totals.subtotalCents).toBe(9000)
      expect(totals.shippingCents).toBe(4995)
      expect(totals.totalCents).toBe(13995)
      expect(totals.shippingMethodId).toBe('overnight')
      // The schema carries a matching CHECK. Both exist because this is the
      // arithmetic a customer disputes.
      expect(totals.totalCents).toBe(totals.subtotalCents + totals.shippingCents)
    } finally {
      vi.restoreAllMocks()
    }
  })
})
