// The security-critical piece of the whole shop.
//
// An unverified webhook endpoint is a public API for marking your own orders
// paid: post {type:'InvoiceSettled', metadata:{orderId}} and the goods ship. The
// only thing standing between that and a stranger is this function, so it is
// tested harder than anything else here.

import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifySignature } from '@/lib/shop/payments/btcpay-signature'

const SECRET = 'a-test-webhook-secret'
const body = JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'inv_1' })

const sign = (payload: string, secret = SECRET) =>
  `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`

describe('accepts only what BTCPay actually signed', () => {
  it('accepts a correctly signed body', () => {
    expect(verifySignature(body, sign(body), SECRET)).toBe(true)
  })

  it('rejects a body altered after signing', () => {
    const tampered = JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'inv_2' })
    expect(verifySignature(tampered, sign(body), SECRET)).toBe(false)
  })

  it('rejects a signature made with a different secret', () => {
    expect(verifySignature(body, sign(body, 'not-the-secret'), SECRET)).toBe(false)
  })

  it('rejects a valid signature for a different body', () => {
    expect(verifySignature(body, sign('{}'), SECRET)).toBe(false)
  })

  // Whitespace changes the bytes, so verification must run on the raw body. If
  // this ever passes, something is parsing before verifying.
  it('rejects a re-serialised body, because verification is over raw bytes', () => {
    const reserialised = JSON.stringify(JSON.parse(body), null, 2)
    expect(verifySignature(reserialised, sign(body), SECRET)).toBe(false)
  })
})

describe('rejects malformed input rather than throwing', () => {
  it.each([
    ['missing header', null],
    ['empty header', ''],
    ['no algorithm prefix', 'abc123'],
    ['wrong algorithm', `sha1=${'a'.repeat(64)}`],
    ['empty digest', 'sha256='],
    ['non-hex digest', `sha256=${'z'.repeat(64)}`],
    ['short digest', 'sha256=aabb'],
    ['long digest', `sha256=${'a'.repeat(128)}`],
  ])('%s', (_label, header) => {
    expect(verifySignature(body, header as string | null, SECRET)).toBe(false)
  })

  it('rejects everything when the secret is missing, rather than accepting anything', () => {
    expect(verifySignature(body, sign(body), '')).toBe(false)
  })
})

describe('comparison is constant time', () => {
  // Not observable from a unit test, so this asserts the implementation choice
  // instead: a === on hex digests leaks the correct prefix through timing, one
  // byte at a time. If someone swaps timingSafeEqual out, this fails.
  it('uses timingSafeEqual rather than string equality', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync('src/lib/shop/payments/btcpay-signature.ts', 'utf8'),
    )
    expect(source).toContain('timingSafeEqual')
  })
})
