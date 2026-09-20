import type { Metadata } from 'next'
import { ShopChrome } from '@/components/shop/ShopChrome'
import { CheckoutClient } from '@/app/shop/checkout/CheckoutClient'
import { needsDateOfBirth } from '@/app/shop/dob-actions'
import { pickupLocation } from '@/lib/shop/pickup'

export const metadata: Metadata = { title: 'Checkout — Peptide Cortex' }

// Dynamic because the answer depends on who is signed in. Ten of the twelve
// accounts in production predate the date-of-birth field and would otherwise
// be refused at the age gate with no way to fix it.
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const needsDob = await needsDateOfBirth()
  // Server configuration, read here and handed down: SHOP_PICKUP_* is not
  // available to a client component, and an unconfigured deployment must not
  // offer a collection point it cannot name.
  const pickup = pickupLocation()

  return (
    <ShopChrome showCart={false}>
      <CheckoutClient needsDob={needsDob === true} pickup={pickup} />
    </ShopChrome>
  )
}
