// The site's one primary menu: Bench · Library · Shop.
//
// Before this there were four chromes and each drew its own menu. The library
// header said "The library" and underlined Library on the bench, the checker
// and bloodwork; the shop had no way back to either; the legacy dark sidebar
// linked to four /dashboard?… URLs the bench ignores. Every chrome now asks
// this file which section a path belongs to, so the answer cannot drift.
//
// The bench is the signed-in workspace — the bench itself, the Mirror behind
// it and the tools it opens. The library is everything readable signed out.
// The shop is commerce. Anything else (home, legal pages, auth) is no section.

export type Section = 'bench' | 'library' | 'shop'

const BENCH = [
  '/dashboard',
  '/mirror',
  '/checker',
  '/bloodwork',
  '/protocol',
  '/scanner',
  '/scan',
  '/ai-chat',
  '/stack-finder',
  '/welcome',
]
const LIBRARY = ['/reference', '/dosing', '/guides', '/stacks', '/vendors', '/regulatory']
const SHOP = ['/shop']

function under(pathname: string, roots: readonly string[]): boolean {
  return roots.some((root) => pathname === root || pathname.startsWith(root + '/'))
}

/** Which primary section a path belongs to, or null for home, legal and auth. */
export function sectionFor(pathname: string | null | undefined): Section | null {
  if (!pathname) return null
  const path = pathname.split(/[?#]/)[0]
  if (under(path, SHOP)) return 'shop'
  if (under(path, BENCH)) return 'bench'
  if (under(path, LIBRARY)) return 'library'
  return null
}

/** The small label beside the wordmark. */
export const SECTION_LABEL: Record<Section, string> = {
  bench: 'The bench',
  library: 'The library',
  shop: 'The shop',
}

export interface NavItem {
  section: Section
  label: string
  href: string
}

/**
 * The three primary links, in order. Bench is always /dashboard: its own gate
 * sends a signed-out visitor to sign-in and back, and a static page (Home)
 * that cannot see the session still takes a signed-in visitor straight there.
 */
export function primaryNav(): NavItem[] {
  return [
    { section: 'bench', label: 'Bench', href: '/dashboard' },
    { section: 'library', label: 'Library', href: '/reference' },
    { section: 'shop', label: 'Shop', href: '/shop' },
  ]
}
