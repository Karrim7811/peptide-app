// One place decides which moves are legal, so "an unpaid order got shipped" has
// one place to be prevented rather than three places to be forgotten — the admin
// queue, the BTCPay webhook and any expiry job all route through here.

import { describe, expect, it } from 'vitest'
import { ORDER_STATUSES, TERMINAL, canTransition, nextStatuses } from '@/lib/shop/orders/status'

describe('the happy path', () => {
  it('walks awaiting_payment to delivered', () => {
    expect(canTransition('awaiting_payment', 'paid')).toBe(true)
    expect(canTransition('paid', 'packed')).toBe(true)
    expect(canTransition('packed', 'shipped')).toBe(true)
    expect(canTransition('shipped', 'delivered')).toBe(true)
  })
})

describe('what must never happen', () => {
  // The one that matters. Zelle orders sit in awaiting_payment until a human
  // confirms them, so an unpaid order reaching the packing bench is the failure
  // this whole machine exists to prevent.
  it('never lets an unpaid order be fulfilled', () => {
    expect(canTransition('awaiting_payment', 'packed')).toBe(false)
    expect(canTransition('awaiting_payment', 'shipped')).toBe(false)
    expect(canTransition('awaiting_payment', 'delivered')).toBe(false)
  })

  it('never goes backwards', () => {
    expect(canTransition('shipped', 'paid')).toBe(false)
    expect(canTransition('paid', 'awaiting_payment')).toBe(false)
    expect(canTransition('packed', 'paid')).toBe(false)
    expect(canTransition('delivered', 'shipped')).toBe(false)
  })

  it('never lets a status transition to itself', () => {
    for (const status of ORDER_STATUSES) {
      expect(canTransition(status, status), status).toBe(false)
    }
  })

  it('lets nothing leave a terminal state', () => {
    for (const status of TERMINAL) {
      expect(nextStatuses(status), status).toEqual([])
    }
  })
})

describe('the exits', () => {
  it('expires only what was never paid for', () => {
    expect(canTransition('awaiting_payment', 'expired')).toBe(true)
    expect(canTransition('paid', 'expired')).toBe(false)
    expect(canTransition('shipped', 'expired')).toBe(false)
  })

  // Refunds are manual on both rails — no card issuer to appeal to — so the
  // machine has to allow one at every stage where money has actually changed
  // hands, and at none where it has not.
  it('refunds only what was paid for', () => {
    expect(canTransition('paid', 'refunded')).toBe(true)
    expect(canTransition('packed', 'refunded')).toBe(true)
    expect(canTransition('shipped', 'refunded')).toBe(true)
    expect(canTransition('delivered', 'refunded')).toBe(true)
    expect(canTransition('awaiting_payment', 'refunded')).toBe(false)
  })

  it('cancels only before anything has shipped', () => {
    expect(canTransition('awaiting_payment', 'cancelled')).toBe(true)
    expect(canTransition('paid', 'cancelled')).toBe(true)
    expect(canTransition('packed', 'cancelled')).toBe(false)
    expect(canTransition('shipped', 'cancelled')).toBe(false)
  })
})

describe('the machine is well formed', () => {
  it('names a destination that exists for every transition', () => {
    const unknown = ORDER_STATUSES.flatMap((from) =>
      nextStatuses(from)
        .filter((to) => !ORDER_STATUSES.includes(to))
        .map((to) => `${from} -> ${to}`),
    )
    expect(unknown).toEqual([])
  })

  it('can reach every status from awaiting_payment', () => {
    const seen = new Set(['awaiting_payment'])
    const queue = ['awaiting_payment' as const]
    while (queue.length > 0) {
      for (const next of nextStatuses(queue.pop()!)) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next as 'awaiting_payment')
        }
      }
    }
    // Array.from, not a spread: this tsconfig's target predates iterating a Set.
    expect(Array.from(seen).sort()).toEqual(Array.from(ORDER_STATUSES).sort())
  })
})
