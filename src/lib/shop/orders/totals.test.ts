// Prices are read from the catalogue exactly once — here, at order time — and
// then snapshotted onto order_items. Everything downstream reads the snapshot,
// so a price change can never rewrite what a past customer was charged.
//
// Shipping is whatever method the customer picked. All three were priced on
// 2026-09-07; the refusal path is still tested, because an unpriced method must
// keep failing closed if one is ever added.

import { describe, expect, it, vi } from 'vitest'
import { orderTotals, priceLine } from '@/lib/shop/orders/totals'
import {
  SHIPPING_METHODS,
  TRANSIT_FROM,
  sellableMethods,
  shippingMethod,
} from '@/lib/shop/orders/shipping'

describe('pricing a line', () => {
  it('takes name, size and price from the catalogue', () => {
    expect(priceLine('glp-3-30mg', 2)).toEqual({
      productSlug: 'glp-3-30mg',
      // Composed from name + subtitle — an order line stands alone.
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

  it('prices every method, in whole cents, cheapest first', () => {
    // Priced 2026-09-07: $7.00 / $12.00 / $49.00. The assertion is on the
    // ORDER and the shape, not the figures — re-pricing against real postage
    // is expected and must not have to edit a test. What must not happen is a
    // faster service costing less than a slower one, or a price arriving as
    // dollars.
    const prices = SHIPPING_METHODS.map((m) => m.priceCents)
    expect(prices.every((p) => typeof p === 'number' && Number.isInteger(p) && p > 0)).toBe(true)
    expect(prices).toEqual([...(prices as number[])].sort((a, b) => a - b))
  })

  it('sells every priced method, and only priced methods', () => {
    // sellableMethods() is what keeps an unpriced method off a checkout screen,
    // rather than trusting a UI to filter. With all three priced it returns all
    // three; the filter is still load-bearing for anything added later.
    expect(sellableMethods().map((m) => m.id)).toEqual(['standard', 'priority', 'overnight'])

    vi.spyOn(SHIPPING_METHODS[1], 'priceCents', 'get').mockReturnValue(null)
    try {
      expect(sellableMethods().map((m) => m.id)).toEqual(['standard', 'overnight'])
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('says where the transit windows start, because the Zelle rail is manual', () => {
    // A window quoted from checkout would be a promise the slower rail cannot
    // keep. See the note at the top of shipping.ts.
    expect(TRANSIT_FROM).toMatch(/payment clears/)
  })
})

describe('order totals', () => {
  it('refuses to total against an unpriced method rather than assuming zero', () => {
    vi.spyOn(SHIPPING_METHODS[1], 'priceCents', 'get').mockReturnValue(null)
    try {
      expect(() => orderTotals([priceLine('mots-c-10mg', 1)], 'priority')).toThrow(
        /has no price set/,
      )
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('totals a real order at the prices that are actually set', () => {
    const totals = orderTotals([priceLine('glp-3-30mg', 1)], 'standard')
    expect(totals.subtotalCents).toBe(12500)
    expect(totals.shippingCents).toBe(shippingMethod('standard').priceCents)
    expect(totals.totalCents).toBe(totals.subtotalCents + totals.shippingCents)
  })

  it('rejects an empty order before it even looks at shipping', () => {
    expect(() => orderTotals([], 'standard')).toThrow(/empty/)
  })

  it('adds the chosen method and balances, once priced', () => {
    // Mocked rather than read from the catalogue: this test is about the
    // arithmetic balancing, and it must keep proving that if the real price
    // changes.
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
