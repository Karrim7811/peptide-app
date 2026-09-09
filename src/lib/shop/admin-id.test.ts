import { afterEach, describe, expect, it } from 'vitest'
import { adminRefusal, adminRefusalNote, adminUserId, isAdminUserId } from './admin-id'

const ID = '372ca67e-709e-4119-9121-29c4ba0626b8'
const OTHER = '7b31549f-b6d9-4419-a97f-3ffc323538bd'

function setEnv(value: string | undefined) {
  if (value === undefined) delete process.env.SHOP_ADMIN_USER_ID
  else process.env.SHOP_ADMIN_USER_ID = value
}

afterEach(() => setEnv(undefined))

describe('adminUserId', () => {
  it('is null when unset', () => {
    setEnv(undefined)
    expect(adminUserId()).toBeNull()
  })

  it('is null when empty or only whitespace', () => {
    setEnv('   ')
    expect(adminUserId()).toBeNull()
  })

  // The whole point of the helper. Pasting into a dashboard field picks up a
  // trailing newline or a pair of quotes far more often than anyone admits,
  // and a bare === turns that into a 404 nobody can diagnose.
  it('strips whitespace and wrapping quotes', () => {
    for (const raw of [` ${ID} `, `"${ID}"`, `'${ID}'`, `${ID}\n`, `" ${ID} "`]) {
      setEnv(raw)
      expect(adminUserId()).toBe(ID)
    }
  })

  it('leaves a clean value alone', () => {
    setEnv(ID)
    expect(adminUserId()).toBe(ID)
  })
})

describe('isAdminUserId', () => {
  it('matches the configured id, artefacts and all', () => {
    setEnv(`"${ID}"`)
    expect(isAdminUserId(ID)).toBe(true)
  })

  it('refuses another account', () => {
    setEnv(ID)
    expect(isAdminUserId(OTHER)).toBe(false)
  })

  it('refuses everyone when unset — an absent variable is not a wildcard', () => {
    setEnv(undefined)
    expect(isAdminUserId(ID)).toBe(false)
    expect(isAdminUserId(undefined)).toBe(false)
  })

  it('refuses a missing session', () => {
    setEnv(ID)
    expect(isAdminUserId(null)).toBe(false)
    expect(isAdminUserId('')).toBe(false)
  })

  // Case matters. Supabase ids are lowercase; a value uppercased somewhere in
  // transit is a different id, and the note below is what says so.
  it('is case sensitive', () => {
    setEnv(ID)
    expect(isAdminUserId(ID.toUpperCase())).toBe(false)
  })
})

describe('adminRefusal', () => {
  it('names an unset variable before anything else', () => {
    setEnv(undefined)
    expect(adminRefusal(ID)).toBe('unset')
    expect(adminRefusal(null)).toBe('unset')
  })

  it('names a missing session', () => {
    setEnv(ID)
    expect(adminRefusal(null)).toBe('no-session')
  })

  it('names a mismatch', () => {
    setEnv(ID)
    expect(adminRefusal(OTHER)).toBe('mismatch')
  })

  it('is null for the admin', () => {
    setEnv(ID)
    expect(adminRefusal(ID)).toBeNull()
  })
})

describe('adminRefusalNote', () => {
  it('never contains either id', () => {
    setEnv(ID)
    const note = adminRefusalNote('mismatch', OTHER)
    expect(note).not.toContain(ID)
    expect(note).not.toContain(OTHER)
  })

  it('reports both lengths, which is what catches a mistyped variable', () => {
    setEnv(`${ID}extra`)
    const note = adminRefusalNote('mismatch', ID)
    expect(note).toContain('configured length 41')
    expect(note).toContain('session id length 36')
  })

  it('calls out a case-only difference', () => {
    setEnv(ID)
    expect(adminRefusalNote('mismatch', ID.toUpperCase())).toContain('letter case')
    expect(adminRefusalNote('mismatch', OTHER)).toContain('different ids')
  })

  it('says so plainly when the variable is unset', () => {
    setEnv(undefined)
    expect(adminRefusalNote('unset')).toContain('unset')
  })
})
