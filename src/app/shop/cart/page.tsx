import type { Metadata } from 'next'
import { ShopChrome } from '@/components/shop/ShopChrome'
import { CartClient } from '@/app/shop/cart/CartClient'

export const metadata: Metadata = { title: 'Cart — Peptide Cortex' }

export default function CartPage() {
  return (
    <ShopChrome>
      <CartClient />
    </ShopChrome>
  )
}
