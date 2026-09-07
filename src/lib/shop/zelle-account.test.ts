import { afterEach, describe, expect, it } from 'vitest'
import { recipientNote, zelleAccount } from '@/lib/shop/zelle-account'

// The name is the point of this module. A buyer typing the handle into their
// banking app is shown the registered owner, and if that name is not one we
// prepared them for, stopping is the correct thing for them to do.

const saved = { ...process.env }

afterEach(() => {
  process.env = { ...saved }
})

describe('zelleAccount', () => {
  it('is null with no handle, so no surface can name a destination', () => {
    delete process.env.SHOP_ZELLE_HANDLE
    expect(zelleAccount()).toBeNull()
  })

  it('treats whitespace as unset rather than as an address', () => {
    process.env.SHOP_ZELLE_HANDLE = '   '
    expect(zelleAccount()).toBeNull()
  })

  it('reads the handle, name and QR when they are configured', () => {
    process.env.SHOP_ZELLE_HANDLE = 'info@tigristechlabs.com'
    process.env.SHOP_ZELLE_NAME = 'Tigris Tech Labs LLC'
    process.env.SHOP_ZELLE_QR_URL = '/shop/zelle-qr.png'
    expect(zelleAccount()).toEqual({
      handle: 'info@tigristechlabs.com',
      name: 'Tigris Tech Labs LLC',
      qrUrl: '/shop/zelle-qr.png',
    })
  })

  it('leaves the name null rather than guessing one', () => {
    // A wrong name is worse than no name: it tells the buyer to expect
    // something their bank will not show them.
    process.env.SHOP_ZELLE_HANDLE = 'info@tigristechlabs.com'
    delete process.env.SHOP_ZELLE_NAME
    expect(zelleAccount()?.name).toBeNull()
  })
})

describe('recipientNote', () => {
  it('names the entity and says it is the right account', () => {
    const note = recipientNote({
      handle: 'info@tigristechlabs.com',
      name: 'Tigris Tech Labs LLC',
      qrUrl: null,
    })
    expect(note).toContain('Tigris Tech Labs LLC')
    expect(note).toMatch(/right account/)
  })

  it('still warns the bank will show a name, when we do not know it', () => {
    const note = recipientNote({ handle: 'x@y.com', name: null, qrUrl: null })
    expect(note).toMatch(/registered name/)
    // Must not invent one.
    expect(note).not.toContain('LLC')
  })
})
