import { describe, expect, it } from 'vitest'
import { receiptHtml, receiptSubject, receiptText, type ReceiptInput } from '@/lib/email/payment-received'

const base: ReceiptInput = {
  paymentReference: 'PC-7K3M',
  subtotalCents: 12500,
  shippingCents: 1200,
  totalCents: 13700,
  shippingMethodId: 'priority',
  pickup: null,
  provider: 'zelle',
  paidAt: '2026-09-21T16:53:24Z',
  lines: [{ productName: 'GLP-3 (Retatrutide)', sizeDisplay: '30 mg', qty: 1, lineCents: 12500 }],
  orderUrl: 'https://peptidecortex.com/shop/order/PC-7K3M',
}

describe('the payment receipt', () => {
  const text = receiptText(base)

  it('names the order and says it is paid, with the amount and date', () => {
    expect(receiptSubject(base)).toContain('PC-7K3M')
    expect(text).toContain('paid in full')
    expect(text).toContain('$137.00')
    expect(text).toContain('September 21, 2026')
  })

  it('carries no payment instructions a spoofed copy could redirect', () => {
    expect(text).not.toMatch(/send to|how to pay/i)
    expect(text).toContain('trust the page')
  })

  it('tells a pickup buyer to wait for the ready email, not the post', () => {
    const pickup = receiptText({ ...base, shippingMethodId: 'pickup', shippingCents: 0, totalCents: 12500 })
    expect(pickup).toContain('COLLECTING IN PERSON')
    expect(pickup).not.toContain('USPS')
  })

  it('has no images and escapes the text', () => {
    const html = receiptHtml({ ...base, lines: [{ ...base.lines[0]!, productName: '<b>x</b>' }] })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;b&gt;')
  })
})
