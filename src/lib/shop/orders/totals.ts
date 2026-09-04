// Order arithmetic.
//
// This is the ONLY place the catalogue is consulted for price. It happens once,
// when the order is created, and the result is snapshotted onto order_items.
// Nothing downstream re-derives it — a price change must never rewrite what a
// past customer was charged, and the schema carries a matching CHECK constraint
// because this is the arithmetic people dispute.
//
// Shipping is a method the customer chooses, not a constant. See shipping.ts.
// There is no free-shipping threshold: the one that used to live here was
// invented, and it has been removed rather than replaced with another guess.

import { PRODUCTS } from '@/lib/shop/catalogue'
import { shippingMethod } from '@/lib/shop/orders/shipping'
import type { ShippingMethodId } from '@/lib/shop/orders/shipping'

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
  shippingMethodId: ShippingMethodId
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

/**
 * Totals an order for a chosen shipping method.
 *
 * Throws while that method has no price. Refusing is the right failure: the
 * alternative is charging a number nobody chose, and defaulting to zero would
 * ship free postage on every order until someone noticed the bank balance.
 */
export function orderTotals(lines: PricedLine[], methodId: ShippingMethodId): OrderTotals {
  if (lines.length === 0) throw new Error('cannot total an empty order')

  const method = shippingMethod(methodId)
  if (method.priceCents === null) {
    throw new Error(`shipping method '${methodId}' has no price set`)
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0)
  return {
    subtotalCents,
    shippingCents: method.priceCents,
    totalCents: subtotalCents + method.priceCents,
    shippingMethodId: methodId,
  }
}
