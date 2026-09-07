import { afterEach, describe, expect, it, vi } from 'vitest'
import { ORDERS_FROM, send } from '@/lib/email/send'

// The one rule this module has: it never throws. Every caller is a side effect
// of something more important than itself, and an order must not fail because
// a mail API did.

const saved = process.env.RESEND_API_KEY

afterEach(() => {
  if (saved === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = saved
  vi.restoreAllMocks()
})

const mail = { to: 'buyer@example.com', subject: 'Order PC-7K3M', text: 'body' }

describe('send', () => {
  it('reports an unconfigured provider rather than failing', async () => {
    delete process.env.RESEND_API_KEY
    expect(await send(mail)).toEqual({ ok: false, reason: 'not-configured' })
  })

  it('refuses an empty recipient before calling out', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    expect(await send({ ...mail, to: '  ' })).toEqual({ ok: false, reason: 'no-recipient' })
  })

  it('sends from orders@, never from the address that receives money', () => {
    // pay@ takes Zelle. If the sender were the same address, a spoofed From:
    // would carry a far more convincing instruction to send money elsewhere.
    expect(ORDERS_FROM).toContain('orders@peptidecortex.com')
    expect(ORDERS_FROM).not.toContain('pay@')
  })
})
