import type { Metadata } from 'next'
import { ShopChrome } from '@/components/shop/ShopChrome'
import { CheckoutClient } from '@/app/shop/checkout/CheckoutClient'

export const metadata: Metadata = { title: 'Checkout — Peptide Cortex' }

export default function CheckoutPage() {
  return (
    <ShopChrome showCart={false}>
      <CheckoutClient />
    </ShopChrome>
  )
}
