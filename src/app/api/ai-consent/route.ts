import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContext, createServiceClient } from '@/lib/supabase/server'
import { AI_CONSENT_VERSION, consentMetadata } from '@/lib/ai-consent'

// Persists AI consent onto auth.users.user_metadata.
//
// ── The bug this route had twice, and why the second fix failed ───────────
//
// Consent is stored in user_metadata, and writing that is an auth operation,
// not a database one. The first version validated the caller with getUser()
// and then called updateUser() on a client that held no session: "Auth session
// missing!" in the UI while authentication itself was perfectly fine.
//
// The second version looked like a fix and was not. It took the access token
// from the Authorization header and handed it to createClient() as
// `global.headers`. But `global.headers` applies to PostgREST, Storage and
// Functions — NOT to `client.auth`, which is GoTrue and builds its own
// Authorization header from the session in its own storage. That storage was
// empty, so updateUser() threw the identical "Auth session missing!" and the
// header comment above it confidently described the problem as solved.
//
// The lesson generalises: passing a bearer token via `global.headers` does not
// authenticate `supabase.auth.*` calls. It never has.
//
// ── What it does now ──────────────────────────────────────────────────────
//
// getAuthenticatedContext() establishes WHO is calling — Bearer for iOS, the
// session cookie for web — and the write is then performed by the service role
// through the admin API, which needs no user session at all. The id written to
// is the validated caller's own and comes from the token, never from the
// request body, so this cannot be pointed at another account.

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedContext(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    let service
    try {
      service = createServiceClient()
    } catch {
      // Throws only when SUPABASE_SERVICE_ROLE_KEY is absent. Say so plainly
      // rather than showing the operator a Supabase internal string.
      console.error('AI consent: SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Consent cannot be saved right now. Please try again later.' },
        { status: 503 }
      )
    }

    // Spread the existing metadata rather than trusting the update to merge.
    // `dob` is stored here at signup and backs the 18+ gate; losing it would be
    // silent and would not surface until someone went looking for it.
    const { error } = await service.auth.admin.updateUserById(user.id, {
      user_metadata: consentMetadata(user.user_metadata),
    })

    if (error) {
      console.error('AI consent update failed:', error.message)
      return NextResponse.json({ error: 'Failed to save consent.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, version: AI_CONSENT_VERSION })
  } catch (error) {
    console.error('AI consent error:', error)
    return NextResponse.json({ error: 'Failed to save consent.' }, { status: 500 })
  }
}
