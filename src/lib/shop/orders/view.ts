// The order status page, as data.
//
// Eight database statuses become seven things a customer is told, and the
// mapping is not one-to-one in either direction. Two places it bends:
//
//   • awaiting_payment splits by rail. On Zelle a person is waiting for Karim to
//     match a memo against a bank statement; on BTCPay a person is waiting for
//     the network. Same row, different sentence, different honest estimate.
//   • packed does not get its own screen. Nothing has left the building, so from
//     outside it is indistinguishable from paid — and inventing a "we have
//     picked your vials" step would be reporting warehouse choreography as
//     shipping progress.
//
// ── No projected dates ────────────────────────────────────────────────────
//
// The prototype derived every timeline date by adding days to placedAt, so a
// delivery date appeared the moment an order was created. This does not. A step
// prints a timestamp only where the database recorded one; otherwise `when` is
// null and `estimate` carries prose that reads as prose. A guess set in the same
// mono column as a fact is a guess wearing the clothes of a fact, and this
// product's entire argument is that it does not do that.
//
// There is no delivered_at column, so the Delivered row never carries a date at
// all — only what the carrier said the window was.

import { formatPrice } from '@/lib/shop/pricing'
import { shippingMethod } from '@/lib/shop/orders/shipping'
import { TERMINAL } from '@/lib/shop/orders/status'
import type { Order, OrderStatus, PaymentProviderId } from '@/lib/shop/orders/types'

/** The seven states a customer sees, as opposed to the eight the database keeps. */
export type OrderStage =
  | 'awaiting'
  | 'confirming'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'expired'
  | 'cancelled'

export interface StageCopy {
  label: string
  head: string
  next: string
}

/**
 * Final copy, transcribed from the design handoff. Deliberately neutral in the
 * awaiting state: a customer who has done nothing wrong must not be shown the
 * vocabulary of failure, and a test enforces that.
 */
export const STAGE_COPY: Record<OrderStage, StageCopy> = {
  awaiting: {
    label: 'Awaiting payment',
    head: 'Order placed. Awaiting your Zelle payment.',
    next: 'Send the exact amount with the reference in the memo. We match Zelle payments by hand, usually within one business day. Your delivery estimate starts when the payment is matched, not from today.',
  },
  confirming: {
    label: 'Payment confirming',
    head: 'Back from checkout. Payment confirming on the network.',
    next: 'Crypto confirms in minutes. Your delivery estimate starts at confirmation. Nothing to do; this page updates.',
  },
  paid: {
    label: 'Paid · preparing',
    head: 'Payment matched. Preparing your order.',
    next: 'Packed cold-chain and handed to USPS within one business day of confirmation. The service you chose is an estimate of transit time from that hand-off; only Overnight carries a carrier guarantee.',
  },
  shipped: {
    label: 'Shipped',
    head: 'Shipped.',
    next: 'Refrigerate on arrival. Use within 28 days of reconstitution, 2–8 °C.',
  },
  delivered: {
    label: 'Delivered',
    head: 'Delivered.',
    next: 'Refrigerate now if you have not. Unopened vials with the seal intact can be returned within 14 days of today.',
  },
  expired: {
    label: 'Expired',
    head: 'Payment window closed.',
    next: 'No payment was matched to this reference within 3 days, so the order closed. Nothing was charged. Place the order again if you still want it; if you did send payment, email us with the reference and we will match it.',
  },
  cancelled: {
    label: 'Cancelled · refunded',
    head: 'Cancelled. Refund handled by hand.',
    next: 'Refunds go back the way payment came — to your Zelle account or your wallet — and are confirmed by email within one business day of processing.',
  },
}

export function orderStage(status: OrderStatus, provider: PaymentProviderId): OrderStage {
  switch (status) {
    case 'awaiting_payment':
      return provider === 'zelle' ? 'awaiting' : 'confirming'
    // Picked but not handed over. Outside the building nothing has changed.
    case 'paid':
    case 'packed':
      return 'paid'
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'expired':
      return 'expired'
    // Two different things to inventory, one thing to the person who paid.
    case 'refunded':
    case 'cancelled':
      return 'cancelled'
  }
}

/** How far along the four-step spine an order has actually got. */
function reached(stage: OrderStage): number {
  if (stage === 'delivered') return 4
  if (stage === 'shipped') return 3
  if (stage === 'paid') return 2
  return 1
}

export interface TimelineStep {
  label: string
  /** A recorded timestamp, or null. Never a projection. */
  when: string | null
  /** Prose for a step that has not happened. Null once it has, and on terminal orders. */
  estimate: string | null
  state: 'done' | 'current' | 'future'
}

/** '2026-09-04T14:12:00.000Z' → '2026-09-04 14:12'. Null in, null out. */
function stamp(iso: string | null): string | null {
  if (!iso) return null
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  return `${at.toISOString().slice(0, 10)} ${at.toISOString().slice(11, 16)}`
}

export function orderTimeline(order: Order): TimelineStep[] {
  const stage = orderStage(order.status, order.paymentProvider)
  const terminal = TERMINAL.includes(order.status)
  const at = reached(stage)
  const method = shippingMethod(order.shippingMethod)
  const zelle = order.paymentProvider === 'zelle'

  // A terminal order is not mid-journey, so nothing about it is forthcoming.
  // Estimates are suppressed wholesale rather than per-step.
  const guess = (text: string) => (terminal ? null : text)

  const spine: Array<Omit<TimelineStep, 'state'> & { index: number }> = [
    {
      index: 1,
      label: 'Placed',
      when: stamp(order.createdAt),
      estimate: null,
    },
    {
      index: 2,
      label: zelle ? 'Payment matched' : 'Payment confirmed',
      when: stamp(order.paidAt),
      estimate: order.paidAt
        ? null
        : guess(zelle ? 'by hand · usually ≤ 1 business day' : 'on the network · minutes'),
    },
    {
      index: 3,
      label: 'Handed to USPS',
      when: stamp(order.shippedAt),
      estimate: order.shippedAt ? null : guess('within 1 business day of payment'),
    },
    {
      index: 4,
      label: 'Delivered',
      // No delivered_at column exists. Rather than compute one, this row carries
      // only what the carrier promised, and says which of the two it is.
      when: null,
      estimate: guess(
        method.guaranteed
          ? `${method.transit} after hand-off · guaranteed`
          : `${method.transit} after hand-off · estimate`,
      ),
    },
  ]

  const steps: TimelineStep[] = spine.map((step) => ({
    label: step.label,
    when: step.when,
    estimate: step.estimate,
    state: terminal
      ? step.index <= at
        ? 'done'
        : 'future'
      : step.index <= at
        ? 'done'
        : step.index === at + 1
          ? 'current'
          : 'future',
  }))

  if (terminal) {
    steps.push({
      label: STAGE_COPY[stage].label,
      when: stamp(order.status === 'expired' ? null : order.paidAt),
      estimate: null,
      state: 'current',
    })
  }

  return steps
}

export interface OrderView {
  stage: OrderStage
  label: string
  head: string
  next: string
  isTerminal: boolean
  reference: string
  placed: string | null
  /** Only while the money is genuinely still owed on the rail that needs a memo. */
  showZelleFacts: boolean
  total: string
  subtotal: string
  /** Null while shipping is unpriced — the UI renders its own flagged placeholder. */
  shipping: string | null
  methodName: string
  methodLong: string
  address: string
  steps: TimelineStep[]
  tracking: string | null
  carrier: string | null
  refundLine: string | null
  payLabel: string
  items: OrderLineView[]
}

export interface OrderLineView {
  id: string
  name: string
  /** Size, quantity and the lot that shipped — or that no lot has been picked. */
  meta: string
  total: string
}

function lineViews(order: Order): OrderLineView[] {
  return order.items.map((item) => ({
    id: item.id,
    name: item.productName,
    // Priced from the snapshot on the row, never re-derived from the catalogue.
    // What a past customer was charged does not change when a price does.
    meta: `${item.sizeDisplay} × ${item.qty} · ${item.lotCode ?? 'no lot yet'}`,
    total: formatPrice(item.unitPriceCents * item.qty),
  }))
}

export function orderView(order: Order): OrderView {
  const stage = orderStage(order.status, order.paymentProvider)
  const isTerminal = TERMINAL.includes(order.status)
  const method = shippingMethod(order.shippingMethod)

  return {
    stage,
    ...STAGE_COPY[stage],
    isTerminal,
    reference: order.paymentReference,
    placed: stamp(order.createdAt),
    showZelleFacts: stage === 'awaiting',
    total: formatPrice(order.totalCents),
    subtotal: formatPrice(order.subtotalCents),
    // A zero here would be a claim that shipping is free. It is not priced.
    shipping: method.priceCents === null ? null : formatPrice(order.shippingCents),
    methodName: method.label,
    methodLong: `${method.label} · ${method.carrier} · ${method.transit}${
      method.guaranteed ? ', carrier-guaranteed' : ', estimate'
    }`,
    address: [
      order.ship.name,
      [order.ship.line1, order.ship.line2].filter(Boolean).join(', '),
      `${order.ship.city}, ${order.ship.state.toUpperCase()} ${order.ship.postal}`,
    ].join('\n'),
    steps: orderTimeline(order),
    tracking: order.tracking,
    carrier: order.tracking ? method.carrier : null,
    refundLine: isTerminal
      ? null
      : `Refunds are handled by hand. Unopened vials with the cold-chain seal intact can be returned within 14 days of delivery; email us with reference ${order.paymentReference}.`,
    payLabel: order.paymentProvider === 'zelle' ? 'Zelle' : 'Crypto',
    items: lineViews(order),
  }
}
