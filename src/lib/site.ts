// The site's own absolute origin.
//
// Almost everything in this app builds relative URLs, which is right: they work
// on localhost, on a preview deployment and in production without knowing which
// one they are. Email is the exception — a link in a message has no page to
// resolve against, so it has to be absolute and it has to be correct.
//
// NEXT_PUBLIC_SITE_ORIGIN is the override, for preview deployments where a link
// pointing at production would send a tester to the wrong place. Unset, this is
// the canonical domain, which is the right answer in production and the only
// safe answer anywhere else — a receipt linking to peptidecortex.com is at
// worst unhelpful to a developer, whereas one linking to a preview URL is
// broken for a customer the moment that deployment is torn down.
//
// CLAUDE.md §16.1: peptidecortex.com is the only canonical domain.

export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim().replace(/\/+$/, '') || 'https://peptidecortex.com'
