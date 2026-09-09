import { afterEach, describe, expect, it } from 'vitest'
import { MIN_QUERY, isConfigured, resolve, suggest, toAddress } from './places'

afterEach(() => {
  delete process.env.GOOGLE_PLACES_API_KEY
})

function components(pairs: Array<[string[], string, string?]>) {
  return pairs.map(([types, longText, shortText]) => ({
    types,
    longText,
    shortText: shortText ?? longText,
  }))
}

const FULL = components([
  [['street_number'], '1600'],
  [['route'], 'Pennsylvania Avenue Northwest'],
  [['locality', 'political'], 'Washington'],
  [['administrative_area_level_1', 'political'], 'District of Columbia', 'DC'],
  [['postal_code'], '20500'],
  [['country', 'political'], 'United States', 'US'],
])

describe('toAddress', () => {
  it('joins the street number to the route', () => {
    // Google splits these. A line1 of "Pennsylvania Avenue Northwest" ships
    // nowhere, so this is the single most important thing the mapping does.
    expect(toAddress(FULL)?.line1).toBe('1600 Pennsylvania Avenue Northwest')
  })

  it('takes the two-letter state, never the long name', () => {
    expect(toAddress(FULL)?.state).toBe('DC')
  })

  it('reads city and postal code', () => {
    const address = toAddress(FULL)
    expect(address?.city).toBe('Washington')
    expect(address?.postal).toBe('20500')
  })

  it('falls back to sublocality when there is no locality', () => {
    // Parts of New York City come back this way. Returning an empty City would
    // fail the form's own required check with nothing on screen explaining it.
    const brooklyn = components([
      [['street_number'], '30'],
      [['route'], 'Flatbush Avenue'],
      [['sublocality', 'political'], 'Brooklyn'],
      [['administrative_area_level_1'], 'New York', 'NY'],
      [['postal_code'], '11217'],
    ])
    expect(toAddress(brooklyn)?.city).toBe('Brooklyn')
  })

  // A half address is worse than none: it looks filled in, and the buyer has no
  // reason to check the parts they never typed.
  it.each([
    ['no route', ['route']],
    ['no city', ['locality', 'political']],
    ['no state', ['administrative_area_level_1', 'political']],
    ['no postal code', ['postal_code']],
  ])('returns null with %s', (_label, drop) => {
    const missing = FULL.filter((c) => c.types.join() !== drop.join())
    expect(toAddress(missing)).toBeNull()
  })

  // The one asymmetry, and it is deliberate. "1600" with no street is garbage.
  // A street with no number is an incomplete line the buyer can see and fix,
  // and the city, state and ZIP beside it are still correct — some premises
  // genuinely come back without a number, so rejecting them would refuse
  // addresses that are fine.
  it('accepts a route with no street number', () => {
    const noNumber = FULL.filter((c) => !c.types.includes('street_number'))
    expect(toAddress(noNumber)?.line1).toBe('Pennsylvania Avenue Northwest')
  })

  it('rejects a street number with no route', () => {
    const noRoute = FULL.filter((c) => !c.types.includes('route'))
    expect(toAddress(noRoute)).toBeNull()
  })

  it('returns null for nothing at all', () => {
    expect(toAddress([])).toBeNull()
    expect(toAddress(undefined)).toBeNull()
  })
})

describe('without a key', () => {
  it('reports itself unconfigured', () => {
    expect(isConfigured()).toBe(false)
    process.env.GOOGLE_PLACES_API_KEY = '   '
    expect(isConfigured()).toBe(false)
  })

  // The degradation contract. These must not reach the network: an unset key is
  // a supported state, not an outage, and the field stays a plain input.
  it('suggests nothing and resolves to null', async () => {
    await expect(suggest('1600 Pennsylvania', crypto.randomUUID())).resolves.toEqual([])
    await expect(resolve('some-place-id', crypto.randomUUID())).resolves.toBeNull()
  })
})

describe('with a key but a query too short', () => {
  it('does not call out', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const short = 'a'.repeat(MIN_QUERY - 1)
    // No fetch stub is installed. If this reached the network the test would
    // fail, which is the assertion.
    await expect(suggest(short, crypto.randomUUID())).resolves.toEqual([])
    await expect(suggest('   ', crypto.randomUUID())).resolves.toEqual([])
  })
})
