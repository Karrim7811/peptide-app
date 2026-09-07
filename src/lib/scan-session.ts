// The phone hand-off's rules.
//
// A scan session is a bearer credential: whoever holds the token can upload one
// photograph and spend one vision call as the account that created it, with no
// sign-in on the phone. Everything here exists to bound what a leaked token is
// worth.
//
// The rules, and why each one:
//
//   • 256 bits, from crypto.randomBytes. Not guessable, and derived from
//     nothing the holder could reconstruct.
//   • Ten minutes. A QR photographed off someone's screen is useless by the
//     time they have walked away with it.
//   • Single use, marked BEFORE the vision call rather than after, so a slow
//     call cannot be raced with a second upload.
//
// The token is never logged and never appears in a redirect the browser would
// keep in history beyond the capture page itself.

import { randomBytes } from 'node:crypto'

/** How long a hand-off stays open. Minutes, deliberately. */
export const SESSION_MINUTES = 10

/** 256 bits, base64url. 43 characters, well past the schema's 32 minimum. */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export function expiryFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_MINUTES * 60_000)
}

/** Shape enough to reject an obviously wrong token before touching the database. */
export function looksLikeToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32,64}$/.test(value)
}

export interface SessionRow {
  expires_at: string
  consumed_at: string | null
}

export type SessionRefusal = 'expired' | 'already-used'

/**
 * Whether an upload may be accepted against this session.
 *
 * Expiry is checked before consumption so an old, used token reports the more
 * useful of the two reasons.
 */
export function refuseUpload(
  row: SessionRow,
  now: Date = new Date(),
): SessionRefusal | null {
  if (new Date(row.expires_at).getTime() <= now.getTime()) return 'expired'
  if (row.consumed_at) return 'already-used'
  return null
}

export const REFUSAL_MESSAGE: Record<SessionRefusal, string> = {
  expired: 'This capture link has expired. Open the scanner again for a new one.',
  'already-used': 'This capture link has already been used. Each one takes one photo.',
}
