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
//
// The instructions name the REGISTERED OWNER as well as the address, because
// the storefront and the bank account are not the same name: the shop is
// Peptide Cortex, the account is Tigris Tech Labs LLC. The buyer's banking app
// shows them that name at the moment they decide whether to send, so we say it
// first. See src/lib/shop/zelle-account.ts.

import { formatPrice } from '@/lib/shop/pricing'
import { zelleAccount } from '@/lib/shop/zelle-account'
import type {
  ChargeIntent,
  ChargeableOrder,
  PaymentProvider,
} from '@/lib/shop/payments/provider'

export const ZELLE: PaymentProvider = {
  id: 'zelle',

  // The load-bearing false. Nothing ships on this rail without a human.
  confirmsAutomatically: false,

  async createCharge(order: ChargeableOrder): Promise<ChargeIntent> {
    const account = zelleAccount()
    if (!account) {
      // Telling a customer to send money nowhere is worse than failing checkout.
      throw new Error('SHOP_ZELLE_HANDLE is not set')
    }
    const { handle } = account

    return {
      providerRef: null,
      instructions: {
        heading: 'Send by Zelle',
        reference: order.paymentReference,
        body: [
          `Send exactly ${formatPrice(order.totalCents)} to ${handle}.`,
          ...(account.name
            ? [
                `Your banking app will show this account as ${account.name} — the company behind Peptide Cortex. That is the right account.`,
              ]
            : []),
          `Put ${order.paymentReference} in the memo. Without it we cannot match your payment to this order.`,
          // Honest about the rail: transit time starts at handover, and handover
          // cannot happen until this is confirmed by hand.
          'We confirm Zelle payments by hand, usually within one business day. Delivery estimates start once your payment is confirmed, not at checkout.',
        ],
      },
    }
  },
}
