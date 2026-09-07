// Polling a hand-off from the desktop.
//
// Read under the caller's own session, not the service role, so the RLS policy
// (auth.uid() = user_id) is what stops one account polling another's token.
// The token alone is deliberately not enough to read a result: it is enough to
// WRITE one photo, and those are different powers.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { looksLikeToken } from '@/lib/scan-session'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  if (!looksLikeToken(params.token)) {
    return NextResponse.json({ error: 'Unknown capture link.' }, { status: 404 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const { data } = await supabase
    .from('scan_sessions')
    .select('expires_at, consumed_at, result, failed_at')
    .eq('token', params.token)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Unknown capture link.' }, { status: 404 })

  return NextResponse.json({
    // One of: waiting, reading, done, failed, expired.
    status: data.failed_at
      ? 'failed'
      : data.result
        ? 'done'
        : data.consumed_at
          ? 'reading'
          : new Date(data.expires_at).getTime() <= Date.now()
            ? 'expired'
            : 'waiting',
    vials: data.result ?? null,
  })
}
