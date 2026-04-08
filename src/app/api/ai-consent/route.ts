import { NextRequest, NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { AI_CONSENT_VERSION } from '@/lib/ai-consent'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const metadata = {
      ai_consent_granted: true,
      ai_consent_granted_at: new Date().toISOString(),
      ai_consent_version: AI_CONSENT_VERSION,
    }

    // Use Bearer token client for mobile, cookie client for web
    const authHeader = request.headers.get('Authorization')
    let updateError: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const client = createJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      )
      const { error } = await client.auth.updateUser({ data: metadata })
      if (error) updateError = error.message
    } else {
      // For cookie-based auth, get the session token and use it directly
      // This avoids issues with the server client cookie context
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        const client = createJsClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: { Authorization: `Bearer ${session.access_token}` },
            },
          }
        )
        const { error } = await client.auth.updateUser({ data: metadata })
        if (error) updateError = error.message
      } else {
        // Fallback: try the server client directly
        const { error } = await supabase.auth.updateUser({ data: metadata })
        if (error) updateError = error.message
      }
    }

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI consent error:', error)
    return NextResponse.json(
      { error: 'Failed to save consent.' },
      { status: 500 }
    )
  }
}
