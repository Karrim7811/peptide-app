import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export const AI_CONSENT_VERSION = '1.0'
const CONSENT_KEY = 'ai_consent_granted'
const CONSENT_VERSION_KEY = 'ai_consent_version'

// Server-side: check if user has granted AI data consent
export function hasAiConsent(user: User): boolean {
  return (
    user.user_metadata?.ai_consent_granted === true &&
    user.user_metadata?.ai_consent_version === AI_CONSENT_VERSION
  )
}

// Server-side: returns a 403 response if consent is missing, null if OK
export function requireAiConsent(user: User): NextResponse | null {
  if (!hasAiConsent(user)) {
    return NextResponse.json(
      { error: 'AI data consent required.', code: 'CONSENT_REQUIRED' },
      { status: 403 }
    )
  }
  return null
}

// Client-side: localStorage cache helpers
export function getCachedConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      localStorage.getItem(CONSENT_KEY) === 'true' &&
      localStorage.getItem(CONSENT_VERSION_KEY) === AI_CONSENT_VERSION
    )
  } catch {
    return false
  }
}

export function setCachedConsent(granted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (granted) {
      localStorage.setItem(CONSENT_KEY, 'true')
      localStorage.setItem(CONSENT_VERSION_KEY, AI_CONSENT_VERSION)
    } else {
      localStorage.removeItem(CONSENT_KEY)
      localStorage.removeItem(CONSENT_VERSION_KEY)
    }
  } catch {
    // localStorage unavailable
  }
}
