'use client'

// Add to cart. Client-only; the cart is localStorage.
//
// Confirms in place rather than navigating away — someone comparing two
// products should not be thrown to the cart on every click.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cart } from '@/lib/shop/cart'
import { RULE } from '@/components/shop/ShopChrome'

/**
 * `buyNow` is the catalogue card's button: add and go straight to the cart,
 * because from the grid a click means "I want this one".
 */
export function AddToCart({ slug, buyNow = false }: { slug: string; buyNow?: boolean }) {
  const [added, setAdded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2400)
    return () => clearTimeout(t)
  }, [added])

  return (
    <button
      type="button"
      onClick={() => {
        cart.add(slug)
        if (buyNow) router.push('/shop/cart')
        else setAdded(true)
      }}
      style={{
        appearance: 'none',
        border: RULE,
        background: added ? 'transparent' : '#1A1D1F',
        color: added ? '#1A1D1F' : '#F4F5F6',
        fontFamily: 'Jost, sans-serif',
        fontSize: 11,
        letterSpacing: '.24em',
        textTransform: 'uppercase',
        padding: '14px 22px',
        minHeight: 44,
        width: '100%',
        cursor: 'pointer',
        marginTop: 18,
      }}
    >
      {buyNow ? 'Buy' : added ? 'Added to cart' : 'Add to cart'}
    </button>
  )
}
