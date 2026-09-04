// Packing is the only moment the physical vial and the database touch. If an
// item can be packed without a lot assigned, order_items.lot_id is decorative
// and the recall path does not actually exist — you would only find that out
// when you needed it.

import { describe, expect, it } from 'vitest'
import { validatePackAssignment } from '@/lib/shop/orders/admin'

const items = [
  { id: 'i1', productId: 'p1', qty: 1 },
  { id: 'i2', productId: 'p2', qty: 2 },
]

describe('validatePackAssignment', () => {
  it('accepts a lot for every item', () => {
    expect(() => validatePackAssignment(items, { i1: 'lot-a', i2: 'lot-b' })).not.toThrow()
  })

  it('accepts the same lot across two items', () => {
    // Two units of the same product, picked from one batch. Legitimate.
    expect(() => validatePackAssignment(items, { i1: 'lot-a', i2: 'lot-a' })).not.toThrow()
  })

  it('refuses to pack an item with no lot, and names it', () => {
    expect(() => validatePackAssignment(items, { i1: 'lot-a' })).toThrow(/i2/)
  })

  it('refuses a lot for an item that is not on this order', () => {
    expect(() =>
      validatePackAssignment(items, { i1: 'lot-a', i2: 'lot-b', i3: 'lot-c' }),
    ).toThrow(/i3/)
  })

  it('refuses an empty assignment', () => {
    expect(() => validatePackAssignment(items, {})).toThrow(/no lots/)
  })

  it('refuses an empty or blank lot id, which is a missing lot wearing a disguise', () => {
    expect(() => validatePackAssignment(items, { i1: 'lot-a', i2: '' })).toThrow(/i2/)
    expect(() => validatePackAssignment(items, { i1: 'lot-a', i2: '   ' })).toThrow(/i2/)
  })

  it('refuses an order with no items at all', () => {
    expect(() => validatePackAssignment([], { i1: 'lot-a' })).toThrow()
  })
})
