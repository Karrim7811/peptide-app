// The receipt: sent when an order moves to 'paid'.
//
// The confirmation (order-confirmation.ts) is sent at checkout and is mostly
// instructions — where to send money, how much, which memo. Once the money has
// arrived the buyer needs the opposite: proof that it did, and what happens
// next. This is that proof. It carries no payment instructions at all, so there
// is nothing in it that a spoofed copy could redirect.
//
// Same rules as the confirmation: text is the product, HTML is a <pre> around
// it, no images, and the order page is named as the source of truth.

import { formatPrice } from '@/lib/shop/pricing'
import { shippingMethod, type ShippingMethodId } from '@/lib/shop/orders/shipping'
import { pickupLines, type PickupLocation } from '@/lib/shop/pickup'
import { SUPPORT_EMAIL } from '@/lib/legal'
import { escapeHtml } from './order-confirmation'

export interface ReceiptInput {
  paymentReference: string
  totalCents: number
  subtotalCents: number
  shippingCents: number
  shippingMethodId: ShippingMethodId
  pickup: PickupLocation | null
  provider: 'zelle' | 'btcpay'
  /** ISO timestamp the payment was recorded. */
  paidAt: string
  lines: Array<{ productName: string; sizeDisplay: string; qty: number; lineCents: number }>
  orderUrl: string
}

export function receiptSubject(input: ReceiptInput): string {
  return `Payment received — Peptide Cortex order ${input.paymentReference}`
}

/** A US calendar date. The time of day is noise on a receipt. */
function paidOn(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function nextBlock(input: ReceiptInput): string[] {
  if (shippingMethod(input.shippingMethodId).fulfilment !== 'collect') {
    return [
      'WHAT HAPPENS NEXT',
      '',
      'We pack your order and hand it to USPS, usually within one business day.',
      'You will get another email with the tracking number when it ships.',
    ]
  }

  return [
    'WHAT HAPPENS NEXT — COLLECTING IN PERSON',
    '',
    ...(input.pickup ? pickupLines(input.pickup).map((line) => `  ${line}`) : []),
    ...(input.pickup ? [''] : []),
    'We will email you when your order is ready to collect, usually within one',
    'business day. Please bring this reference and do not travel before then.',
  ]
}

export function receiptText(input: ReceiptInput): string {
  const method = shippingMethod(input.shippingMethodId)
  const collect = method.fulfilment === 'collect'
  const rail = input.provider === 'zelle' ? 'Zelle' : 'crypto'

  return [
    `Receipt — order ${input.paymentReference}`,
    '',
    `Thank you. We received your ${rail} payment of ${formatPrice(input.totalCents)}`,
    `on ${paidOn(input.paidAt)}. This order is paid in full.`,
    '',
    'WHAT YOU ORDERED',
    '',
    ...input.lines.map(
      (line) =>
        `  ${line.qty} x ${line.productName} ${line.sizeDisplay}` +
        `  ${formatPrice(line.lineCents)}`,
    ),
    '',
    `  Subtotal   ${formatPrice(input.subtotalCents)}`,
    `  ${collect ? 'Pickup    ' : 'Shipping  '} ${formatPrice(input.shippingCents)}  ${
      collect ? method.label : `${method.label}, ${method.carrier}`
    }`,
    `  Total      ${formatPrice(input.totalCents)}`,
    `  Paid       ${formatPrice(input.totalCents)}  ${rail}, ${paidOn(input.paidAt)}`,
    '',
    ...nextBlock(input),
    '',
    'YOUR ORDER PAGE',
    '',
    `  ${input.orderUrl}`,
    '',
    'That page is the source of truth for this order. If any message you receive',
    'disagrees with it — including this one — trust the page and not the message.',
    'You owe nothing further on this order; we will never email you asking for',
    'another payment on it.',
    '',
    `Questions: ${SUPPORT_EMAIL}`,
    '',
    '--',
    'Peptide Cortex. For research and reference purposes only. Not intended as',
    'dosing instructions for human or animal use, and not for human consumption.',
    'Consult a licensed physician before any medical decisions. Adults 18+.',
    'US shipping only.',
  ].join('\n')
}

export function receiptHtml(input: ReceiptInput): string {
  return [
    '<!doctype html><html><body style="margin:0;padding:24px;background:#E6E9EB;">',
    '<pre style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
    'font-size:13px;line-height:1.6;color:#1A1D1F;white-space:pre-wrap;',
    'word-break:break-word;max-width:70ch;">',
    escapeHtml(receiptText(input)),
    '</pre></body></html>',
  ].join('')
}
