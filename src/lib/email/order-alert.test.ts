import { afterEach, describe, expect, it } from 'vitest'
import { alertRecipients, alertSubject, alertText, type AlertInput } from '@/lib/email/order-alert'
import { SUPPORT_EMAIL } from '@/lib/legal'

const saved = process.env.SHOP_ORDER_ALERT_TO
afterEach(() => {
  if (saved === undefined) delete process.env.SHOP_ORDER_ALERT_TO
  else process.env.SHOP_ORDER_ALERT_TO = saved
})

const base: AlertInput = {
  paymentReference: 'PC-7K3M',
  totalCents: 12500,
  shippingMethodId: 'pickup',
  provider: 'zelle',
  buyerEmail: 'buyer@example.com',
  shipName: 'A Buyer',
  shipTo: null,
  lines: [{ productName: 'GLP-3', sizeDisplay: '30 mg', qty: 1, lineCents: 12500 }],
  adminUrl: 'https://peptidecortex.com/admin/orders',
}

describe('the shop order alert', () => {
  it('falls back to the support address rather than going nowhere', () => {
    delete process.env.SHOP_ORDER_ALERT_TO
    expect(alertRecipients()).toEqual([SUPPORT_EMAIL])
  })

  it('takes a comma-separated list', () => {
    process.env.SHOP_ORDER_ALERT_TO = ' a@x.com, b@y.com ,'
    expect(alertRecipients()).toEqual(['a@x.com', 'b@y.com'])
  })

  it('carries the reference, total, memo, buyer and the queue link', () => {
    expect(alertSubject(base)).toContain('PC-7K3M')
    const text = alertText(base)
    expect(text).toContain('$125.00')
    expect(text).toContain('memo PC-7K3M')
    expect(text).toContain('buyer@example.com')
    expect(text).toContain('/admin/orders')
  })
})
