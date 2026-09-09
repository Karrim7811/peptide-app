// Address autocomplete proxy.
//
// One route, two actions, because they share a session token and are otherwise
// the same handler with a different fetch at the end.
//
// It exists at all so the Places key stays on the server. It is gated on a
// signed-in user for a blunter reason: every call spends money, and an open
// endpoint in front of a metered API is someone else's free afternoon. The shop
// already requires an account, so this costs a buyer nothing.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MAX_QUERY, MIN_QUERY, resolve, suggest } from '@/lib/shop/address/places'

export const dynamic = 'force-dynamic'

/** Google's session tokens are UUIDs; anything else is not one of ours. */
const SESSION_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // 401 rather than an empty list. An empty list is a valid answer meaning "no
  // matches", and a signed-out caller should not be told that.
  if (!user) return NextResponse.json({ error: 'sign in required' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const { action, query, placeId, sessionToken } = (body ?? {}) as Record<string, unknown>

  if (typeof sessionToken !== 'string' || !SESSION_TOKEN.test(sessionToken)) {
    return NextResponse.json({ error: 'bad session token' }, { status: 400 })
  }

  if (action === 'suggest') {
    if (typeof query !== 'string' || query.trim().length < MIN_QUERY) {
      // Not an error. The field is simply too short to search on yet, and the
      // client asks on every keystroke.
      return NextResponse.json({ suggestions: [] })
    }
    const suggestions = await suggest(query.slice(0, MAX_QUERY), sessionToken)
    return NextResponse.json({ suggestions })
  }

  if (action === 'resolve') {
    if (typeof placeId !== 'string' || placeId.length === 0 || placeId.length > 512) {
      return NextResponse.json({ error: 'bad place id' }, { status: 400 })
    }
    // null when the key is unset, the lookup failed, or the components did not
    // add up to a shippable address. The client keeps what the buyer typed.
    return NextResponse.json({ address: await resolve(placeId, sessionToken) })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
