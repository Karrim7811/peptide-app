import { describe, expect, it } from 'vitest'
import {
  STAGE_COPY,
  orderStage,
  orderTimeline,
  orderView,
} from '@/lib/shop/orders/view'
import type { Order } from '@/lib/shop/orders/types'

function order(patch: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    userId: 'u1',
    status: 'awaiting_payment',
    subtotalCents: 15500,
    shippingCents: 0,
    totalCents: 15500,
    shippingMethod: 'priority',
    paymentProvider: 'zelle',
    providerRef: null,
    paymentReference: 'PC-7K3M',
    ship: {
      name: 'K. Reyes',
      line1: '1180 Mission St',
      line2: 'Apt 4',
      city: 'San Francisco',
      state: 'CA',
      postal: '94103',
      country: 'US',
    },
    createdAt: '2026-09-04T14:12:00.000Z',
    paidAt: null,
    shippedAt: null,
    tracking: null,
    items: [],
    ...patch,
  }
}

describe('orderStage', () => {
  it('splits awaiting_payment by rail: Zelle waits for a human, crypto waits for the network', () => {
    expect(orderStage('awaiting_payment', 'zelle')).toBe('awaiting')
    expect(orderStage('awaiting_payment', 'btcpay')).toBe('confirming')
  })

  it('treats packed as still preparing — nothing has been handed to the carrier', () => {
    expect(orderStage('packed', 'zelle')).toBe('paid')
    expect(orderStage('paid', 'zelle')).toBe('paid')
  })

  it('collapses refunded and cancelled into one cancelled presentation', () => {
    expect(orderStage('refunded', 'zelle')).toBe('cancelled')
    expect(orderStage('cancelled', 'zelle')).toBe('cancelled')
  })

  it('maps the remaining statuses straight through', () => {
    expect(orderStage('shipped', 'btcpay')).toBe('shipped')
    expect(orderStage('delivered', 'btcpay')).toBe('delivered')
    expect(orderStage('expired', 'zelle')).toBe('expired')
  })
})

describe('STAGE_COPY', () => {
  it('covers all seven presentation states', () => {
    expect(Object.keys(STAGE_COPY).sort()).toEqual([
      'awaiting',
      'cancelled',
      'confirming',
      'delivered',
      'expired',
      'paid',
      'shipped',
    ])
  })

  // The design is explicit: awaiting payment is the normal Zelle path, not a
  // fault. If this copy ever acquires the vocabulary of failure, the screen has
  // started telling customers something went wrong when nothing did.
  it('never describes awaiting payment as an error', () => {
    const text = `${STAGE_COPY.awaiting.head} ${STAGE_COPY.awaiting.next}`.toLowerCase()
    for (const word of ['error', 'failed', 'failure', 'problem', 'unable', 'warning']) {
      expect(text).not.toContain(word)
    }
  })

  it('tells an expired order that nothing was charged', () => {
    expect(STAGE_COPY.expired.next).toContain('Nothing was charged')
  })
})

describe('orderTimeline', () => {
  it('prints the real timestamp for a step that has one and null for a step that does not', () => {
    const steps = orderTimeline(
      order({ status: 'shipped', paidAt: '2026-09-05T09:00:00.000Z', shippedAt: '2026-09-06T11:30:00.000Z' }),
    )

    expect(steps[0].when).toBe('2026-09-04 14:12')
    expect(steps[1].when).toBe('2026-09-05 09:00')
    expect(steps[2].when).toBe('2026-09-06 11:30')
    // No delivered_at column exists, so there is no date to print. The view
    // model says so rather than computing a plausible one.
    expect(steps[3].when).toBeNull()
  })

  // The prototype derived every date by adding days to placedAt. A projected
  // date rendered in the same type as a recorded one is a guess wearing the
  // clothes of a fact.
  it('never invents a date for a step that has not happened', () => {
    const steps = orderTimeline(order())
    expect(steps.slice(1).every((step) => step.when === null)).toBe(true)
    expect(steps[1].estimate).toBeTruthy()
  })

  it('marks the reached steps done, the working step current and the rest future', () => {
    const steps = orderTimeline(order({ status: 'paid', paidAt: '2026-09-05T09:00:00.000Z' }))
    expect(steps.map((step) => step.state)).toEqual(['done', 'done', 'current', 'future'])
  })

  it('names the payment step for the rail that produced it', () => {
    expect(orderTimeline(order()).at(1)?.label).toBe('Payment matched')
    expect(orderTimeline(order({ paymentProvider: 'btcpay' })).at(1)?.label).toBe(
      'Payment confirmed',
    )
  })

  it('closes a terminal order with its own row and stops the estimates', () => {
    const steps = orderTimeline(order({ status: 'expired' }))
    const last = steps.at(-1)
    expect(last?.label).toBe('Expired')
    expect(last?.state).toBe('current')
    expect(steps.some((step) => step.estimate !== null)).toBe(false)
  })
})

describe('orderView', () => {
  it('shows the Zelle facts only while the payment is genuinely outstanding', () => {
    expect(orderView(order()).showZelleFacts).toBe(true)
    expect(orderView(order({ paymentProvider: 'btcpay' })).showZelleFacts).toBe(false)
    expect(
      orderView(order({ status: 'paid', paidAt: '2026-09-05T09:00:00.000Z' })).showZelleFacts,
    ).toBe(false)
  })

  it('carries tracking only once there is tracking to carry', () => {
    expect(orderView(order()).tracking).toBeNull()
    const shipped = orderView(
      order({
        status: 'shipped',
        paidAt: '2026-09-05T09:00:00.000Z',
        shippedAt: '2026-09-06T11:30:00.000Z',
        tracking: '9400 1112 0620 3452 8871 06',
      }),
    )
    expect(shipped.tracking).toBe('9400 1112 0620 3452 8871 06')
    expect(shipped.carrier).toBe('USPS Priority Mail')
  })

  it('says a line has no lot yet rather than leaving the space empty', () => {
    const item = {
      id: 'i1',
      orderId: 'o1',
      productId: 'p1',
      lotId: null,
      lotCode: null,
      qty: 2,
      unitPriceCents: 3000,
      productName: 'MOTS-c',
      sizeDisplay: '10 mg',
    }
    const [unpacked] = orderView(order({ items: [item] })).items
    expect(unpacked.meta).toBe('10 mg × 2 · no lot yet')
    // Priced off the snapshot on the row, not the current catalogue price.
    expect(unpacked.total).toBe('$60.00')

    const [packed] = orderView(
      order({ items: [{ ...item, lotId: 'l1', lotCode: 'JA-102111' }] }),
    ).items
    expect(packed.meta).toBe('10 mg × 2 · JA-102111')
  })

  it('drops the refund line on a terminal order, where there is nothing left to refund', () => {
    expect(orderView(order()).refundLine).toContain('PC-7K3M')
    expect(orderView(order({ status: 'refunded' })).refundLine).toBeNull()
    expect(orderView(order({ status: 'expired' })).refundLine).toBeNull()
  })
})
