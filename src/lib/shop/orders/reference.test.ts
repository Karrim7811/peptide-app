// A customer retypes this code into a bank memo field, and Karim matches it
// against an order by eye. Every character that can be mistaken for another is
// a payment that cannot be reconciled.

import { describe, expect, it } from 'vitest'
import { ALPHABET, generateReference, isValidReference } from '@/lib/shop/orders/reference'

describe('shape', () => {
  it('looks like PC-XXXX', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateReference()).toMatch(/^PC-[0-9A-Z]{4}$/)
    }
  })
})

describe('the alphabet', () => {
  it('excludes every character that is ambiguous when handwritten', () => {
    for (const c of 'OIL01') {
      expect(ALPHABET, `${c} is ambiguous and must not be in the alphabet`).not.toContain(c)
    }
  })

  it('is uppercase only, because banks upcase memo fields inconsistently', () => {
    expect(ALPHABET).toBe(ALPHABET.toUpperCase())
  })

  it('has no duplicates', () => {
    expect(new Set(ALPHABET.split('')).size).toBe(ALPHABET.length)
  })
})

describe('validation', () => {
  it('accepts everything it generates', () => {
    for (let i = 0; i < 500; i++) {
      expect(isValidReference(generateReference())).toBe(true)
    }
  })

  it('rejects codes containing ambiguous characters', () => {
    expect(isValidReference('PC-OIL0')).toBe(false)
    expect(isValidReference('PC-1234')).toBe(false)
  })

  it('rejects the wrong case, length, or prefix', () => {
    expect(isValidReference('pc-2345')).toBe(false)
    expect(isValidReference('PC-234')).toBe(false)
    expect(isValidReference('PC-23456')).toBe(false)
    expect(isValidReference('2345')).toBe(false)
    expect(isValidReference('XX-2345')).toBe(false)
    expect(isValidReference('')).toBe(false)
  })

  it('rejects whitespace rather than trimming it', () => {
    // Trimming would let ' PC-2345 ' and 'PC-2345' both validate while only one
    // matches the stored row. Reject, and let the caller normalise deliberately.
    expect(isValidReference(' PC-2345')).toBe(false)
    expect(isValidReference('PC-2345 ')).toBe(false)
  })
})

describe('collision behaviour', () => {
  // 31^4 is about 924,000. Uniqueness is enforced by the column constraint and
  // the insert retries; this only confirms the generator is not degenerate.
  it('spreads across the space well enough to retry rather than sequence', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 5000; i++) seen.add(generateReference())
    expect(seen.size).toBeGreaterThan(4900)
  })

  it('uses the whole alphabet', () => {
    const used = new Set<string>()
    for (let i = 0; i < 3000; i++) {
      for (const c of generateReference().slice(3)) used.add(c)
    }
    expect(used.size).toBe(ALPHABET.length)
  })
})
