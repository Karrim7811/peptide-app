// Order arithmetic.
//
// This is the ONLY place the catalogue is consulted for price. It happens once,
// when the order is created, and the result is snapshotted onto order_items.
// Nothing downstream re-derives it — a price change must never rewrite what a
// past customer was charged, and the schema carries a matching CHECK constraint
// because this is the arithmetic people dispute.

import { PRODUCTS } from '@/lib/shop/catalogue'

/**
 * Flat domestic shipping. PLACEHOLDER — Karim has not set the real figure, and
 * cold-chain packaging is not free. Confirm before launch.
 */
export const SHIPPING_CENTS = 1200

/**
 * At or above this subtotal, shipping is free. PLACEHOLDER, same caveat.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000

export interface PricedLine {
  productSlug: string
  productName: string
  sizeDisplay: string
  qty: number
  unitPriceCents: number
  lineCents: number
}

export interface OrderTotals {
  subtotalCents: number
  shippingCents: number
  totalCents: number
}

export function priceLine(slug: string, qty: number): PricedLine {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error(`quantity must be a positive whole number, got ${qty}`)
  }

  const product = PRODUCTS.find((candidate) => candidate.slug === slug && candidate.active)
  if (!product) throw new Error(`no active product: ${slug}`)

  return {
    productSlug: product.slug,
    productName: product.name,
    sizeDisplay: `${product.sizeValue} ${product.sizeUnit}`,
    qty,
    unitPriceCents: product.priceCents,
    lineCents: product.priceCents * qty,
  }
}

export function orderTotals(lines: PricedLine[]): OrderTotals {
  if (lines.length === 0) throw new Error('cannot total an empty order')

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0)
  // At the threshold, not past it — a customer who hits the number exactly
  // should not pay for shipping because of a comparison operator.
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS

  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}
