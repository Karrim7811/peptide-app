// BTCPay webhook signature verification.
//
// BTCPay signs each webhook with HMAC-SHA256 over the RAW request body, in the
// BTCPay-Sig header, as `sha256=<hex>`.
//
// Verify BEFORE parsing. An endpoint that reads the body first is a public API
// for marking your own orders paid — post an InvoiceSettled event with someone
// else's order id and the goods ship.
//
// Verify over the raw string, not a re-serialised object: JSON.stringify does
// not round-trip byte-for-byte, so re-serialising changes the bytes and either
// breaks every valid signature or, worse, tempts someone into loosening the
// check until it passes.

import { createHmac, timingSafeEqual } from 'node:crypto'

const HEX_64 = /^[0-9a-f]{64}$/i

export function verifySignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string,
): boolean {
  if (!header || !secret) return false

  const [algorithm, provided] = header.split('=')
  if (algorithm !== 'sha256' || !provided) return false
  // Check shape before Buffer.from, which silently drops invalid hex rather than
  // failing — 'zz' would otherwise become an empty buffer and compare oddly.
  if (!HEX_64.test(provided)) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  const a = Buffer.from(provided, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length) return false

  // timingSafeEqual, never ===. String comparison short-circuits at the first
  // differing byte, which leaks the correct prefix through response timing and
  // lets a signature be recovered one byte at a time.
  return timingSafeEqual(a, b)
}
