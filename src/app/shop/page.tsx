// The catalogue.
//
// Rebuilt from Shop.dc.html. Cards, not a table: a table's main gesture is
// reading down a column and comparing rows, and cross-compound comparison is
// the one thing the unit price must not invite.
//
// The grid draws its structure with a 1px ink background showing through a
// 1px gap between cards — no borders on the cards themselves. That is the
// design's whole structural idiom and it is why nothing here has a radius.
//
// Chrome comes from ShopChrome. This page and the product page used to draw
// their own header and footer, byte-for-byte the same as ShopChrome's except
// for the one element that mattered: the cart link. So a shopper could add to
// cart on either of the only two pages that offer the button and then have no
// way to reach the cart. Duplicated chrome is how that happens; there is now
// one header.

import type { Metadata } from 'next'
import { ShopCard } from '@/components/shop/ShopCard'
import { LEGAL, ShopChrome } from '@/components/shop/ShopChrome'
import { shopCards } from '@/lib/shop/view'

export const metadata: Metadata = {
  title: 'Shop — Peptide Cortex',
  description:
    'Small-batch research peptides. Every batch shows its independent assay, its lot and its price per milligram.',
}

export default function ShopPage() {
  const cards = shopCards()

  return (
    <ShopChrome>
      <>
        <div
          style={{
            padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px) 0',
            display: 'flex',
            gap: 18,
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontWeight: 300,
              fontSize: 'clamp(34px,4vw,46px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              margin: 0,
            }}
          >
            The shop
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontStyle: 'italic',
              color: '#3B4045',
              maxWidth: '52ch',
              lineHeight: 1.35,
            }}
          >
            Seven products, deliberately. Small conservative batches, each with its
            independent assay and its price per milligram beside it.
          </p>
        </div>

        <div
          style={{
            margin: 'clamp(24px,3vw,36px) clamp(16px,3vw,32px) 0',
            // Flex-wrap, not grid. Seven cards never divide evenly into a
            // responsive column count, and grid cannot fill a short last row —
            // the ink ground shows through the empty cells as a black slab that
            // reads as a missing product. Flex stretches the last row instead,
            // so the count can be any number and the block always closes.
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            background: '#1A1D1F',
            border: '1px solid #1A1D1F',
          }}
        >
          {cards.map((card) => (
            <ShopCard key={card.slug} card={card} />
          ))}
        </div>

        <p
          style={{
            margin: 'clamp(24px,3vw,36px) clamp(16px,3vw,32px) clamp(32px,4vw,56px)',
            maxWidth: '76ch',
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            lineHeight: 1.7,
            color: '#3B4045',
          }}
        >
          {LEGAL}
        </p>
      </>
    </ShopChrome>
  )
}
