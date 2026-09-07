// Where to send someone after they sign in.
//
// A gate that redirects to /login and then drops the person on /dashboard has
// lost the thing they came for. Every gate in the app passes the page it
// refused as `?next=`, and the auth screen goes back there once there is a
// session. The value arrives from the URL, so it is untrusted: an absolute URL
// or a protocol-relative one (`//evil.example`) would make the login page an
// open redirect. Only a same-origin path is accepted; anything else falls back.

/** Where a fresh session lands when no `next` was asked for, or it was refused. */
export const DEFAULT_NEXT = '/dashboard'

/** The query key every gate writes and the auth screen reads. */
export const NEXT_PARAM = 'next'

/**
 * A same-origin path, or the default. Accepts a single string, the array form
 * Next.js hands over for a repeated query key (first value wins), or nothing.
 */
export function safeNext(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return DEFAULT_NEXT
  // A path, and only a path: one leading slash, then anything except a second
  // slash or a backslash, which browsers read as a scheme-relative URL.
  if (!/^\/(?![/\\])/.test(value)) return DEFAULT_NEXT
  // Bouncing back onto the auth screens would loop.
  if (/^\/(login|signup|forgot-password|reset-password)(\/|\?|#|$)/.test(value)) {
    return DEFAULT_NEXT
  }
  return value
}

/** `/login?next=…` for the page a gate just refused. */
export function loginUrl(next: string): string {
  return withNext('/login', next)
}

/** `/signup?next=…` for the page a gate just refused. */
export function signupUrl(next: string): string {
  return withNext('/signup', next)
}

/** `path?next=…`, omitting the parameter when it would only say the default. */
export function withNext(path: string, next: string): string {
  const safe = safeNext(next)
  if (safe === DEFAULT_NEXT) return path
  return `${path}?${NEXT_PARAM}=${encodeURIComponent(safe)}`
}
