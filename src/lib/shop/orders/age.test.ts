// Signup already refuses under-18s in a database trigger. This is the second
// check, at the point of sale, because the trigger only guards the account —
// an account created before the trigger existed, or one whose dob was never
// backfilled, would otherwise walk straight through checkout.

import { describe, expect, it } from 'vitest'
import { isAdult } from '@/lib/shop/orders/age'

const on = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe('isAdult', () => {
  it('accepts someone comfortably over 18', () => {
    expect(isAdult('1990-05-20', on('2026-09-04'))).toBe(true)
  })

  it('rejects someone comfortably under 18', () => {
    expect(isAdult('2015-01-01', on('2026-09-04'))).toBe(false)
  })

  // The boundary, where off-by-one lives.
  it('accepts someone on the morning of their 18th birthday', () => {
    expect(isAdult('2008-09-04', on('2026-09-04'))).toBe(true)
  })

  it('rejects someone the day before their 18th birthday', () => {
    expect(isAdult('2008-09-05', on('2026-09-04'))).toBe(false)
  })

  // 2008 was a leap year. Someone born on 29 Feb turns 18 in 2026, which has no
  // 29 Feb — they must not be locked out for a calendar quirk.
  it('handles a 29 February birthday in a non-leap year', () => {
    expect(isAdult('2008-02-29', on('2026-03-01'))).toBe(true)
    expect(isAdult('2008-02-29', on('2026-02-28'))).toBe(false)
  })

  it('refuses a missing or unparseable date rather than defaulting to allowed', () => {
    expect(isAdult(null, on('2026-09-04'))).toBe(false)
    expect(isAdult('', on('2026-09-04'))).toBe(false)
    expect(isAdult('not-a-date', on('2026-09-04'))).toBe(false)
  })

  it('refuses a date in the future', () => {
    expect(isAdult('2030-01-01', on('2026-09-04'))).toBe(false)
  })
})
