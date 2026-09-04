// Zelle.
//
// No merchant API, no webhook, no confirmation of any kind. The order parks in
// awaiting_payment until Karim matches the memo reference against the bank and
// marks it paid in the admin queue. Everything this adapter returns is text a
// person reads and retypes, so clarity matters more than structure.
//
// SHOP_ZELLE_HANDLE must be an account under the shop entity. Not a personal
// account — a personal Zelle taking commercial volume gets flagged and the bank
// closes it — and never the account that receives subscription revenue.

import { formatPrice } from '@/lib/shop/pricing'
import type { Order } from '@/lib/shop/orders/types'
import type { ChargeIntent, PaymentProvider } from '@/lib/shop/payments/provider'

export const ZELLE: PaymentProvider = {
  id: 'zelle',

  // The load-bearing false. Nothing ships on this rail without a human.
  confirmsAutomatically: false,

  async createCharge(order: Order): Promise<ChargeIntent> {
    const handle = process.env.SHOP_ZELLE_HANDLE?.trim()
    if (!handle) {
      // Telling a customer to send money nowhere is worse than failing checkout.
      throw new Error('SHOP_ZELLE_HANDLE is not set')
    }

    return {
      providerRef: null,
      instructions: {
        heading: 'Send by Zelle',
        reference: order.paymentReference,
        body: [
          `Send exactly ${formatPrice(order.totalCents)} to ${handle}.`,
          `Put ${order.paymentReference} in the memo. Without it we cannot match your payment to this order.`,
          // Honest about the rail: transit time starts at handover, and handover
          // cannot happen until this is confirmed by hand.
          'We confirm Zelle payments by hand, usually within one business day. Delivery estimates start once your payment is confirmed, not at checkout.',
        ],
      },
    }
  },
}
