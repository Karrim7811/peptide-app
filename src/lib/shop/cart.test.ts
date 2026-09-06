// localStorage is user-writable, so everything read back out of it is untrusted
// input. A bad slug that survives into checkout reaches priceLine() and throws
// there instead of here, which is a worse place to find out.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_QTY, cart, cartLines, subtotalCents } from '@/lib/shop/cart'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    dispatchEvent: () => true,
    Event: class {
      constructor(public type: string) {}
    },
  })
  vi.stubGlobal('Event', class { constructor(public type: string) {} })
})

const raw = (v: unknown) => store.set('pc.cart.v1', JSON.stringify(v))

describe('adding and removing', () => {
  it('adds, accumulates and removes', () => {
    cart.add('glp-3-30mg')
    cart.add('glp-3-30mg', 2)
    expect(cart.entries()).toEqual([{ slug: 'glp-3-30mg', qty: 3 }])
    cart.remove('glp-3-30mg')
    expect(cart.entries()).toEqual([])
  })

  it('counts every unit, not every line', () => {
    cart.add('glp-3-30mg', 2)
    cart.add('mots-c-10mg', 3)
    expect(cart.count()).toBe(5)
  })

  it('treats a quantity below one as a removal', () => {
    cart.add('glp-3-30mg')
    cart.setQty('glp-3-30mg', 0)
    expect(cart.entries()).toEqual([])
  })

  // A vial is a considered purchase. A stuck key should not order forty.
  it('caps quantity', () => {
    cart.add('glp-3-30mg', 999)
    expect(cart.entries()[0].qty).toBe(MAX_QTY)
    cart.setQty('glp-3-30mg', 999)
    expect(cart.entries()[0].qty).toBe(MAX_QTY)
  })
})

describe('what comes back out of localStorage is untrusted', () => {
  it('survives unparseable JSON', () => {
    store.set('pc.cart.v1', 'not json{')
    expect(cart.entries()).toEqual([])
  })

  it('survives a non-array', () => {
    raw({ slug: 'glp-3-30mg' })
    expect(cart.entries()).toEqual([])
  })

  it('drops entries for products that do not exist', () => {
    raw([{ slug: 'not-a-product', qty: 1 }, { slug: 'glp-3-30mg', qty: 1 }])
    expect(cart.entries()).toEqual([{ slug: 'glp-3-30mg', qty: 1 }])
  })

  it('drops malformed entries rather than coercing them', () => {
    raw([{ slug: 'glp-3-30mg', qty: 'two' }, { qty: 1 }, null, 'nope'])
    expect(cart.entries()).toEqual([])
  })

  it('clamps a hand-edited quantity', () => {
    raw([{ slug: 'glp-3-30mg', qty: 5000 }])
    expect(cart.entries()[0].qty).toBe(MAX_QTY)
  })
})

describe('pricing a cart', () => {
  it('reads prices fresh rather than storing them', () => {
    cart.add('glp-3-30mg', 2)
    const [line] = cartLines()
    expect(line.name).toBe('GLP-3')
    expect(line.subtitle).toBe('Retatrutide')
    expect(line.unitPrice).toBe('$125.00')
    expect(line.linePrice).toBe('$250.00')
    expect(line.lineCents).toBe(25000)
  })

  it('subtotals across lines', () => {
    cart.add('glp-3-30mg')
    cart.add('mots-c-10mg', 2)
    expect(subtotalCents(cartLines())).toBe(12500 + 6000)
  })

  it('silently skips a product that has since been delisted', () => {
    raw([{ slug: 'glp-3-30mg', qty: 1 }])
    expect(cartLines([{ slug: 'gone', qty: 1 }])).toEqual([])
  })
})
