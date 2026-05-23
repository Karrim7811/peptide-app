import { NextResponse, type NextRequest } from 'next/server'
import { isBlockedCountry } from '@/lib/geoblock'

// EU geoblock — see CLAUDE.md S16.11 and src/lib/geoblock.ts.
// Until full GDPR/UK-GDPR/FADP compliance is shipped, EU/EEA/UK/CH visitors
// are rewritten to /eu where they see a "US-only" page. The block runs on
// page navigation only — API routes are intentionally allowed so existing
// US-based users who travel through Europe with a logged-in iOS app or web
// session continue to function.
export function middleware(request: NextRequest) {
  const country = request.geo?.country
  if (isBlockedCountry(country)) {
    const url = request.nextUrl.clone()
    url.pathname = '/eu'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Exclude API, Next internals, static assets, the manifest, the service
  // worker, the geoblock page itself, and the favicon.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon|icons|manifest.json|sw.js|eu).*)',
  ],
}
