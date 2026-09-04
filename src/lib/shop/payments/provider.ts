// The payment provider interface.
//
// One shape, so losing a processor is a new adapter and a config change rather
// than a rewrite. Assume the rails will change at least once: this is a category
// where processors drop merchants, and the whole reason the shop is not on the
// subscription Stripe account is that losing one must not cost the other.
//
// The interesting field is confirmsAutomatically. BTCPay tells us when it has
// been paid; Zelle has no API and never will, so a human reconciles it against
// a bank statement. That single boolean is why the admin queue exists at all.

import type { Order, PaymentProviderId } from '@/lib/shop/orders/types'

/**
 * What an adapter actually needs to raise a charge. Narrower than Order on
 * purpose: createOrder calls this before the full row has been read back, and a
 * cast to satisfy a wider type would be a lie the compiler stopped checking.
 */
export type ChargeableOrder = Pick<Order, 'id' | 'totalCents' | 'paymentReference'>

export interface ChargeInstructions {
  heading: string
  /** Lines to render, in order. */
  body: string[]
  /** The code the buyer must include so the payment can be matched. */
  reference: string
}

export interface ChargeIntent {
  /** The provider's own id for this charge, where it has one. Zelle does not. */
  providerRef: string | null
  /** Send the buyer here — a hosted checkout. */
  redirectUrl?: string
  /** Or show them this, when payment happens somewhere we do not control. */
  instructions?: ChargeInstructions
}

export interface PaymentProvider {
  id: PaymentProviderId
  /**
   * False means no API will ever tell us this was paid, and a human must decide.
   * Everything downstream — the admin queue, the wording of the order status
   * page, whether a next-day promise is honest — follows from this.
   */
  confirmsAutomatically: boolean
  createCharge(order: ChargeableOrder): Promise<ChargeIntent>
}
