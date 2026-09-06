'use client'

// The cart count in the header. Client-only because the cart lives in
// localStorage — it renders nothing on the server and appears after hydration,
// which is correct: a server-rendered count would always be wrong.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cart } from '@/lib/shop/cart'
import { KICKER, MONO } from '@/components/shop/ShopChrome'

export function CartCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const read = () => setCount(cart.count())
    read()
    // 'pc-cart' fires on our own writes; 'storage' catches another tab.
    window.addEventListener('pc-cart', read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('pc-cart', read)
      window.removeEventListener('storage', read)
    }
  }, [])

  if (count === null) return null

  return (
    <Link
      href="/shop/cart"
      style={{ ...KICKER, fontFamily: MONO, letterSpacing: '.1em', color: '#1A1D1F' }}
    >
      Cart ({count})
    </Link>
  )
}
