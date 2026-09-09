// Who the admin is, in one place.
//
// SHOP_ADMIN_USER_ID was compared three ways in three files with a bare `===`
// against the raw environment value. That comparison is unforgiving in a way
// the operator cannot see: a trailing space or a pair of quotes around the
// value in the Vercel dashboard produces a 404 identical to a wrong id, an
// unset variable and a signed-out request. Four causes, one blank page.
//
// So: normalise the value before comparing (whitespace and wrapping quotes are
// never part of a UUID and are always a paste artefact), and name the reason a
// request was refused so the server log can carry it. The refusal itself is
// unchanged — the route still 404s and tells the visitor nothing.

/** The configured admin id, with paste artefacts removed. Null when unusable. */
export function adminUserId(): string | null {
  const raw = process.env.SHOP_ADMIN_USER_ID
  if (!raw) return null
  const cleaned = raw.trim().replace(/^["']|["']$/g, '').trim()
  return cleaned.length > 0 ? cleaned : null
}

export function isAdminUserId(id: string | null | undefined): boolean {
  const adminId = adminUserId()
  return adminId !== null && Boolean(id) && id === adminId
}

export type AdminRefusal = 'unset' | 'no-session' | 'mismatch'

/** Why this request is not the admin, or null if it is. */
export function adminRefusal(id: string | null | undefined): AdminRefusal | null {
  if (adminUserId() === null) return 'unset'
  if (!id) return 'no-session'
  return id === adminUserId() ? null : 'mismatch'
}

/**
 * A one-line diagnosis for the server log.
 *
 * Deliberately carries neither id — only their shapes, which is what separates
 * a mistyped variable from a genuinely different account. A Supabase user id is
 * a 36-character UUID, so a configured length that is not 36 is the answer on
 * its own.
 */
export function adminRefusalNote(refusal: AdminRefusal, id?: string | null): string {
  if (refusal === 'unset') return 'SHOP_ADMIN_USER_ID is unset or empty'
  if (refusal === 'no-session') return 'no signed-in user on this request'

  const configured = adminUserId() as string
  const session = id ?? ''
  const sameIgnoringCase = configured.toLowerCase() === session.toLowerCase()
  return [
    'signed in, but the id does not match SHOP_ADMIN_USER_ID',
    `configured length ${configured.length} (a user id is 36)`,
    `session id length ${session.length}`,
    sameIgnoringCase ? 'the two differ only in letter case' : 'they are different ids',
  ].join(' · ')
}
