# Shop — Checkout & Fulfilment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take money for the seven SKUs and get orders out of the door — orders,
two payment rails behind one interface, and the admin queue Karim works from.

**Architecture:** Orders live in Postgres with RLS. Payment providers sit behind
a single interface so losing one is an adapter swap, not a rewrite. BTCPay
confirms itself by signed webhook; Zelle has no API and is confirmed by hand,
which is why the admin queue is required scope rather than a convenience.

**Tech Stack:** Next.js 14 App Router server actions · TypeScript 5 · Supabase
Postgres + RLS · BTCPay Server (self-hosted) · vitest 4 (`environment: 'node'`)

**Spec:** `docs/superpowers/specs/2026-09-04-peptide-shop-design.md` §7–§8
**Predecessor:** `docs/superpowers/plans/2026-09-04-shop-catalogue-and-storefront.md` (complete)

## Blocked until these exist

**Do not start Task 5 or 6 without them.** Tasks 1–4 and 7 can proceed now.

- The shop's **legal entity** and its **business bank account** — Zelle under a
  personal account gets flagged, and it must never be the account receiving
  Stripe subscription revenue.
- A running **BTCPay Server** instance with a store and a webhook secret.
- **Refund policy text**, signed off by Karim. Touches ToS, so it is his call.

## Global Constraints

- **Never touch the subscription Stripe account, its keys, or its bank account.**
  Discovery of peptide sales on that account risks termination, a 90–180 day
  reserve and MATCH-listing, which takes the subscription business with it. No
  file under `src/app/api/stripe/` or `src/lib/stripe.ts` is modified by this plan.
- **`order_items.unit_price_cents` is a snapshot.** Prices change; orders do not.
  Never join to `shop_products` to display a historical order's price.
- **`order_items.lot_id` is assigned at PACK time, not order time.** It records
  the vial that physically left the shelf. That is the recall path.
- **The BTCPay webhook verifies its HMAC signature before reading the body.** An
  unverified webhook is a public endpoint for marking your own orders paid.
- **Webhook handling is idempotent.** BTCPay retries; a replayed event must not
  advance an order twice.
- **No customer-facing checkout UI in this plan.** Cart, checkout and order-status
  pages are Claude Design's, built against the contract in Task 8. The admin queue
  IS built here — it is an internal tool, not storefront.
- Purchase requires an account and `profiles.dob` proving 18+.
- Tests run in `environment: 'node'` with no database. Pure logic only.
- Commit style: `feat(shop):` / `fix(shop):`.

---

### Task 1: Orders schema

**Files:**
- Create: `supabase/shop_orders_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Shop orders — 2026-09-04
--
-- Money and fulfilment. The catalogue lives in shop_schema.sql.
--
-- Two columns carry more weight than they look like they do:
--
--   order_items.unit_price_cents is a SNAPSHOT taken when the order was placed.
--   Never render a historical order by joining to shop_products — a price change
--   would silently rewrite what a customer was charged.
--
--   order_items.lot_id is filled in at PACK time, not order time, because it
--   records the vial that physically left the shelf. It is the recall path: the
--   difference between notifying eleven customers and emailing the whole list.

create type shop_order_status as enum (
  'awaiting_payment', 'paid', 'packed', 'shipped', 'delivered',
  'expired', 'refunded', 'cancelled'
);

create table if not exists public.shop_orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete restrict,
  status             shop_order_status not null default 'awaiting_payment',

  subtotal_cents     integer not null check (subtotal_cents >= 0),
  shipping_cents     integer not null default 0 check (shipping_cents >= 0),
  total_cents        integer not null check (total_cents >= 0),

  payment_provider   text not null check (payment_provider in ('btcpay', 'zelle')),
  -- The provider's own id for the charge. Null for Zelle, which has none.
  provider_ref       text,
  -- Short, human-typable, goes in the Zelle memo. Unique because Karim matches
  -- incoming payments against it by eye.
  payment_reference  text not null unique,

  ship_name          text not null,
  ship_line1         text not null,
  ship_line2         text,
  ship_city          text not null,
  ship_state         text not null,
  ship_postal        text not null,
  -- US only at launch, consistent with the existing EU geoblock.
  ship_country       text not null default 'US' check (ship_country = 'US'),

  created_at         timestamptz not null default now(),
  paid_at            timestamptz,
  shipped_at         timestamptz,
  tracking           text,
  notes              text,

  constraint paid_orders_know_when check (status not in
    ('paid','packed','shipped','delivered') or paid_at is not null)
);

create index if not exists shop_orders_user_idx   on public.shop_orders(user_id);
create index if not exists shop_orders_status_idx on public.shop_orders(status);

create table if not exists public.shop_order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.shop_orders(id) on delete cascade,
  product_id        uuid not null references public.shop_products(id) on delete restrict,
  -- Null until packed. Then it is the lot that actually shipped.
  lot_id            uuid references public.shop_lots(id) on delete restrict,
  qty               integer not null check (qty > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  -- Denormalised so a historical order renders correctly even if the product is
  -- renamed or delisted.
  product_name      text not null,
  size_display      text not null
);

create index if not exists shop_order_items_order_idx on public.shop_order_items(order_id);
create index if not exists shop_order_items_lot_idx   on public.shop_order_items(lot_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- A customer reads their own orders and nothing else. Nobody writes through the
-- anon key at all: orders are created by a server action and advanced by the
-- webhook or the admin queue, both under the service role. There is no update
-- policy, so a customer cannot mark their own order paid.

alter table public.shop_orders      enable row level security;
alter table public.shop_order_items enable row level security;

drop policy if exists shop_orders_read_own on public.shop_orders;
create policy shop_orders_read_own on public.shop_orders
  for select using (auth.uid() = user_id);

drop policy if exists shop_order_items_read_own on public.shop_order_items;
create policy shop_order_items_read_own on public.shop_order_items
  for select using (
    exists (select 1 from public.shop_orders o
            where o.id = order_id and o.user_id = auth.uid())
  );
```

- [ ] **Step 2: Check it parses**

Run: `grep -c "create table" supabase/shop_orders_schema.sql`
Expected: `2`. Do not apply it — see "Blocked until these exist".

- [ ] **Step 3: Commit**

```bash
git add supabase/shop_orders_schema.sql
git commit -m "feat(shop): orders schema, with price snapshot and the recall path"
```

---

### Task 2: Order types and the status machine

**Files:**
- Create: `src/lib/shop/orders/types.ts`
- Create: `src/lib/shop/orders/status.ts`
- Create: `src/lib/shop/orders/status.test.ts`

**Interfaces:**
- Produces: `OrderStatus`, `Order`, `OrderItem`, `canTransition(from, to): boolean`,
  `TERMINAL: OrderStatus[]`, `nextStatuses(from): OrderStatus[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/orders/status.test.ts
import { describe, expect, it } from 'vitest'
import { TERMINAL, canTransition, nextStatuses } from '@/lib/shop/orders/status'

describe('order status machine', () => {
  it('walks the happy path', () => {
    expect(canTransition('awaiting_payment', 'paid')).toBe(true)
    expect(canTransition('paid', 'packed')).toBe(true)
    expect(canTransition('packed', 'shipped')).toBe(true)
    expect(canTransition('shipped', 'delivered')).toBe(true)
  })

  // The one that matters: an unpaid order can never be packed or shipped.
  it('never lets an unpaid order be fulfilled', () => {
    expect(canTransition('awaiting_payment', 'packed')).toBe(false)
    expect(canTransition('awaiting_payment', 'shipped')).toBe(false)
    expect(canTransition('awaiting_payment', 'delivered')).toBe(false)
  })

  it('never goes backwards', () => {
    expect(canTransition('shipped', 'paid')).toBe(false)
    expect(canTransition('paid', 'awaiting_payment')).toBe(false)
  })

  it('expires only from awaiting_payment', () => {
    expect(canTransition('awaiting_payment', 'expired')).toBe(true)
    expect(canTransition('paid', 'expired')).toBe(false)
  })

  it('refunds only what was paid for', () => {
    expect(canTransition('paid', 'refunded')).toBe(true)
    expect(canTransition('shipped', 'refunded')).toBe(true)
    expect(canTransition('awaiting_payment', 'refunded')).toBe(false)
  })

  it('lets nothing leave a terminal state', () => {
    for (const status of TERMINAL) {
      expect(nextStatuses(status), status).toEqual([])
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/orders/status.test.ts`
Expected: FAIL — cannot resolve the module.

- [ ] **Step 3: Write the types**

```ts
// src/lib/shop/orders/types.ts
export type OrderStatus =
  | 'awaiting_payment' | 'paid' | 'packed' | 'shipped' | 'delivered'
  | 'expired' | 'refunded' | 'cancelled'

export type PaymentProviderId = 'btcpay' | 'zelle'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postal: string
  /** US only at launch. */
  country: 'US'
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  /** Null until packed. Then it is the vial that physically shipped. */
  lotId: string | null
  qty: number
  /** Snapshot taken at order time. Never re-derived from the catalogue. */
  unitPriceCents: number
  productName: string
  sizeDisplay: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotalCents: number
  shippingCents: number
  totalCents: number
  paymentProvider: PaymentProviderId
  providerRef: string | null
  /** Short human-typable code. Goes in the Zelle memo. */
  paymentReference: string
  ship: ShippingAddress
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  tracking: string | null
  items: OrderItem[]
}
```

- [ ] **Step 4: Write the status machine**

```ts
// src/lib/shop/orders/status.ts
//
// One place that knows which moves are legal. The admin queue, the webhook and
// the expiry job all go through it, so "an unpaid order got shipped" has one
// place to be prevented rather than three places to be forgotten.

import type { OrderStatus } from '@/lib/shop/orders/types'

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['paid', 'expired', 'cancelled'],
  paid: ['packed', 'refunded', 'cancelled'],
  packed: ['shipped', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  expired: [],
  refunded: [],
  cancelled: [],
}

export const TERMINAL: OrderStatus[] = ['expired', 'refunded', 'cancelled']

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? []
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to)
}
```

- [ ] **Step 5: Run and commit**

```bash
npm test -- src/lib/shop/orders/status.test.ts
git add src/lib/shop/orders/
git commit -m "feat(shop): order types and the status machine"
```

---

### Task 3: Payment reference codes

Karim matches incoming Zelle payments against these by eye, so they must be
short, unambiguous when handwritten, and unique.

**Files:**
- Create: `src/lib/shop/orders/reference.ts`
- Create: `src/lib/shop/orders/reference.test.ts`

**Interfaces:**
- Produces: `generateReference(): string`, `isValidReference(s): boolean`, `ALPHABET`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/orders/reference.test.ts
import { describe, expect, it } from 'vitest'
import { ALPHABET, generateReference, isValidReference } from '@/lib/shop/orders/reference'

describe('payment reference', () => {
  it('looks like PC-XXXX', () => {
    expect(generateReference()).toMatch(/^PC-[0-9A-Z]{4}$/)
  })

  // A customer retypes this into a bank memo field. Every character that can be
  // confused for another is a payment Karim cannot match.
  it('excludes every ambiguous character', () => {
    for (const c of 'OIL01') expect(ALPHABET, `${c} is ambiguous`).not.toContain(c)
  })

  it('accepts what it generates and rejects what it does not', () => {
    for (let i = 0; i < 200; i++) expect(isValidReference(generateReference())).toBe(true)
    expect(isValidReference('PC-OIL0')).toBe(false)
    expect(isValidReference('pc-2345')).toBe(false)
    expect(isValidReference('PC-234')).toBe(false)
    expect(isValidReference('2345')).toBe(false)
  })

  it('collides rarely enough to be worth retrying rather than sequencing', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 5000; i++) seen.add(generateReference())
    expect(seen.size).toBeGreaterThan(4900)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/orders/reference.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/shop/orders/reference.ts
//
// The code a customer types into a Zelle memo. Zelle has no API, so this string
// is the only link between a payment landing in the bank and an order in the
// database — a mistyped one is a support ticket, not an automatic anything.
//
// Crockford-style alphabet: no O/0, no I/1/L. Uppercase only, because banks
// upcase memo fields inconsistently.

import { randomInt } from 'node:crypto'

export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateReference(): string {
  let out = ''
  for (let i = 0; i < 4; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return `PC-${out}`
}

export function isValidReference(value: string): boolean {
  if (!/^PC-.{4}$/.test(value)) return false
  return [...value.slice(3)].every((c) => ALPHABET.includes(c))
}
```

> `31^4` is about 924,000 codes. Uniqueness is enforced by the column constraint;
> the insert retries on conflict. At launch volumes a collision is a curiosity,
> but the constraint is what makes it safe rather than the arithmetic.

- [ ] **Step 4: Run and commit**

```bash
npm test -- src/lib/shop/orders/reference.test.ts
git add src/lib/shop/orders/reference.ts src/lib/shop/orders/reference.test.ts
git commit -m "feat(shop): unambiguous payment reference codes"
```

---

### Task 4: Order totals

**Files:**
- Create: `src/lib/shop/orders/totals.ts`
- Create: `src/lib/shop/orders/totals.test.ts`

**Interfaces:**
- Consumes: `PRODUCTS` from `@/lib/shop/catalogue`
- Produces: `SHIPPING_CENTS`, `FREE_SHIPPING_THRESHOLD_CENTS`,
  `priceLine(slug, qty)`, `orderTotals(lines)`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/orders/totals.test.ts
import { describe, expect, it } from 'vitest'
import { orderTotals, priceLine } from '@/lib/shop/orders/totals'

describe('order totals', () => {
  it('prices a line from the catalogue at order time', () => {
    expect(priceLine('glp-3-30mg', 2)).toEqual({
      productSlug: 'glp-3-30mg',
      productName: 'GLP-3 (Retatrutide)',
      sizeDisplay: '30 mg',
      qty: 2,
      unitPriceCents: 12500,
      lineCents: 25000,
    })
  })

  it('refuses an unknown or inactive product', () => {
    expect(() => priceLine('not-a-product', 1)).toThrow()
  })

  it('refuses a non-positive quantity', () => {
    expect(() => priceLine('glp-3-30mg', 0)).toThrow()
    expect(() => priceLine('glp-3-30mg', -1)).toThrow()
  })

  it('sums lines and adds flat shipping', () => {
    const t = orderTotals([priceLine('mots-c-10mg', 1)])
    expect(t.subtotalCents).toBe(3000)
    expect(t.shippingCents).toBeGreaterThan(0)
    expect(t.totalCents).toBe(t.subtotalCents + t.shippingCents)
  })

  it('ships free above the threshold', () => {
    const t = orderTotals([priceLine('glp-3-30mg', 2)])
    expect(t.shippingCents).toBe(0)
    expect(t.totalCents).toBe(25000)
  })

  it('rejects an empty order', () => {
    expect(() => orderTotals([])).toThrow()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

- [ ] **Step 3: Implement**

```ts
// src/lib/shop/orders/totals.ts
//
// Prices are read from the catalogue HERE, once, when the order is created, and
// then snapshotted onto order_items. Nothing downstream re-derives them: a price
// change must never rewrite what a past customer was charged.

import { PRODUCTS } from '@/lib/shop/catalogue'

export const SHIPPING_CENTS = 1200
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000

export interface PricedLine {
  productSlug: string
  productName: string
  sizeDisplay: string
  qty: number
  unitPriceCents: number
  lineCents: number
}

export function priceLine(slug: string, qty: number): PricedLine {
  if (!Number.isInteger(qty) || qty < 1) throw new Error(`bad quantity: ${qty}`)
  const product = PRODUCTS.find((p) => p.slug === slug && p.active)
  if (!product) throw new Error(`no active product: ${slug}`)
  return {
    productSlug: product.slug,
    productName: product.name,
    sizeDisplay: `${product.sizeValue} ${product.sizeUnit}`,
    qty,
    unitPriceCents: product.priceCents,
    lineCents: product.priceCents * qty,
  }
}

export function orderTotals(lines: PricedLine[]) {
  if (lines.length === 0) throw new Error('empty order')
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0)
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS
  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}
```

- [ ] **Step 4: Run and commit**

```bash
npm test -- src/lib/shop/orders/totals.test.ts
git add src/lib/shop/orders/totals.ts src/lib/shop/orders/totals.test.ts
git commit -m "feat(shop): order totals with flat shipping"
```

> `SHIPPING_CENTS` and the free-shipping threshold are placeholders chosen so the
> tests assert something concrete. Confirm both with Karim before launch.

---

### Task 5: Payment provider interface, and the Zelle adapter

**Blocked** on the business bank account existing.

**Files:**
- Create: `src/lib/shop/payments/provider.ts`
- Create: `src/lib/shop/payments/zelle.ts`
- Create: `src/lib/shop/payments/zelle.test.ts`

**Interfaces:**
- Consumes: `Order` from `@/lib/shop/orders/types`
- Produces: `PaymentProvider`, `ChargeIntent`, `ZELLE`

- [ ] **Step 1: Write the interface**

```ts
// src/lib/shop/payments/provider.ts
//
// One interface, so losing a processor is a new adapter and a config change
// rather than a rewrite. Assume we will change rails at least once.

import type { Order, PaymentProviderId } from '@/lib/shop/orders/types'

export interface ChargeIntent {
  /** The provider's id for this charge, where it has one. Zelle does not. */
  providerRef: string | null
  /** Where to send the buyer, for a hosted checkout. */
  redirectUrl?: string
  /** What to show the buyer instead, when payment happens off-site. */
  instructions?: { heading: string; body: string[]; reference: string }
}

export interface PaymentProvider {
  id: PaymentProviderId
  /**
   * False means no API confirms payment and a human must. That single fact is
   * why the admin queue exists.
   */
  confirmsAutomatically: boolean
  createCharge(order: Order): Promise<ChargeIntent>
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/lib/shop/payments/zelle.test.ts
import { describe, expect, it } from 'vitest'
import { ZELLE } from '@/lib/shop/payments/zelle'
import type { Order } from '@/lib/shop/orders/types'

const order = { paymentReference: 'PC-4F2A', totalCents: 12500 } as Order

describe('zelle adapter', () => {
  it('confirms nothing automatically', () => {
    expect(ZELLE.confirmsAutomatically).toBe(false)
  })

  it('has no provider reference to return', async () => {
    expect((await ZELLE.createCharge(order)).providerRef).toBeNull()
  })

  it('puts the reference in front of the buyer', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.reference).toBe('PC-4F2A')
    expect(intent.instructions?.body.join(' ')).toContain('PC-4F2A')
  })

  it('states the exact amount, because a human matches it by eye', async () => {
    const intent = await ZELLE.createCharge(order)
    expect(intent.instructions?.body.join(' ')).toContain('$125.00')
  })

  it('refuses to render instructions without a configured handle', async () => {
    const saved = process.env.SHOP_ZELLE_HANDLE
    delete process.env.SHOP_ZELLE_HANDLE
    await expect(ZELLE.createCharge(order)).rejects.toThrow(/SHOP_ZELLE_HANDLE/)
    process.env.SHOP_ZELLE_HANDLE = saved
  })
})
```

- [ ] **Step 3: Implement**

```ts
// src/lib/shop/payments/zelle.ts
//
// Zelle has no merchant API, so nothing here confirms a payment. The order parks
// in awaiting_payment until Karim matches the memo reference against the bank
// and marks it paid in the admin queue.
//
// SHOP_ZELLE_HANDLE must be an account under the shop entity — never a personal
// one, and never the account that receives subscription revenue.

import { formatPrice } from '@/lib/shop/pricing'
import type { Order } from '@/lib/shop/orders/types'
import type { ChargeIntent, PaymentProvider } from '@/lib/shop/payments/provider'

export const ZELLE: PaymentProvider = {
  id: 'zelle',
  confirmsAutomatically: false,

  async createCharge(order: Order): Promise<ChargeIntent> {
    const handle = process.env.SHOP_ZELLE_HANDLE
    if (!handle) throw new Error('SHOP_ZELLE_HANDLE is not set')

    return {
      providerRef: null,
      instructions: {
        heading: 'Send by Zelle',
        reference: order.paymentReference,
        body: [
          `Send exactly ${formatPrice(order.totalCents)} to ${handle}.`,
          `Put ${order.paymentReference} in the memo. Without it we cannot match your payment.`,
          'Orders ship once payment is confirmed, usually within one business day.',
        ],
      },
    }
  },
}
```

- [ ] **Step 4: Run and commit**

```bash
npm test -- src/lib/shop/payments/zelle.test.ts
git add src/lib/shop/payments/
git commit -m "feat(shop): payment provider interface and the Zelle adapter"
```

---

### Task 6: BTCPay adapter and its webhook

**Blocked** on a running BTCPay instance. This is the security-critical task in
the plan — an unverified webhook is a public endpoint for marking orders paid.

**Files:**
- Create: `src/lib/shop/payments/btcpay.ts`
- Create: `src/lib/shop/payments/btcpay-signature.ts`
- Create: `src/lib/shop/payments/btcpay-signature.test.ts`
- Create: `src/app/api/shop/btcpay-webhook/route.ts`

**Interfaces:**
- Produces: `BTCPAY`, `verifySignature(rawBody, header, secret): boolean`

- [ ] **Step 1: Write the failing signature test**

```ts
// src/lib/shop/payments/btcpay-signature.test.ts
import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifySignature } from '@/lib/shop/payments/btcpay-signature'

const SECRET = 'test-secret'
const body = JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'abc' })
const sign = (b: string, s = SECRET) => `sha256=${createHmac('sha256', s).update(b).digest('hex')}`

describe('btcpay webhook signature', () => {
  it('accepts a correctly signed body', () => {
    expect(verifySignature(body, sign(body), SECRET)).toBe(true)
  })

  it('rejects a body that was altered after signing', () => {
    const tampered = JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'xyz' })
    expect(verifySignature(tampered, sign(body), SECRET)).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    expect(verifySignature(body, sign(body, 'wrong'), SECRET)).toBe(false)
  })

  it('rejects a missing or malformed header rather than throwing', () => {
    expect(verifySignature(body, null, SECRET)).toBe(false)
    expect(verifySignature(body, '', SECRET)).toBe(false)
    expect(verifySignature(body, 'garbage', SECRET)).toBe(false)
    expect(verifySignature(body, 'sha256=zz', SECRET)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

- [ ] **Step 3: Implement verification**

```ts
// src/lib/shop/payments/btcpay-signature.ts
//
// BTCPay signs each webhook with HMAC-SHA256 over the RAW body. Verify before
// parsing — an unverified webhook endpoint is a public API for marking your own
// orders paid.
//
// timingSafeEqual, not ===, so a wrong signature cannot be recovered one byte at
// a time from response timing.

import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false
  const [algorithm, provided] = header.split('=')
  if (algorithm !== 'sha256' || !provided) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  if (provided.length !== expected.length) return false

  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Write the adapter**

```ts
// src/lib/shop/payments/btcpay.ts
//
// Self-hosted BTCPay: no underwriting, no chargebacks, and no third party that
// can deplatform the shop. It creates an invoice and returns its hosted checkout
// URL; settlement arrives later by signed webhook.

import type { Order } from '@/lib/shop/orders/types'
import type { ChargeIntent, PaymentProvider } from '@/lib/shop/payments/provider'

function config() {
  const url = process.env.BTCPAY_URL
  const storeId = process.env.BTCPAY_STORE_ID
  const apiKey = process.env.BTCPAY_API_KEY
  if (!url || !storeId || !apiKey) {
    throw new Error('BTCPAY_URL, BTCPAY_STORE_ID and BTCPAY_API_KEY must all be set')
  }
  return { url, storeId, apiKey }
}

export const BTCPAY: PaymentProvider = {
  id: 'btcpay',
  confirmsAutomatically: true,

  async createCharge(order: Order): Promise<ChargeIntent> {
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
        metadata: { orderId: order.id, reference: order.paymentReference },
        checkout: { redirectURL: `https://peptidecortex.com/shop/orders/${order.id}` },
      }),
    })

    if (!response.ok) {
      throw new Error(`btcpay invoice failed: ${response.status} ${await response.text()}`)
    }

    const invoice = (await response.json()) as { id: string; checkoutLink: string }
    return { providerRef: invoice.id, redirectUrl: invoice.checkoutLink }
  },
}
```

- [ ] **Step 5: Write the webhook route**

```ts
// src/app/api/shop/btcpay-webhook/route.ts
//
// Verify, then read. Never the other way round.
//
// Idempotent by construction: the update is conditional on the order still being
// in awaiting_payment, so BTCPay's retries are no-ops rather than double
// advances. The status machine is not consulted here because the SQL predicate
// already encodes the only legal transition this route can make.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifySignature } from '@/lib/shop/payments/btcpay-signature'

export async function POST(request: Request) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[btcpay] BTCPAY_WEBHOOK_SECRET is not set; refusing the request')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get('BTCPay-Sig'), secret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 })
  }

  const event = JSON.parse(raw) as {
    type: string
    invoiceId?: string
    metadata?: { orderId?: string }
  }

  // Settled, not merely paid: 'InvoiceProcessing' fires before confirmation.
  if (event.type !== 'InvoiceSettled') return NextResponse.json({ ok: true })

  const orderId = event.metadata?.orderId
  if (!orderId) {
    console.error('[btcpay] settled invoice carried no orderId', event.invoiceId)
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('shop_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'awaiting_payment')
    .select('id')

  if (error) {
    console.error('[btcpay] failed to mark paid', orderId, error.message)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
  if (data.length === 0) {
    // Already advanced. A retry, not a problem.
    console.warn('[btcpay] order was not awaiting payment', orderId)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Run and commit**

```bash
npm test -- src/lib/shop/payments/btcpay-signature.test.ts
npx tsc --noEmit
git add src/lib/shop/payments/ "src/app/api/shop/btcpay-webhook/route.ts"
git commit -m "feat(shop): BTCPay adapter and a signature-verified webhook"
```

---

### Task 7: The admin queue

Internal tool, so it IS built here — Claude Design owns the storefront, not the
back office. Zelle cannot be reconciled automatically, so nothing ships without
Karim clicking something.

**Files:**
- Create: `src/lib/shop/orders/admin.ts`
- Create: `src/lib/shop/orders/admin.test.ts`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/orders/actions.ts`

**Interfaces:**
- Consumes: `canTransition` from `@/lib/shop/orders/status`
- Produces: `assertAdmin()`, `markPaid()`, `markPacked(orderId, lotByItem)`,
  `markShipped(orderId, tracking)`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/orders/admin.test.ts
import { describe, expect, it } from 'vitest'
import { validatePackAssignment } from '@/lib/shop/orders/admin'

describe('packing an order', () => {
  const items = [
    { id: 'i1', productId: 'p1', qty: 1 },
    { id: 'i2', productId: 'p2', qty: 1 },
  ]

  it('accepts a lot for every item', () => {
    expect(() => validatePackAssignment(items, { i1: 'lot-a', i2: 'lot-b' })).not.toThrow()
  })

  // The whole point of packing is recording which vial left the shelf. An item
  // without a lot is an order with no recall path, silently.
  it('refuses to pack an item with no lot assigned', () => {
    expect(() => validatePackAssignment(items, { i1: 'lot-a' })).toThrow(/i2/)
  })

  it('refuses a lot for an item that is not on the order', () => {
    expect(() =>
      validatePackAssignment(items, { i1: 'lot-a', i2: 'lot-b', i3: 'lot-c' }),
    ).toThrow(/i3/)
  })

  it('refuses an empty assignment', () => {
    expect(() => validatePackAssignment(items, {})).toThrow()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

- [ ] **Step 3: Implement the guard**

```ts
// src/lib/shop/orders/admin.ts
//
// Packing is the only moment the physical vial and the database touch. If an
// item can be packed without a lot, order_items.lot_id is decorative and the
// recall path does not exist.

export interface PackableItem {
  id: string
  productId: string
  qty: number
}

export function validatePackAssignment(
  items: PackableItem[],
  lotByItem: Record<string, string>,
): void {
  const assigned = Object.keys(lotByItem)
  if (assigned.length === 0) throw new Error('no lots assigned')

  const missing = items.filter((item) => !lotByItem[item.id]).map((item) => item.id)
  if (missing.length > 0) throw new Error(`no lot assigned for item(s): ${missing.join(', ')}`)

  const ids = new Set(items.map((item) => item.id))
  const unknown = assigned.filter((id) => !ids.has(id))
  if (unknown.length > 0) throw new Error(`item(s) not on this order: ${unknown.join(', ')}`)
}
```

- [ ] **Step 4: Write the server actions**

```ts
// src/app/admin/orders/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { canTransition } from '@/lib/shop/orders/status'
import { validatePackAssignment } from '@/lib/shop/orders/admin'
import type { OrderStatus } from '@/lib/shop/orders/types'

async function assertAdmin() {
  const user = await getAuthenticatedUser()
  const adminId = process.env.SHOP_ADMIN_USER_ID
  if (!adminId) throw new Error('SHOP_ADMIN_USER_ID is not set')
  if (!user || user.id !== adminId) throw new Error('not authorised')
  return user
}

async function advance(orderId: string, to: OrderStatus, patch: Record<string, unknown> = {}) {
  await assertAdmin()
  const supabase = createServiceClient()

  const { data: order, error } = await supabase
    .from('shop_orders').select('status').eq('id', orderId).single()
  if (error || !order) throw new Error('order not found')

  if (!canTransition(order.status as OrderStatus, to)) {
    throw new Error(`cannot go from ${order.status} to ${to}`)
  }

  const { error: updateError } = await supabase
    .from('shop_orders')
    .update({ status: to, ...patch })
    .eq('id', orderId)
    .eq('status', order.status)   // lost-update guard
  if (updateError) throw new Error(updateError.message)

  revalidatePath('/admin/orders')
}

/** Zelle only. Karim has matched the memo reference against the bank. */
export async function markPaid(orderId: string) {
  await advance(orderId, 'paid', { paid_at: new Date().toISOString() })
}

export async function markPacked(orderId: string, lotByItem: Record<string, string>) {
  await assertAdmin()
  const supabase = createServiceClient()

  const { data: items, error } = await supabase
    .from('shop_order_items').select('id, product_id, qty').eq('order_id', orderId)
  if (error || !items) throw new Error('could not load order items')

  validatePackAssignment(
    items.map((i) => ({ id: i.id, productId: i.product_id, qty: i.qty })),
    lotByItem,
  )

  for (const [itemId, lotId] of Object.entries(lotByItem)) {
    const { error: itemError } = await supabase
      .from('shop_order_items').update({ lot_id: lotId }).eq('id', itemId)
    if (itemError) throw new Error(itemError.message)
  }

  await advance(orderId, 'packed')
}

export async function markShipped(orderId: string, tracking: string) {
  await advance(orderId, 'shipped', {
    tracking: tracking.trim() || null,
    shipped_at: new Date().toISOString(),
  })
}
```

- [ ] **Step 5: Write the queue page**

```tsx
// src/app/admin/orders/page.tsx
//
// Three columns, because there are exactly three things Karim does: match a
// Zelle payment, pack a paid order, ship a packed one.

import { notFound } from 'next/navigation'
import { createServiceClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/shop/pricing'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const user = await getAuthenticatedUser()
  // 404 rather than 403: an admin route should not confirm it exists.
  if (!user || user.id !== process.env.SHOP_ADMIN_USER_ID) notFound()

  const supabase = createServiceClient()
  const { data: orders } = await supabase
    .from('shop_orders')
    .select('id, status, total_cents, payment_provider, payment_reference, created_at, ship_name')
    .in('status', ['awaiting_payment', 'paid', 'packed'])
    .order('created_at', { ascending: true })

  const bucket = (status: string) => (orders ?? []).filter((o) => o.status === status)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-cx-black">Orders</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {[
          ['Awaiting payment', 'awaiting_payment'],
          ['Paid — needs packing', 'paid'],
          ['Packed — needs shipping', 'packed'],
        ].map(([title, status]) => (
          <section key={status}>
            <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
              {title} ({bucket(status).length})
            </h2>
            <ul className="mt-3 space-y-2">
              {bucket(status).map((order) => (
                <li key={order.id} className="rounded border border-cx-light p-3">
                  <p className="font-mono text-sm text-cx-dark">{order.payment_reference}</p>
                  <p className="text-sm text-cx-dark">{order.ship_name}</p>
                  <p className="font-mono text-xs text-cx-stone">
                    {formatPrice(order.total_cents)} · {order.payment_provider}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Run and commit**

```bash
npm test && npx tsc --noEmit
git add src/lib/shop/orders/admin.ts src/lib/shop/orders/admin.test.ts src/app/admin/
git commit -m "feat(shop): the admin order queue"
```

> **The queue is read-only at the end of this task.** The three server actions
> exist and are tested through `validatePackAssignment` and `canTransition`, but
> no button calls them yet. That is listed under "What this plan does not build"
> rather than left as an implied next step.

---

### Task 8: Checkout contract for the storefront

**Files:**
- Modify: `docs/BACKEND-CONTRACT.md` (extend section 13)

- [ ] **Step 1: Document what the checkout UI needs**

Append to §13, in the file's existing voice:

- `createOrder(lines, shippingAddress, provider)` returns `{ orderId, intent }`.
  `intent.redirectUrl` means send the buyer there (BTCPay); `intent.instructions`
  means render them in-page (Zelle).
- Purchase requires an account and a `profiles.dob` proving 18+.
- Order status page at `/shop/orders/[id]`, readable only by its owner.
- **`awaiting_payment` is the normal state after a Zelle checkout, not an error.**
  It clears when Karim confirms, usually within a business day. Say so plainly.
- Never display stock levels.
- Refunds are manual: neither rail gives the buyer an issuer to appeal to, so the
  refund policy must be visible at checkout and honoured by hand.

- [ ] **Step 2: Commit**

```bash
git add docs/BACKEND-CONTRACT.md
git commit -m "docs(shop): checkout contract for the storefront"
```

---

## What this plan does not build

Customer-facing cart, checkout and order-status pages (Claude Design) · a card
rail · automated Zelle reconciliation (not possible) · inventory decrement on
sale · order confirmation emails · returns handling · anything under
`src/app/api/stripe/` or `src/lib/stripe.ts`.

Also **not** built: the `createOrder` server action itself, and the buttons that
call `markPaid` / `markPacked` / `markShipped`. Both are deliberately deferred —
they are the two places where the real shape of a cart payload and a packing
screen decide the interface, and guessing at that before either exists produces
an interface that gets rewritten. Everything they depend on (totals, references,
the status machine, the pack guard, the adapters) is built and tested here, so
they are assembly rather than design.

## Follow-ups for Karim

1. **Confirm shipping cost and the free-shipping threshold** — `$12.00` and
   `$150.00` are placeholders chosen so the tests assert something.
2. **`SHOP_ZELLE_HANDLE`** must be an account under the shop entity.
3. **`SHOP_ADMIN_USER_ID`** — your Supabase user id.
4. **BTCPay**: `BTCPAY_URL`, `BTCPAY_STORE_ID`, `BTCPAY_API_KEY`,
   `BTCPAY_WEBHOOK_SECRET`.
5. **Inventory decrement is not wired.** At seven SKUs and manual fulfilment,
   overselling is recoverable by refunding, and a reservation system built before
   the first order would be guesswork. Revisit once real order volume exists.
