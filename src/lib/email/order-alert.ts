// The shop's own "you have an order" email.
//
// Until this existed the only mail an order produced was the buyer's copy, so
// orders could sit in awaiting_payment for days with nobody told they were
// there (2026-09: three did). This goes to the shop, not the buyer, and exists
// to be acted on: match the Zelle memo, then mark it paid in /admin/orders.
//
// ── Where it goes ─────────────────────────────────────────────────────────
//
// SHOP_ORDER_ALERT_TO, a comma-separated list. Unset, it falls back to
// SUPPORT_EMAIL — unlike the Zelle handle, sending the shop's own mail to the
// shop's own published address cannot mislead anyone, and silence is the
// failure this file exists to end.

import { formatPrice } from '@/lib/shop/pricing'
import { shippingMethod, type ShippingMethodId } from '@/lib/shop/orders/shipping'
import { SUPPORT_EMAIL } from '@/lib/legal'

export interface AlertInput {
  paymentReference: string
  totalCents: number
  shippingMethodId: ShippingMethodId
  provider: 'zelle' | 'btcpay'
  buyerEmail: string | null
  shipName: string
  /** One line, or null on a collected order. */
  shipTo: string | null
  lines: Array<{ productName: string; sizeDisplay: string; qty: number; lineCents: number }>
  adminUrl: string
}

export function alertRecipients(): string[] {
  const raw = process.env.SHOP_ORDER_ALERT_TO?.trim()
  const list = (raw ? raw.split(',') : [SUPPORT_EMAIL]).map((a) => a.trim()).filter(Boolean)
  return list.length > 0 ? list : [SUPPORT_EMAIL]
}

export function alertSubject(input: AlertInput): string {
  return `New order ${input.paymentReference} — ${formatPrice(input.totalCents)} by ${
    input.provider === 'zelle' ? 'Zelle' : 'crypto'
  }`
}

export function alertText(input: AlertInput): string {
  const method = shippingMethod(input.shippingMethodId)
  return [
    `New order ${input.paymentReference}`,
    '',
    `  Total     ${formatPrice(input.totalCents)}`,
    `  Payment   ${input.provider === 'zelle' ? `Zelle — memo ${input.paymentReference}` : 'BTCPay (confirms itself)'}`,
    `  Method    ${method.label}`,
    `  Buyer     ${input.shipName}${input.buyerEmail ? ` <${input.buyerEmail}>` : ''}`,
    ...(input.shipTo ? [`  Ship to   ${input.shipTo}`] : []),
    '',
    ...input.lines.map(
      (line) => `  ${line.qty} x ${line.productName} ${line.sizeDisplay}  ${formatPrice(line.lineCents)}`,
    ),
    '',
    input.provider === 'zelle'
      ? 'When the Zelle payment with this memo arrives, mark it paid — that sends the buyer their receipt:'
      : 'The order queue:',
    `  ${input.adminUrl}`,
  ].join('\n')
}
