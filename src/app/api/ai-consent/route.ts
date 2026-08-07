import { NextRequest, NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { getAuthenticatedContext, createClient } from '@/lib/supabase/server'
import { AI_CONSENT_VERSION } from '@/lib/ai-consent'

// Persists AI consent onto auth.users.user_metadata.
//
// WRITING USER METADATA NEEDS THE USER'S OWN ACCESS TOKEN, not merely a
// validated identity. The previous version validated the caller with
// getUser() (which works from cookies alone), then tried three different ways
// to obtain a session to write with, and fell through to calling updateUser()
// on a client that had none — surfacing "Auth session missing!" in the UI while
// authentication itself was fine.
//
// The web client now sends the token explicitly, which is the same path the
// iOS app has always used. The cookie lookup below remains only as a fallback
// for any caller that does not.

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedContext(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const accessToken = await resolveAccessToken(request)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' },
        { status: 401 }
      )
    }

    const client = createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    // Spread the existing metadata rather than trusting the update to merge.
    // `dob` is stored here at signup and backs the 18+ gate; losing it would be
    // silent and would not surface until someone went looking for it.
    const { error } = await client.auth.updateUser({
      data: {
        ...(user.user_metadata ?? {}),
        ai_consent_granted: true,
        ai_consent_granted_at: new Date().toISOString(),
        ai_consent_version: AI_CONSENT_VERSION,
      },
    })

    if (error) {
      console.error('AI consent update failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI consent error:', error)
    return NextResponse.json({ error: 'Failed to save consent.' }, { status: 500 })
  }
}

/** Bearer header first (web now, and iOS always); session cookie as a fallback. */
async function resolveAccessToken(request: NextRequest): Promise<string | null> {
  const header = request.headers.get('Authorization')
  if (header?.startsWith('Bearer ')) return header.slice(7)

  try {
    const {
      data: { session },
    } = await createClient().auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}
