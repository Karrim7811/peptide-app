// Zelle has no merchant API. Everything this adapter produces is text a human
// reads and then retypes into a banking app, so the tests are about whether a
// person can act on it correctly, not about a protocol.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ZELLE } from '@/lib/shop/payments/zelle'
import type { ChargeableOrder } from '@/lib/shop/payments/provider'

const order: ChargeableOrder = {
  id: 'order-1',
  paymentReference: 'PC-4F2A',
  totalCents: 12500,
}

describe('zelle adapter', () => {
  const saved = process.env.SHOP_ZELLE_HANDLE

  beforeEach(() => {
    process.env.SHOP_ZELLE_HANDLE = 'payments@example.com'
  })

  afterEach(() => {
    if (saved === undefined) delete process.env.SHOP_ZELLE_HANDLE
    else process.env.SHOP_ZELLE_HANDLE = saved
  })

  it('confirms nothing automatically — this is why the admin queue exists', () => {
    expect(ZELLE.confirmsAutomatically).toBe(false)
  })

  it('has no provider reference to return', async () => {
    expect((await ZELLE.createCharge(order)).providerRef).toBeNull()
  })

  it('sends the buyer nowhere — payment happens in their banking app', async () => {
    expect((await ZELLE.createCharge(order)).redirectUrl).toBeUndefined()
  })

  it('puts the reference where the buyer cannot miss it', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.reference).toBe('PC-4F2A')
    expect(intent.instructions?.body.join(' ')).toContain('PC-4F2A')
  })

  it('states the exact amount, because a human matches it against a statement', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.body.join(' ')).toContain('$125.00')
  })

  it('names the destination handle', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.body.join(' ')).toContain('payments@example.com')
  })

  // Rendering instructions without a handle would tell a customer to send money
  // nowhere. Fail loudly at checkout instead.
  it('refuses to render instructions without a configured handle', async () => {
    delete process.env.SHOP_ZELLE_HANDLE
    await expect(ZELLE.createCharge(order)).rejects.toThrow(/SHOP_ZELLE_HANDLE/)
  })

  it('refuses a blank handle as firmly as a missing one', async () => {
    process.env.SHOP_ZELLE_HANDLE = '   '
    await expect(ZELLE.createCharge(order)).rejects.toThrow(/SHOP_ZELLE_HANDLE/)
  })

  // Transit estimates start when the parcel is handed over, and that cannot
  // happen until a human has confirmed this payment. Saying so is the honest
  // version of a shipping promise on this rail.
  it('tells the buyer that shipping starts after confirmation, not after checkout', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.body.join(' ')).toMatch(/confirm/i)
  })
})
