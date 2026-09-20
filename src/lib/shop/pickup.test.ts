import { afterEach, describe, expect, it } from 'vitest'
import { pickupLines, pickupLocation } from '@/lib/shop/pickup'

// The availability switch for local pickup and the only source of a physical
// address the shop ever prints. Both halves matter: an unset deployment must
// offer nothing, and a set one must not print a gap where a street should be.

const KEYS = [
  'SHOP_PICKUP_AREA',
  'SHOP_PICKUP_ADDRESS',
  'SHOP_PICKUP_HOURS',
  'SHOP_PICKUP_NOTE',
] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('pickupLocation', () => {
  it('is null when no area is configured, whatever else is set', () => {
    // This is what keeps pickup off the checkout screen entirely. A deployment
    // with an address but no area is misconfigured, and the safe reading of a
    // misconfiguration is "not available", never a partial one.
    expect(pickupLocation()).toBeNull()

    process.env.SHOP_PICKUP_ADDRESS = '1200 Ponce de Leon Blvd'
    expect(pickupLocation()).toBeNull()
  })

  it('treats whitespace as unset', () => {
    process.env.SHOP_PICKUP_AREA = '   '
    expect(pickupLocation()).toBeNull()
  })

  it('reads the area alone, leaving the rest null rather than empty', () => {
    process.env.SHOP_PICKUP_AREA = 'Coral Gables, FL'
    expect(pickupLocation()).toEqual({
      area: 'Coral Gables, FL',
      address: null,
      hours: null,
      note: null,
    })
  })

  it('trims every field it is given', () => {
    process.env.SHOP_PICKUP_AREA = '  Coral Gables, FL '
    process.env.SHOP_PICKUP_ADDRESS = ' 1200 Ponce de Leon Blvd, Suite 300 '
    process.env.SHOP_PICKUP_HOURS = ' Weekdays 10:00–17:00 '
    process.env.SHOP_PICKUP_NOTE = ' Buzz 300. '

    expect(pickupLocation()).toEqual({
      area: 'Coral Gables, FL',
      address: '1200 Ponce de Leon Blvd, Suite 300',
      hours: 'Weekdays 10:00–17:00',
      note: 'Buzz 300.',
    })
  })
})

describe('pickupLines', () => {
  it('leads with the street address, then the area, hours and note', () => {
    const lines = pickupLines({
      area: 'Coral Gables, FL',
      address: '1200 Ponce de Leon Blvd, Suite 300',
      hours: 'Weekdays 10:00–17:00',
      note: 'Buzz 300.',
    })
    expect(lines).toEqual([
      '1200 Ponce de Leon Blvd, Suite 300',
      'Coral Gables, FL',
      'Weekdays 10:00–17:00',
      'Buzz 300.',
    ])
  })

  it('says the address is coming when only the area is known', () => {
    // A buyer who has paid needs to know whether they are waiting for something
    // or looking at everything there is. An area on its own reads as the whole
    // answer, and it is not one.
    const lines = pickupLines({ area: 'Coral Gables, FL', address: null, hours: null, note: null })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Coral Gables, FL')
    expect(lines[0]).toMatch(/email/i)
  })

  it('never emits an empty line for an unset field', () => {
    const lines = pickupLines({
      area: 'Coral Gables, FL',
      address: '1200 Ponce de Leon Blvd',
      hours: null,
      note: null,
    })
    expect(lines.every((line) => line.trim().length > 0)).toBe(true)
  })
})
