// The catalogue.
//
// Rebuilt from Shop.dc.html. Cards, not a table: a table's main gesture is
// reading down a column and comparing rows, and cross-compound comparison is
// the one thing the unit price must not invite.
//
// The grid draws its structure with a 1px ink background showing through a
// 1px gap between cards — no borders on the cards themselves. That is the
// design's whole structural idiom and it is why nothing here has a radius.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ShopCard } from '@/components/shop/ShopCard'
import { shopCards } from '@/lib/shop/view'

export const metadata: Metadata = {
  title: 'Shop — Peptide Cortex',
  description:
    'Small-batch research peptides. Every batch shows its independent assay, its lot and its price per milligram.',
}

const LEGAL =
  'For research and reference purposes only. Not intended as dosing instructions for human or animal use, and not for human consumption. Consult a licensed physician before any medical decisions. Adults 18+. US shipping only.'

export default function ShopPage() {
  const cards = shopCards()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        color: '#1A1D1F',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 400,
      }}
    >
      <header style={{ borderBottom: '1px solid #1A1D1F', flex: 'none' }}>
        <div
          style={{
            padding: '14px clamp(16px,3vw,32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(14px,2vw,28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              whiteSpace: 'nowrap',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#1A8A9E',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.22em' }}>
              PEPTIDE CORTEX
            </span>
          </Link>
          <span style={{ marginLeft: 'auto' }} />
          <Link
            href="/shop"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 10.5,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: '#1A1D1F',
              textDecoration: 'none',
              borderBottom: '1px solid #1A1D1F',
              paddingBottom: 2,
            }}
          >
            Shop
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
      </main>

      <footer style={{ background: '#1A1D1F', color: '#C9CED2', flex: 'none' }}>
        <div
          style={{
            padding: '18px clamp(16px,3vw,32px)',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            fontFamily: 'Jost, sans-serif',
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ maxWidth: '68ch', lineHeight: 1.8 }}>{LEGAL}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <Link href="/terms" style={{ color: 'inherit' }}>
              Terms
            </Link>
            <Link href="/privacy" style={{ color: 'inherit' }}>
              Privacy
            </Link>
            <Link href="/refund-policy" style={{ color: 'inherit' }}>
              Refunds
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
