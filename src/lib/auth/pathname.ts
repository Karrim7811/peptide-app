// The request path, as seen from a server layout.
//
// Layouts receive params but not the URL, and the shop's sign-in wall lives in
// a layout so that one gate covers the catalogue, every product, the cart, the
// checkout and the order pages. middleware.ts writes the path into this header
// on every page request; `currentPath()` reads it back. Kept out of
// middleware.ts so the layout does not import the geoblock.

import { headers } from 'next/headers'

export const PATHNAME_HEADER = 'x-cortex-pathname'

/** The path and query of the page being rendered, or `fallback` off-middleware. */
export function currentPath(fallback: string): string {
  return headers().get(PATHNAME_HEADER) || fallback
}
