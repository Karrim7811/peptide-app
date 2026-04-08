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
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const client = createClient()
      const { error } = await client.auth.updateUser({ data: metadata })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
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
