// The cart.
//
// Lives in localStorage, not in a database. A cart is not an order — it has no
// legal weight, no price guarantee and nothing to reconcile. Prices are read
// fresh from the catalogue on every render, so a cart left open for a week
// shows today's price rather than a stale one, and the only price that is ever
// snapshotted is the one written onto the order at checkout.
//
// Client-only. Nothing here runs on the server.

import { PRODUCTS } from '@/lib/shop/catalogue'
import { formatPrice } from '@/lib/shop/pricing'

const KEY = 'pc.cart.v1'
/** One vial is a considered purchase; a typo should not order eleven. */
export const MAX_QTY = 10

export interface CartEntry {
  slug: string
  qty: number
}

export interface CartLineView {
  slug: string
  name: string
  subtitle: string
  size: string
  qty: number
  unitPrice: string
  linePrice: string
  lineCents: number
}

function read(): CartEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Anything unrecognisable is dropped rather than trusted. localStorage is
    // user-writable, and a bad slug reaching priceLine() throws at checkout.
    return parsed
      .filter(
        (e): e is CartEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as CartEntry).slug === 'string' &&
          Number.isInteger((e as CartEntry).qty),
      )
      .filter((e) => PRODUCTS.some((p) => p.slug === e.slug && p.active))
      .map((e) => ({ slug: e.slug, qty: Math.min(Math.max(1, e.qty), MAX_QTY) }))
  } catch {
    return []
  }
}

function write(entries: CartEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
    window.dispatchEvent(new Event('pc-cart'))
  } catch {
    // Private browsing, quota, blocked storage. A cart that cannot persist is
    // still a usable cart for this page view; failing loudly helps nobody.
  }
}

export const cart = {
  entries: read,

  add(slug: string, qty = 1) {
    const entries = read()
    const found = entries.find((e) => e.slug === slug)
    if (found) found.qty = Math.min(found.qty + qty, MAX_QTY)
    else entries.push({ slug, qty: Math.min(Math.max(1, qty), MAX_QTY) })
    write(entries)
  },

  setQty(slug: string, qty: number) {
    if (qty < 1) return cart.remove(slug)
    write(read().map((e) => (e.slug === slug ? { ...e, qty: Math.min(qty, MAX_QTY) } : e)))
  },

  remove(slug: string) {
    write(read().filter((e) => e.slug !== slug))
  },

  clear() {
    write([])
  },

  count(): number {
    return read().reduce((n, e) => n + e.qty, 0)
  },
}

/**
 * The cart with today's prices attached. Recomputed on every call rather than
 * stored — see the note at the top about why a cart holds no prices.
 */
export function cartLines(entries: CartEntry[] = read()): CartLineView[] {
  return entries.flatMap((entry) => {
    const product = PRODUCTS.find((p) => p.slug === entry.slug && p.active)
    if (!product) return []
    return [
      {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        size: `${product.sizeValue} ${product.sizeUnit}`,
        qty: entry.qty,
        unitPrice: formatPrice(product.priceCents),
        linePrice: formatPrice(product.priceCents * entry.qty),
        lineCents: product.priceCents * entry.qty,
      },
    ]
  })
}

export function subtotalCents(lines: CartLineView[]): number {
  return lines.reduce((sum, l) => sum + l.lineCents, 0)
}
