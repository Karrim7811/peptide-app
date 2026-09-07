// Opening a phone hand-off.
//
// Creates a short-lived token the desktop renders as a QR code. Pro-gated and
// consent-gated here, because the phone page that follows has neither a session
// nor a way to ask — by the time an image arrives, the decision to allow it was
// made on this call.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServiceClient } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'
import { requirePro } from '@/lib/subscription'
import { expiryFrom, newToken } from '@/lib/scan-session'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // Consent is taken here and not on the phone. The capture page has no
    // account context to show a consent dialog about.
    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const proError = await requirePro(request)
    if (proError) return proError

    const token = newToken()
    const expiresAt = expiryFrom()

    // Service role: the phone will later write against this row with no session
    // of its own, so the row cannot depend on an insert policy.
    const service = createServiceClient()
    const { error } = await service.from('scan_sessions').insert({
      token,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('Scan session create error:', error)
    return NextResponse.json({ error: 'Could not open a capture link.' }, { status: 500 })
  }
}
