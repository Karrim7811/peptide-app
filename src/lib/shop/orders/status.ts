// The order status machine.
//
// One place that knows which moves are legal. The admin queue, the BTCPay
// webhook and any expiry job all go through it, so "an unpaid order got shipped"
// has one place to be prevented rather than three places to be forgotten.
//
// The rule underneath all of it: nothing is fulfilled that has not been paid
// for. Zelle cannot confirm itself, so orders sit in awaiting_payment until a
// human matches the memo reference against the bank — which makes the gap
// between "ordered" and "paid" a real, routine state rather than an edge case.

import type { OrderStatus } from '@/lib/shop/orders/types'

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'awaiting_payment',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'expired',
  'refunded',
  'cancelled',
] as const

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // Never straight to packed or shipped. That edge does not exist on purpose.
  awaiting_payment: ['paid', 'expired', 'cancelled'],
  // Cancellable while nothing has been picked; refundable because money moved.
  paid: ['packed', 'refunded', 'cancelled'],
  // Past this point a vial has been assigned and the order is physical. Refund,
  // do not cancel — the two mean different things to inventory.
  packed: ['shipped', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  expired: [],
  refunded: [],
  cancelled: [],
}

/** Nothing leaves these. */
export const TERMINAL: OrderStatus[] = ['expired', 'refunded', 'cancelled']

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? []
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to)
}
