// The order confirmation.
//
// On a card shop this is a courtesy — the money already moved. On this one it
// is load-bearing: payment happens AFTER checkout, in a different app, at a
// later time. The buyer leaves the site holding three facts they must not lose
// — where to send it, exactly how much, and the memo code — and without this
// the only place those live is a browser tab.
//
// ── Text is the product; HTML is the decoration ───────────────────────────
//
// Gmail proxies remote images and Outlook often blocks them outright, so
// anything that matters is text. There is no QR in here for that reason: a
// payment code that renders as a blank box for half the recipients is worse
// than no payment code at all. The order page carries the QR.
//
// ── The page is authoritative, not this email ─────────────────────────────
//
// "Here is where to send money" arriving by email is the exact shape of a
// business-email-compromise, and buyers are right to distrust it. So the mail
// says plainly that the order page is the source of truth and that a message
// disagreeing with it should not be trusted. That line is the whole reason a
// customer can safely act on this at all — do not cut it for brevity.

import { formatPrice } from '@/lib/shop/pricing'
import { shippingMethod, type ShippingMethodId } from '@/lib/shop/orders/shipping'
import { SUPPORT_EMAIL } from '@/lib/legal'

export interface ConfirmationInput {
  paymentReference: string
  totalCents: number
  subtotalCents: number
  shippingCents: number
  shippingMethodId: ShippingMethodId
  provider: 'zelle' | 'btcpay'
  lines: Array<{ productName: string; sizeDisplay: string; qty: number; lineCents: number }>
  /** Absolute, because an email has no origin to resolve against. */
  orderUrl: string
  /** Null until SHOP_ZELLE_HANDLE is set. The mail says so rather than guessing. */
  zelleHandle: string | null
  /**
   * The registered name the buyer's bank will show. The storefront and the
   * account are not the same name — Peptide Cortex, Tigris Tech Labs LLC — and
   * an unexplained mismatch on the screen where someone decides whether to send
   * money reads exactly like a scam. Null when unconfigured; never guessed.
   */
  zelleName: string | null
}

export function confirmationSubject(input: ConfirmationInput): string {
  // The reference is in the subject because it is what the customer will search
  // their inbox for, months later, when they want this message again.
  return `Your Peptide Cortex order ${input.paymentReference}`
}

/**
 * How to pay, in the buyer's own terms.
 *
 * Zelle is the manual rail: three facts and a warning that the memo is the only
 * link between their money and this order. BTCPay confirms itself, so it gets a
 * pointer at the order page and nothing to retype.
 */
function payingBlock(input: ConfirmationInput): string[] {
  if (input.provider !== 'zelle') {
    return [
      'You paid by crypto. That confirms itself, usually within minutes — there',
      'is nothing for you to do. The order page shows where it has got to.',
    ]
  }

  if (!input.zelleHandle) {
    return [
      'HOW TO PAY',
      '',
      'The Zelle account is not set up yet, so there is nowhere to send this',
      `payment and nothing has been charged. Email ${SUPPORT_EMAIL} with the`,
      'reference above and we will finish it by hand.',
    ]
  }

  return [
    'HOW TO PAY — BY ZELLE',
    '',
    `  Send to      ${input.zelleHandle}`,
    `  Exact amount ${formatPrice(input.totalCents)}`,
    `  Memo         ${input.paymentReference}`,
    '',
    ...(input.zelleName
      ? [
          `Your banking app will show this account as ${input.zelleName} — the`,
          'company behind Peptide Cortex. That is the right account.',
          '',
        ]
      : []),
    'The memo code is the only link between your payment and this order. A',
    'payment without it has to be matched by hand and will be slower.',
    '',
    'We confirm Zelle payments by hand, usually within one business day.',
    'Delivery estimates start when your payment clears and the parcel is handed',
    'to USPS — not when you placed the order.',
  ]
}

/** The plain-text body. Everything that matters is here. */
export function confirmationText(input: ConfirmationInput): string {
  const method = shippingMethod(input.shippingMethodId)

  const items = input.lines.map(
    (line) =>
      `  ${line.qty} x ${line.productName} ${line.sizeDisplay}` +
      `  ${formatPrice(line.lineCents)}`,
  )

  return [
    `Order ${input.paymentReference}`,
    '',
    'Thank you. Your order is saved. Nothing has been charged automatically —',
    'this shop takes payment on rails that have no card issuer behind them.',
    '',
    'WHAT YOU ORDERED',
    '',
    ...items,
    '',
    `  Subtotal   ${formatPrice(input.subtotalCents)}`,
    `  Shipping   ${formatPrice(input.shippingCents)}  ${method.label}, ${method.carrier}`,
    `  Total      ${formatPrice(input.totalCents)}`,
    '',
    ...payingBlock(input),
    '',
    'YOUR ORDER PAGE',
    '',
    `  ${input.orderUrl}`,
    '',
    'That page is the source of truth for this order, and it always shows the',
    'current state. If any message you receive disagrees with it — including',
    'this one — trust the page and not the message. We will never email you to',
    'say our payment details have changed.',
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

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Order data is ours, but a product name is still not markup. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]!)
}

/**
 * The HTML body.
 *
 * A single monospace block wrapping the same text. Not a designed template:
 * every extra element is another thing a mail client renders differently, and
 * the content here is a short list of figures that a fixed-width column already
 * presents better than a layout would.
 */
export function confirmationHtml(input: ConfirmationInput): string {
  return [
    '<!doctype html><html><body style="margin:0;padding:24px;background:#E6E9EB;">',
    '<pre style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
    'font-size:13px;line-height:1.6;color:#1A1D1F;white-space:pre-wrap;',
    'word-break:break-word;max-width:70ch;">',
    escapeHtml(confirmationText(input)),
    '</pre></body></html>',
  ].join('')
}
