// BTCPay Server, self-hosted.
//
// No underwriting, no chargebacks, and no third party that can deplatform the
// shop — which is the whole reason it is the primary rail. It creates an invoice
// and returns the hosted checkout URL; settlement arrives later as a signed
// webhook, verified in btcpay-signature.ts.
//
// Config is read per call rather than at module load so a missing variable
// surfaces as a failed checkout with a clear message, not as a server that
// refuses to boot.

import type {
  ChargeIntent,
  ChargeableOrder,
  PaymentProvider,
} from '@/lib/shop/payments/provider'

interface BtcPayConfig {
  url: string
  storeId: string
  apiKey: string
}

function config(): BtcPayConfig {
  const url = process.env.BTCPAY_URL?.trim().replace(/\/+$/, '')
  const storeId = process.env.BTCPAY_STORE_ID?.trim()
  const apiKey = process.env.BTCPAY_API_KEY?.trim()

  const missing = [
    !url && 'BTCPAY_URL',
    !storeId && 'BTCPAY_STORE_ID',
    !apiKey && 'BTCPAY_API_KEY',
  ].filter(Boolean)

  if (missing.length > 0) throw new Error(`not configured: ${missing.join(', ')}`)
  return { url: url!, storeId: storeId!, apiKey: apiKey! }
}

export const BTCPAY: PaymentProvider = {
  id: 'btcpay',
  confirmsAutomatically: true,

  async createCharge(order: ChargeableOrder): Promise<ChargeIntent> {
    const { url, storeId, apiKey } = config()

    const response = await fetch(`${url}/api/v1/stores/${storeId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${apiKey}`,
      },
      body: JSON.stringify({
        amount: (order.totalCents / 100).toFixed(2),
        currency: 'USD',
        // orderId is what the webhook uses to find the row again. Without it a
        // settled invoice cannot be matched to anything.
        metadata: { orderId: order.id, reference: order.paymentReference },
        checkout: {
          redirectURL: `https://peptidecortex.com/shop/orders/${order.id}`,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`btcpay invoice failed: ${response.status} ${await response.text()}`)
    }

    const invoice = (await response.json()) as { id?: string; checkoutLink?: string }
    if (!invoice.id || !invoice.checkoutLink) {
      throw new Error('btcpay returned an invoice with no id or checkout link')
    }

    return { providerRef: invoice.id, redirectUrl: invoice.checkoutLink }
  },
}
