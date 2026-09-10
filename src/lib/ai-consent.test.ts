import { describe, expect, it } from 'vitest'
import { AI_CONSENT_VERSION, consentMetadata, hasAiConsent } from './ai-consent'
import type { User } from '@supabase/supabase-js'

function userWith(metadata: Record<string, unknown>): User {
  return { user_metadata: metadata } as unknown as User
}

describe('consentMetadata', () => {
  it('records the grant, the time and the version', () => {
    const before = Date.now()
    const meta = consentMetadata({})
    expect(meta.ai_consent_granted).toBe(true)
    expect(meta.ai_consent_version).toBe(AI_CONSENT_VERSION)
    expect(Date.parse(meta.ai_consent_granted_at as string)).toBeGreaterThanOrEqual(before - 1000)
  })

  // The write REPLACES user_metadata rather than merging into it. `dob` backs
  // the 18+ gate, and dropping it here would be silent — no error, no visible
  // change, and nothing would notice until someone checked an age.
  it('carries every existing key across, dob above all', () => {
    const meta = consentMetadata({
      dob: '1985-04-12',
      full_name: 'A Person',
      some_future_key: { nested: true },
    })
    expect(meta.dob).toBe('1985-04-12')
    expect(meta.full_name).toBe('A Person')
    expect(meta.some_future_key).toEqual({ nested: true })
  })

  it('survives a user with no metadata at all', () => {
    expect(consentMetadata(null).ai_consent_granted).toBe(true)
    expect(consentMetadata(undefined).ai_consent_granted).toBe(true)
  })

  it('does not mutate what it was given', () => {
    const existing = { dob: '1985-04-12' }
    consentMetadata(existing)
    expect(existing).toEqual({ dob: '1985-04-12' })
  })

  // The round trip: what the route writes must be what the gate accepts.
  it('produces metadata that hasAiConsent accepts', () => {
    expect(hasAiConsent(userWith(consentMetadata({ dob: '1985-04-12' })))).toBe(true)
  })
})

describe('hasAiConsent', () => {
  it('refuses a grant recorded against an older version', () => {
    // A version bump means the disclosure changed, so the old agreement was to
    // different text and must be asked again.
    expect(
      hasAiConsent(userWith({ ai_consent_granted: true, ai_consent_version: '0.9' })),
    ).toBe(false)
  })

  it('refuses an ungranted or absent flag', () => {
    expect(hasAiConsent(userWith({ ai_consent_version: AI_CONSENT_VERSION }))).toBe(false)
    expect(hasAiConsent(userWith({}))).toBe(false)
  })
})
