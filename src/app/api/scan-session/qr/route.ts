// The QR image for a capture link.
//
// Rendered server-side as SVG rather than shipping a QR encoder to the browser:
// it is a few hundred bytes of markup against ~30 KB of JavaScript, and the
// desktop page has no other reason to be interactive at this point.
//
// Auth-gated even though a QR is only as secret as the token inside it. The
// caller has to be signed in to have obtained a token at all, and an open image
// endpoint that renders arbitrary text is a small open redirect waiting to be
// found.

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { looksLikeToken } from '@/lib/scan-session'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('', { status: 401 })

  const url = request.nextUrl.searchParams.get('url') ?? ''
  const token = request.nextUrl.searchParams.get('token') ?? ''

  // Only ever encodes one of our own capture URLs, never arbitrary text.
  if (!looksLikeToken(token) || !url.endsWith(`/scan/${token}`)) {
    return new NextResponse('', { status: 400 })
  }

  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#1A1D1F', light: '#0000' },
  })

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      // A capture link is private and short-lived. Never cached anywhere.
      'Cache-Control': 'private, no-store',
    },
  })
}
