import { describe, expect, it } from 'vitest'
import { matchCompounds } from './search'

describe('matchCompounds', () => {
  it('returns nothing for an empty query', () => {
    expect(matchCompounds('   ')).toEqual([])
  })

  it('finds a compound by name prefix, case-insensitively', () => {
    const names = matchCompounds('bpc').map((c) => c.name.toLowerCase())
    expect(names.length).toBeGreaterThan(0)
    expect(names[0]!.startsWith('bpc')).toBe(true)
  })

  it('caps the result list', () => {
    expect(matchCompounds('a').length).toBeLessThanOrEqual(8)
  })
})
