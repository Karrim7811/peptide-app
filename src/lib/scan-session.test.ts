import { describe, expect, it } from 'vitest'
import {
  REFUSAL_MESSAGE,
  SESSION_MINUTES,
  expiryFrom,
  looksLikeToken,
  newToken,
  refuseUpload,
} from '@/lib/scan-session'

describe('newToken', () => {
  it('is long enough for the schema constraint and then some', () => {
    expect(newToken().length).toBeGreaterThanOrEqual(32)
  })

  it('is url-safe, so it survives being a path segment', () => {
    for (let i = 0; i < 50; i++) expect(newToken()).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  // Guessability is the whole risk. Anything that repeats is a bug.
  it('does not repeat across a thousand draws', () => {
    const seen = new Set(Array.from({ length: 1000 }, newToken))
    expect(seen.size).toBe(1000)
  })
})

describe('expiryFrom', () => {
  it('opens a window of minutes, not hours', () => {
    const now = new Date('2026-09-07T12:00:00.000Z')
    expect(expiryFrom(now).toISOString()).toBe('2026-09-07T12:10:00.000Z')
    expect(SESSION_MINUTES).toBeLessThanOrEqual(15)
  })

  // The schema refuses anything an hour out. If this ever drifts past that,
  // inserts start failing in production rather than here.
  it('stays inside the hour the schema allows', () => {
    expect(SESSION_MINUTES * 60_000).toBeLessThan(60 * 60_000)
  })
})

describe('looksLikeToken', () => {
  it('accepts what newToken produces', () => {
    expect(looksLikeToken(newToken())).toBe(true)
  })

  it('rejects anything short, empty, wrongly typed or path-like', () => {
    for (const bad of ['', 'short', null, undefined, 42, {}, '../../etc/passwd', 'a'.repeat(200)]) {
      expect(looksLikeToken(bad), String(bad)).toBe(false)
    }
  })
})

describe('refuseUpload', () => {
  const now = new Date('2026-09-07T12:00:00.000Z')
  const open = { expires_at: '2026-09-07T12:05:00.000Z', consumed_at: null }

  it('allows an open, unused session', () => {
    expect(refuseUpload(open, now)).toBeNull()
  })

  it('refuses an expired session', () => {
    expect(refuseUpload({ ...open, expires_at: '2026-09-07T11:59:59.000Z' }, now)).toBe('expired')
  })

  // Exactly at the boundary the window is closed, not open.
  it('treats the expiry instant as closed', () => {
    expect(refuseUpload({ ...open, expires_at: now.toISOString() }, now)).toBe('expired')
  })

  it('refuses a second upload against the same token', () => {
    expect(refuseUpload({ ...open, consumed_at: '2026-09-07T12:01:00.000Z' }, now)).toBe(
      'already-used',
    )
  })

  it('has a message for every refusal', () => {
    for (const reason of ['expired', 'already-used'] as const) {
      expect(REFUSAL_MESSAGE[reason].trim()).not.toBe('')
    }
  })
})
