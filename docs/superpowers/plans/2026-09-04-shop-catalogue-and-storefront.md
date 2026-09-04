# Shop — Catalogue & Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a browsable, read-only shop at `/shop` — seven products, real assay
data, per-mg unit pricing — with no cart and no way to pay.

**Architecture:** Products and lots become Postgres tables seeded from typed TS
constants that stay the reviewable source of truth in git. The storefront reads
them in server components. The assay block is one state-driven component covering
three states and two assay shapes. Nothing in this plan handles money.

**Tech Stack:** Next.js 14 App Router · TypeScript 5 · Tailwind (`cx.*` tokens) ·
Supabase Postgres + RLS · vitest 4 (`environment: 'node'`)

**Spec:** `docs/superpowers/specs/2026-09-04-peptide-shop-design.md`

## Global Constraints

- **No Janoshik report code may reach the browser.** Not as a field, not embedded
  in a slug, not in any client-imported module. This is spec D3.
- **`assay_state` is an enum, never null.** `'assayed' | 'pending' | 'none'`.
  `pending` requires `assay_expected_at`. `none` never lists.
- **Blends carry no per-mg price.** `assay_type = 'composition'` products show the
  component table instead. Spec §5.
- **Never sort, rank, or badge the catalogue by $/mg.** Cross-compound comparison
  is meaningless and misleading. No "best value" affordance.
- **This plan touches no Stripe code and no billing surface.** The subscription
  system stays untouched and unaware.
- Brand tokens only (`cx.teal #1A8A9E`, `cx.parchment`, `cx.dark`, …). Cormorant
  Garamond display, Jost UI, **JetBrains Mono for all numerics** (purity, mg,
  prices, lot codes, dates).
- Tests run in `environment: 'node'` with no database. All tests in this plan are
  pure — they assert against the TS constants, never against Supabase.
- Commit style: `feat(shop):` / `fix(shop):` / `test(shop):`.

---

### Task 1: Stop shipping Janoshik report codes to the browser

`src/lib/catalog.ts` is imported by nine `'use client'` components, so all 27
`reportCode` values are in the public JS bundle today. Nothing renders them —
they are dead data that resolves to a page naming the manufacturer.

**Files:**
- Modify: `src/lib/catalog.ts` (the `Vial` interface, line ~141, and 27 entries)
- Create: `src/lib/vial-reports.server.ts`
- Modify: `src/lib/catalog.test.ts:61`
- Create: `src/lib/vial-reports.test.ts`

**Interfaces:**
- Consumes: `VIALS`, `Vial` from `@/lib/catalog`
- Produces: `REPORT_CODES: Record<string, string>` (slug → Janoshik code), server-only

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/vial-reports.test.ts
import { describe, expect, it } from 'vitest'
import { VIALS } from '@/lib/catalog'
import { REPORT_CODES } from '@/lib/vial-reports.server'

describe('report codes', () => {
  it('are not present on any client-reachable vial', () => {
    const leaked = VIALS.filter((v) => 'reportCode' in v)
    expect(leaked.map((v) => v.lot)).toEqual([])
  })

  it('cover every batch, keyed by slug', () => {
    expect(Object.keys(REPORT_CODES).sort()).toEqual(VIALS.map((v) => v.slug).sort())
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/vial-reports.test.ts`
Expected: FAIL — cannot resolve `@/lib/vial-reports.server`.

- [ ] **Step 3: Extract the codes into a server-only module**

Run this script once; it writes the new module and strips the field.

```bash
python - <<'PY'
import re
p='src/lib/catalog.ts'
src=open(p,encoding='utf-8').read()
pairs=re.findall(r"slug: '([^']+)',[\s\S]{0,600}?reportCode: '([^']+)',",src)
assert len(pairs)==27, f'expected 27, got {len(pairs)}'
out=["// Janoshik report codes. SERVER ONLY — never import this from a 'use client'",
     "// module. A published code resolves to a page naming the manufacturer; see",
     "// spec D3 in docs/superpowers/specs/2026-09-04-peptide-shop-design.md.",
     '',
     'export const REPORT_CODES: Record<string, string> = {']
out += [f"  '{s}': '{c}'," for s,c in pairs]
out += ['}', '']
open('src/lib/vial-reports.server.ts','w',encoding='utf-8').write('\n'.join(out))
src=re.sub(r"\n\s*reportCode: '[^']+',",'',src)
src=src.replace("  /** The Janoshik report code the label's DataMatrix resolves to. */\n  reportCode: string\n",'')
open(p,'w',encoding='utf-8').write(src)
print('ok')
PY
```

- [ ] **Step 4: Update the existing catalog test that asserted the field**

Replace `src/lib/catalog.test.ts:61` (which read
`VIALS.filter((vial) => !vial.slug.endsWith(vial.reportCode))`) with:

```ts
    const mismatched = VIALS.filter((vial) => !REPORT_CODES[vial.slug])
```

and add `import { REPORT_CODES } from '@/lib/vial-reports.server'` to that file.

- [ ] **Step 5: Run the whole suite**

Run: `npm test && npx tsc --noEmit`
Expected: all pass. The suite was 101 tests; expect 103 now.

- [ ] **Step 6: Commit**

```bash
git add src/lib/catalog.ts src/lib/vial-reports.server.ts src/lib/catalog.test.ts src/lib/vial-reports.test.ts
git commit -m "fix(shop): stop shipping Janoshik report codes to the browser"
```

> **Known remaining leak, deliberately not fixed here.** Every `Vial.slug` still
> *ends with* its report code (`102107-RT_30_D14D7EHWHFH9`). Slugs name the label
> artwork in `design/vial-labels/labels-{dark,light}/`, so renaming them means
> regenerating that artwork. Task 2 keeps the shop off slugs entirely; closing the
> Mirror's leak is tracked as a follow-up for Karim.

---

### Task 2: Shop types and the launch catalogue

**Files:**
- Create: `src/lib/shop/types.ts`
- Create: `src/lib/shop/catalogue.ts`
- Create: `src/lib/shop/catalogue.test.ts`

**Interfaces:**
- Consumes: `COMPOUNDS` from `@/lib/catalog`
- Produces: `ShopProduct`, `ShopLot`, `AssayState`, `AssayType`, `Component`,
  `PRODUCTS: ShopProduct[]`, `LOTS: ShopLot[]`, `lotsFor(productSlug): ShopLot[]`,
  `currentLot(productSlug): ShopLot | undefined`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/catalogue.test.ts
import { describe, expect, it } from 'vitest'
import { COMPOUNDS } from '@/lib/catalog'
import { LOTS, PRODUCTS, currentLot, lotsFor } from '@/lib/shop/catalogue'

describe('launch catalogue', () => {
  it('carries the seven launch SKUs', () => {
    expect(PRODUCTS).toHaveLength(7)
  })

  it('resolves every compoundId against the peptide catalog', () => {
    const unresolved = PRODUCTS.filter((p) => p.compoundId && !COMPOUNDS[p.compoundId])
    expect(unresolved.map((p) => p.slug)).toEqual([])
  })

  it('resolves every blend component against the peptide catalog', () => {
    const unresolved = PRODUCTS.flatMap((p) =>
      (p.blendOf ?? []).filter((id) => !COMPOUNDS[id]).map((id) => `${p.slug}:${id}`),
    )
    expect(unresolved).toEqual([])
  })

  it('points every lot at a real product', () => {
    const orphans = LOTS.filter((l) => !PRODUCTS.some((p) => p.slug === l.productSlug))
    expect(orphans.map((l) => l.lotCode)).toEqual([])
  })

  // Spec: assay_state is an enum and never null; pending requires a date.
  it('gives every pending lot an expected date', () => {
    const undated = LOTS.filter((l) => l.assayState === 'pending' && !l.assayExpectedAt)
    expect(undated.map((l) => l.lotCode)).toEqual([])
  })

  it('gives every assayed lot the figure its type requires', () => {
    const broken = LOTS.filter(
      (l) =>
        l.assayState === 'assayed' &&
        (l.assayType === 'purity' ? l.purityPct === null : (l.components ?? []).length === 0),
    )
    expect(broken.map((l) => l.lotCode)).toEqual([])
  })

  // Spec D3 — nothing in this module may carry a Janoshik code.
  it('carries no report codes', () => {
    expect(JSON.stringify(LOTS)).not.toMatch(/XAKRSW4WN85N|D14D7EHWHFH9/)
  })

  it('gives GLP-3 its three assayed lots', () => {
    expect(lotsFor('glp-3-30mg').map((l) => l.purityPct)).toEqual([99.62, 99.73, 99.46])
  })

  it('picks the current lot for a product', () => {
    expect(currentLot('glp-3-30mg')?.lotCode).toBe('JA-102107')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/catalogue.test.ts`
Expected: FAIL — cannot resolve `@/lib/shop/catalogue`.

- [ ] **Step 3: Write the types**

```ts
// src/lib/shop/types.ts
export type AssayState = 'assayed' | 'pending' | 'none'
export type AssayType = 'purity' | 'composition'

export interface Component {
  name: string
  mg: number
}

export interface ShopProduct {
  slug: string
  name: string
  /** Into COMPOUNDS. Null for a blend or a non-peptide. */
  compoundId: string | null
  sizeValue: number
  sizeUnit: 'mg' | 'IU'
  priceCents: number
  /** Component compound ids, for a blend. Absent on a single compound. */
  blendOf?: string[]
  active: boolean
  sortOrder: number
}

export interface ShopLot {
  productSlug: string
  /** Null where the batch is real but its code has not been recorded yet. */
  lotCode: string | null
  assayState: AssayState
  assayType: AssayType
  /** Percent, when assayType is 'purity'. */
  purityPct: number | null
  /** Measured components, when assayType is 'composition'. */
  components?: Component[]
  labelMg: number
  measuredTotalMg: number | null
  /** ISO month, e.g. '2026-10'. Required when assayState is 'pending'. */
  assayExpectedAt: string | null
  mfg: string | null
  exp: string | null
  shelfLife: string | null
  isCurrent: boolean
}
```

- [ ] **Step 4: Write the catalogue**

```ts
// src/lib/shop/catalogue.ts
//
// Source of truth for the launch catalogue, in git so it is reviewable. The
// Supabase seed in supabase/shop_seed.sql is generated from this — see Task 4.
//
// NO REPORT CODES HERE. Spec D3: a published Janoshik code resolves to a page
// naming the manufacturer. Codes live in src/lib/vial-reports.server.ts.

import type { ShopLot, ShopProduct } from '@/lib/shop/types'

export const PRODUCTS: ShopProduct[] = [
  { slug: 'glp-3-30mg', name: 'GLP-3 (Retatrutide)', compoundId: 'retatrutide', sizeValue: 30, sizeUnit: 'mg', priceCents: 12500, active: true, sortOrder: 1 },
  { slug: 'vip-5mg', name: 'VIP', compoundId: 'vip-vip', sizeValue: 5, sizeUnit: 'mg', priceCents: 3000, active: true, sortOrder: 2 },
  { slug: 'mots-c-10mg', name: 'MOTS-c', compoundId: 'mots-c', sizeValue: 10, sizeUnit: 'mg', priceCents: 3000, active: true, sortOrder: 3 },
  { slug: 'selank-5mg', name: 'Selank', compoundId: 'selank', sizeValue: 5, sizeUnit: 'mg', priceCents: 3000, active: true, sortOrder: 4 },
  { slug: 'semax-5mg', name: 'Semax', compoundId: 'semax', sizeValue: 5, sizeUnit: 'mg', priceCents: 3000, active: true, sortOrder: 5 },
  {
    slug: 'klow-80mg', name: 'KLOW', compoundId: null, sizeValue: 80, sizeUnit: 'mg',
    priceCents: 10000, active: true, sortOrder: 6,
    blendOf: ['ghk-cu-copper-peptide', 'bpc-157', 'tb-500', 'kpv'],
  },
  { slug: 'nad-1000mg', name: 'NAD+', compoundId: 'nad', sizeValue: 1000, sizeUnit: 'mg', priceCents: 7500, active: true, sortOrder: 7 },
]

const COLD = 'USE WITHIN 28 DAYS · 2–8 °C'

export const LOTS: ShopLot[] = [
  // GLP-3 — three consecutive lots. The launch's only track record.
  { productSlug: 'glp-3-30mg', lotCode: 'JA-102107', assayState: 'assayed', assayType: 'purity', purityPct: 99.62, labelMg: 30, measuredTotalMg: null, assayExpectedAt: null, mfg: '2026-01', exp: '2028-01', shelfLife: COLD, isCurrent: true },
  { productSlug: 'glp-3-30mg', lotCode: 'JA-68243', assayState: 'assayed', assayType: 'purity', purityPct: 99.73, labelMg: 30, measuredTotalMg: null, assayExpectedAt: null, mfg: null, exp: null, shelfLife: COLD, isCurrent: false },
  { productSlug: 'glp-3-30mg', lotCode: 'JA-63071', assayState: 'assayed', assayType: 'purity', purityPct: 99.46, labelMg: 30, measuredTotalMg: null, assayExpectedAt: null, mfg: null, exp: null, shelfLife: COLD, isCurrent: false },

  { productSlug: 'mots-c-10mg', lotCode: 'JA-102111', assayState: 'assayed', assayType: 'purity', purityPct: 99.11, labelMg: 10, measuredTotalMg: null, assayExpectedAt: null, mfg: '2026-01', exp: '2028-01', shelfLife: COLD, isCurrent: true },

  // KLOW — composition, not purity. Four measured actives against an 80 mg label.
  {
    productSlug: 'klow-80mg', lotCode: 'JA-102113', assayState: 'assayed', assayType: 'composition',
    purityPct: null, labelMg: 80, measuredTotalMg: 90.65, assayExpectedAt: null,
    mfg: '2026-01', exp: '2028-01', shelfLife: COLD, isCurrent: true,
    components: [
      { name: 'GHK-Cu', mg: 57.45 },
      { name: 'BPC-157', mg: 11.12 },
      { name: 'TB-500 (TB4)', mg: 10.88 },
      { name: 'KPV', mg: 11.20 },
    ],
  },

  // Pending — the vials are real, the assay is not back, and no lot code has
  // been recorded for them yet. lotCode stays null rather than inventing one:
  // a fabricated code on a physical batch is exactly the kind of thing this
  // whole brand is positioned against.
  { productSlug: 'vip-5mg', lotCode: null, assayState: 'pending', assayType: 'purity', purityPct: null, labelMg: 5, measuredTotalMg: null, assayExpectedAt: '2026-10', mfg: null, exp: null, shelfLife: COLD, isCurrent: true },
  { productSlug: 'selank-5mg', lotCode: null, assayState: 'pending', assayType: 'purity', purityPct: null, labelMg: 5, measuredTotalMg: null, assayExpectedAt: '2026-10', mfg: null, exp: null, shelfLife: COLD, isCurrent: true },
  { productSlug: 'semax-5mg', lotCode: null, assayState: 'pending', assayType: 'purity', purityPct: null, labelMg: 5, measuredTotalMg: null, assayExpectedAt: '2026-10', mfg: null, exp: null, shelfLife: COLD, isCurrent: true },
  { productSlug: 'nad-1000mg', lotCode: null, assayState: 'pending', assayType: 'purity', purityPct: null, labelMg: 1000, measuredTotalMg: null, assayExpectedAt: '2026-10', mfg: null, exp: null, shelfLife: COLD, isCurrent: true },
]

export function lotsFor(productSlug: string): ShopLot[] {
  return LOTS.filter((lot) => lot.productSlug === productSlug)
}

export function currentLot(productSlug: string): ShopLot | undefined {
  return lotsFor(productSlug).find((lot) => lot.isCurrent)
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/lib/shop/catalogue.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/shop/types.ts src/lib/shop/catalogue.ts src/lib/shop/catalogue.test.ts
git commit -m "feat(shop): types and the seven-SKU launch catalogue"
```

> **`assayExpectedAt` is `'2026-10'` as a placeholder value chosen for the code to
> compile and the tests to pass, NOT as a commitment.** Spec §10 item 2 records
> that these dates are Karim's to set. Confirm them before the shop is public — a
> date that passes with nothing behind it is worse than no date.

---

### Task 3: Per-mg unit pricing

**Files:**
- Create: `src/lib/shop/pricing.ts`
- Create: `src/lib/shop/pricing.test.ts`

**Interfaces:**
- Consumes: `ShopProduct` from `@/lib/shop/types`
- Produces: `perMgCents(product): number | null`, `formatPrice(cents): string`,
  `formatUnitPrice(product): string | null`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shop/pricing.test.ts
import { describe, expect, it } from 'vitest'
import { PRODUCTS } from '@/lib/shop/catalogue'
import { formatPrice, formatUnitPrice, perMgCents } from '@/lib/shop/pricing'

const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)!

describe('unit pricing', () => {
  it('divides price by milligrams', () => {
    expect(perMgCents(bySlug('glp-3-30mg'))).toBeCloseTo(416.667, 2)
    expect(perMgCents(bySlug('mots-c-10mg'))).toBe(300)
    expect(perMgCents(bySlug('nad-1000mg'))).toBeCloseTo(7.5, 4)
  })

  // Spec §5: a price per milligram of unspecified mixture means nothing.
  it('refuses to price a blend per milligram', () => {
    expect(perMgCents(bySlug('klow-80mg'))).toBeNull()
    expect(formatUnitPrice(bySlug('klow-80mg'))).toBeNull()
  })

  it('formats money and unit price for display', () => {
    expect(formatPrice(12500)).toBe('$125.00')
    expect(formatUnitPrice(bySlug('glp-3-30mg'))).toBe('$4.17 / mg')
    expect(formatUnitPrice(bySlug('nad-1000mg'))).toBe('$0.075 / mg')
  })

  it('never prices per mg for an IU product', () => {
    const iu = { ...bySlug('mots-c-10mg'), sizeUnit: 'IU' as const }
    expect(perMgCents(iu)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/pricing.test.ts`
Expected: FAIL — cannot resolve `@/lib/shop/pricing`.

- [ ] **Step 3: Implement**

```ts
// src/lib/shop/pricing.ts
//
// Per-mg is the entire pricing argument (spec §5). Two rules it must obey:
//
//   1. It compares WITHIN a compound, never across the catalogue. NAD+ at
//      $0.075/mg beside Semax at $6.00/mg says nothing about value. Never sort,
//      rank, or badge by this number.
//   2. Blends get none. KLOW is four molecules; a price per milligram of
//      unspecified mixture is meaningless and ambiguous besides.

import type { ShopProduct } from '@/lib/shop/types'

export function perMgCents(product: ShopProduct): number | null {
  if (product.blendOf) return null
  if (product.sizeUnit !== 'mg') return null
  if (product.sizeValue <= 0) return null
  return product.priceCents / product.sizeValue
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatUnitPrice(product: ShopProduct): string | null {
  const perMg = perMgCents(product)
  if (perMg === null) return null
  const dollars = perMg / 100
  // Sub-cent compounds (NAD+) need three places or they read as $0.01.
  const text = dollars < 0.1 ? dollars.toFixed(3) : dollars.toFixed(2)
  return `$${text} / mg`
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/lib/shop/pricing.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shop/pricing.ts src/lib/shop/pricing.test.ts
git commit -m "feat(shop): per-mg unit pricing, with blends excluded by design"
```

---

### Task 4: Schema migration and seed

**Files:**
- Create: `supabase/shop_schema.sql`
- Create: `scripts/generate-shop-seed.mjs`
- Create: `supabase/shop_seed.sql` (generated)

**Interfaces:**
- Consumes: `PRODUCTS`, `LOTS` from `@/lib/shop/catalogue`
- Produces: tables `shop_products`, `shop_lots`, `shop_inventory`

- [ ] **Step 1: Write the schema**

```sql
-- supabase/shop_schema.sql
-- Shop catalogue — 2026-09-04
--
-- Products and lots for the direct-sales storefront. Orders, order_items and
-- payments are NOT here; they arrive with the checkout plan.
--
-- assay_report_code is deliberately ABSENT from this schema. A Janoshik code
-- resolves to a page naming the manufacturer (spec D3). Codes live server-side
-- in src/lib/vial-reports.server.ts and must never enter a table the storefront
-- reads.

create table if not exists public.shop_products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  compound_id  text,
  size_value   numeric not null check (size_value > 0),
  size_unit    text not null check (size_unit in ('mg','IU')),
  price_cents  integer not null check (price_cents >= 0),
  blend_of     text[],
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.shop_lots (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.shop_products(id) on delete cascade,
  -- Nullable: a pending batch is real but may have no recorded code yet.
  -- Postgres allows many nulls under a unique constraint, which is what we want.
  lot_code           text unique,
  assay_state        text not null check (assay_state in ('assayed','pending','none')),
  assay_type         text not null check (assay_type in ('purity','composition')),
  purity_pct         numeric,
  components         jsonb,
  label_mg           numeric not null,
  measured_total_mg  numeric,
  assay_expected_at  text,
  mfg                text,
  exp                text,
  shelf_life         text,
  is_current         boolean not null default false,
  created_at         timestamptz not null default now(),

  -- The spec's invariants, enforced by the database rather than by convention.
  constraint pending_needs_a_date
    check (assay_state <> 'pending' or assay_expected_at is not null),
  constraint assayed_purity_needs_a_figure
    check (assay_state <> 'assayed' or assay_type <> 'purity' or purity_pct is not null),
  constraint assayed_composition_needs_components
    check (assay_state <> 'assayed' or assay_type <> 'composition' or components is not null)
);

create index if not exists shop_lots_product_idx on public.shop_lots(product_id);

create table if not exists public.shop_inventory (
  lot_id         uuid primary key references public.shop_lots(id) on delete cascade,
  qty_on_hand    integer not null default 0 check (qty_on_hand >= 0),
  qty_reserved   integer not null default 0 check (qty_reserved >= 0),
  updated_at     timestamptz not null default now()
);

-- The catalogue is public. Writes are service-role only: no policy grants them,
-- and RLS denies by default.
alter table public.shop_products  enable row level security;
alter table public.shop_lots      enable row level security;
alter table public.shop_inventory enable row level security;

drop policy if exists shop_products_public_read on public.shop_products;
create policy shop_products_public_read on public.shop_products for select using (true);

drop policy if exists shop_lots_public_read on public.shop_lots;
create policy shop_lots_public_read on public.shop_lots for select using (true);

-- Inventory is NOT publicly readable: stock levels are commercially sensitive
-- and the storefront does not display them at launch.
```

- [ ] **Step 2: Write the seed generator**

```js
// scripts/generate-shop-seed.mjs
// Regenerate supabase/shop_seed.sql from the TS catalogue:
//   node scripts/generate-shop-seed.mjs
import { writeFileSync } from 'node:fs'
import { LOTS, PRODUCTS } from '../src/lib/shop/catalogue.ts'

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const arr = (v) => (v ? `array[${v.map(q).join(',')}]` : 'null')
const json = (v) => (v ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` : 'null')

const lines = [
  '-- GENERATED by scripts/generate-shop-seed.mjs — do not edit by hand.',
  '-- Source of truth: src/lib/shop/catalogue.ts',
  '',
]

for (const p of PRODUCTS) {
  lines.push(
    `insert into public.shop_products (slug,name,compound_id,size_value,size_unit,price_cents,blend_of,active,sort_order) values (` +
      `${q(p.slug)},${q(p.name)},${q(p.compoundId)},${p.sizeValue},${q(p.sizeUnit)},${p.priceCents},${arr(p.blendOf)},${p.active},${p.sortOrder})` +
      ` on conflict (slug) do update set name=excluded.name, price_cents=excluded.price_cents, active=excluded.active, sort_order=excluded.sort_order;`,
  )
}
lines.push('')
for (const l of LOTS) {
  lines.push(
    `insert into public.shop_lots (product_id,lot_code,assay_state,assay_type,purity_pct,components,label_mg,measured_total_mg,assay_expected_at,mfg,exp,shelf_life,is_current) ` +
      `select id,${q(l.lotCode)},${q(l.assayState)},${q(l.assayType)},${l.purityPct ?? 'null'},${json(l.components)},${l.labelMg},${l.measuredTotalMg ?? 'null'},${q(l.assayExpectedAt)},${q(l.mfg)},${q(l.exp)},${q(l.shelfLife)},${l.isCurrent} ` +
      `from public.shop_products p where p.slug=${q(l.productSlug)} ` +
      // Idempotent without relying on lot_code, which is null for pending batches.
      `and not exists (select 1 from public.shop_lots l where l.product_id=p.id ` +
      `and coalesce(l.lot_code,'') = coalesce(${q(l.lotCode)},''));`,
  )
}

writeFileSync('supabase/shop_seed.sql', lines.join('\n') + '\n')
console.log(`wrote ${PRODUCTS.length} products, ${LOTS.length} lots`)
```

- [ ] **Step 3: Generate the seed and eyeball it**

```bash
npx tsx scripts/generate-shop-seed.mjs
head -20 supabase/shop_seed.sql
```

Expected: `wrote 7 products, 9 lots`, and no Janoshik code anywhere in the file.

- [ ] **Step 4: Verify the redaction invariant survived generation**

```bash
grep -E 'XAKRSW4WN85N|D14D7EHWHFH9|MDTR34NN18JH' supabase/shop_seed.sql && echo 'LEAK' || echo 'clean'
```

Expected: `clean`.

- [ ] **Step 5: Commit**

```bash
git add supabase/shop_schema.sql supabase/shop_seed.sql scripts/generate-shop-seed.mjs
git commit -m "feat(shop): catalogue schema and generated seed"
```

> **Do not run these against the live project as part of this task.** Applying
> them is Karim's call — spec §10 items 4 and 5 are still open and nothing should
> touch the production database before the shop entity exists.

---

### Task 5: The assay block

The component that carries the whole differentiator. Three states, two shapes.

**Files:**
- Create: `src/components/shop/AssayBlock.tsx`

**Interfaces:**
- Consumes: `ShopLot` from `@/lib/shop/types`
- Produces: `<AssayBlock lot={ShopLot} />` — a server component, no `'use client'`

- [ ] **Step 1: Implement**

```tsx
// src/components/shop/AssayBlock.tsx
//
// Three states, two shapes. No verification affordance: there is nothing to
// click until Karim's own assays land (spec D5), and an unverifiable COA that
// invites you to verify it is worse than one that does not.

import type { ShopLot } from '@/lib/shop/types'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function monthName(iso: string): string {
  const [year, month] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

export function AssayBlock({ lot }: { lot: ShopLot }) {
  if (lot.assayState === 'none') return null

  if (lot.assayState === 'pending') {
    return (
      <section className="rounded-lg border border-cx-light bg-cx-off p-5">
        <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">Independent assay</h2>
        <p className="mt-2 font-mono text-lg text-cx-dark">
          Commissioned — results expected {monthName(lot.assayExpectedAt!)}
        </p>
        <p className="mt-2 text-sm italic text-cx-stone">
          This product ships with no published assay until then.
        </p>
      </section>
    )
  }

  if (lot.assayType === 'composition') {
    return (
      <section className="rounded-lg border border-cx-light bg-cx-off p-5">
        <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
          Independent assay — composition
        </h2>
        <table className="mt-3 w-full font-mono text-sm">
          <tbody>
            {(lot.components ?? []).map((c) => (
              <tr key={c.name} className="border-b border-cx-light last:border-0">
                <td className="py-1.5 text-cx-dark">{c.name}</td>
                <td className="py-1.5 text-right tabular-nums text-cx-dark">{c.mg.toFixed(2)} mg</td>
              </tr>
            ))}
            <tr className="border-t-2 border-cx-dark">
              <td className="pt-2 font-semibold text-cx-dark">Measured</td>
              <td className="pt-2 text-right font-semibold tabular-nums text-cx-teal">
                {lot.measuredTotalMg?.toFixed(2)} mg
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 font-mono text-xs text-cx-stone">
          against {lot.labelMg} mg labelled · lot {lot.lotCode}
        </p>
        <p className="mt-3 text-sm text-cx-stone">Independent third-party assay · report on file</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-cx-light bg-cx-off p-5">
      <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">Independent assay</h2>
      <p className="mt-2 font-mono text-4xl tabular-nums text-cx-teal">{lot.purityPct?.toFixed(2)}%</p>
      <p className="font-sans text-sm text-cx-stone">purity · third-party HPLC · report on file</p>
      <p className="mt-3 font-mono text-xs text-cx-stone">
        Lot {lot.lotCode}
        {lot.mfg ? ` · MFG ${lot.mfg}` : ''}
        {lot.exp ? ` · EXP ${lot.exp}` : ''}
      </p>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/shop/AssayBlock.tsx
git commit -m "feat(shop): the assay block — three states, two shapes"
```

---

### Task 6: Product card and the shop grid

**Files:**
- Create: `src/components/shop/ProductCard.tsx`
- Create: `src/app/shop/page.tsx`

**Interfaces:**
- Consumes: `PRODUCTS`, `currentLot` from `@/lib/shop/catalogue`;
  `formatPrice`, `formatUnitPrice` from `@/lib/shop/pricing`
- Produces: `<ProductCard product={ShopProduct} />`, the `/shop` route

- [ ] **Step 1: Write the card**

```tsx
// src/components/shop/ProductCard.tsx
import Link from 'next/link'
import { currentLot } from '@/lib/shop/catalogue'
import { formatPrice, formatUnitPrice } from '@/lib/shop/pricing'
import type { ShopProduct } from '@/lib/shop/types'

export function ProductCard({ product }: { product: ShopProduct }) {
  const lot = currentLot(product.slug)
  const unit = formatUnitPrice(product)

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="block rounded-lg border border-cx-light bg-cx-parchment p-5 transition hover:border-cx-teal"
    >
      <h3 className="font-display text-2xl text-cx-black">{product.name}</h3>
      <p className="font-mono text-sm text-cx-stone">
        {product.sizeValue} {product.sizeUnit}
      </p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-xl text-cx-dark">{formatPrice(product.priceCents)}</span>
        {/* Unit price compares within a compound only — never ranked across the grid. */}
        {unit && <span className="font-mono text-sm text-cx-stone">{unit}</span>}
      </div>

      <p className="mt-3 font-mono text-xs text-cx-stone">
        {lot?.assayState === 'assayed'
          ? lot.assayType === 'purity'
            ? `${lot.purityPct?.toFixed(2)}% assayed`
            : `${(lot.components ?? []).length} components measured`
          : 'assay pending'}
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Write the grid page**

```tsx
// src/app/shop/page.tsx
import type { Metadata } from 'next'
import { ProductCard } from '@/components/shop/ProductCard'
import { PRODUCTS } from '@/lib/shop/catalogue'

export const metadata: Metadata = {
  title: 'Shop — Peptide Cortex',
  description: 'Research compounds with published third-party assay data and per-milligram pricing.',
}

export default function ShopPage() {
  // sortOrder only. NEVER sort by price or $/mg — cross-compound comparison is
  // meaningless and a "best value" ordering would mislead. Spec §5.
  const products = PRODUCTS.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl text-cx-black">Shop</h1>
      <p className="mt-2 max-w-2xl text-cx-dark">
        Every product lists its independent assay and its price per milligram. Where an
        assay is still outstanding, we say so and give the date.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      <p className="mt-12 border-t border-cx-light pt-6 text-xs leading-relaxed text-cx-stone">
        For research and reference purposes only. Not intended as dosing instructions for
        human or animal use, and not for human consumption. Consult a licensed physician
        before any medical decisions. Adults 18+. US shipping only.
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Verify it renders**

Run: `npm run dev`, open `http://localhost:3000/shop`
Expected: seven cards, sortOrder order, KLOW showing no per-mg figure, four cards
reading "assay pending".

- [ ] **Step 4: Commit**

```bash
git add src/components/shop/ProductCard.tsx src/app/shop/page.tsx
git commit -m "feat(shop): product card and the catalogue grid"
```

---

### Task 7: Product page with lot history

**Files:**
- Create: `src/components/shop/LotHistory.tsx`
- Create: `src/app/shop/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PRODUCTS`, `lotsFor`, `currentLot`, `AssayBlock`, pricing helpers,
  `COMPOUNDS` from `@/lib/catalog`
- Produces: the `/shop/[slug]` route

- [ ] **Step 1: Write the lot history**

```tsx
// src/components/shop/LotHistory.tsx
//
// Renders only when a product has more than one lot — an archive of one is not a
// track record. It fills in on its own as batches are restocked.

import type { ShopLot } from '@/lib/shop/types'

export function LotHistory({ lots }: { lots: ShopLot[] }) {
  const assayed = lots.filter((l) => l.assayState === 'assayed' && l.assayType === 'purity')
  if (assayed.length < 2) return null

  return (
    <section className="mt-8">
      <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
        Every lot we have shipped
      </h2>
      <table className="mt-3 w-full font-mono text-sm">
        <tbody>
          {assayed.map((lot) => (
            <tr key={lot.lotCode} className="border-b border-cx-light last:border-0">
              <td className="py-2 text-cx-dark">{lot.lotCode}</td>
              <td className="py-2 text-cx-stone">{lot.mfg ?? '—'}</td>
              <td className="py-2 text-right tabular-nums text-cx-teal">
                {lot.purityPct?.toFixed(2)}%
              </td>
              <td className="py-2 pl-3 text-right text-xs text-cx-stone">
                {lot.isCurrent ? 'shipping now' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
```

- [ ] **Step 2: Write the product page**

```tsx
// src/app/shop/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { AssayBlock } from '@/components/shop/AssayBlock'
import { LotHistory } from '@/components/shop/LotHistory'
import { COMPOUNDS } from '@/lib/catalog'
import { PRODUCTS, currentLot, lotsFor } from '@/lib/shop/catalogue'
import { formatPrice, formatUnitPrice } from '@/lib/shop/pricing'

export function generateStaticParams() {
  return PRODUCTS.filter((p) => p.active).map((p) => ({ slug: p.slug }))
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find((p) => p.slug === params.slug && p.active)
  if (!product) notFound()

  const lot = currentLot(product.slug)
  const unit = formatUnitPrice(product)
  const compound = product.compoundId ? COMPOUNDS[product.compoundId] : undefined

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl text-cx-black">{product.name}</h1>
      <p className="font-mono text-cx-stone">
        {product.sizeValue} {product.sizeUnit}
      </p>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-mono text-3xl text-cx-dark">{formatPrice(product.priceCents)}</span>
        {unit && <span className="font-mono text-cx-stone">{unit}</span>}
      </div>

      <div className="mt-8">{lot && <AssayBlock lot={lot} />}</div>

      <LotHistory lots={lotsFor(product.slug)} />

      {compound && (
        <section className="mt-8">
          <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
            What it is
          </h2>
          <p className="mt-2 text-cx-dark">{compound.action}</p>
          <p className="mt-2 text-sm text-cx-stone">{compound.bottomLine}</p>
        </section>
      )}

      {product.blendOf && (
        <section className="mt-8">
          <h2 className="font-sans text-xs uppercase tracking-widest text-cx-stone">
            What is in it
          </h2>
          <ul className="mt-2 space-y-1">
            {product.blendOf.map((id) => (
              <li key={id} className="text-cx-dark">
                {COMPOUNDS[id]?.name ?? id}
                <span className="text-sm text-cx-stone"> — {COMPOUNDS[id]?.purpose ?? ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 border-t border-cx-light pt-6 text-xs leading-relaxed text-cx-stone">
        For research and reference purposes only. Not intended as dosing instructions for
        human or animal use, and not for human consumption. Consult a licensed physician
        before any medical decisions. Adults 18+. US shipping only.
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Verify all seven pages render**

Run: `npm run dev`, then visit each of:
`/shop/glp-3-30mg` `/shop/vip-5mg` `/shop/mots-c-10mg` `/shop/selank-5mg`
`/shop/semax-5mg` `/shop/klow-80mg` `/shop/nad-1000mg`

Expected: GLP-3 shows a purity block **and** a three-row lot history; KLOW shows
the component table, no per-mg, and its four ingredients; the four pending
products show the dated commissioned line and no number.

- [ ] **Step 4: Full verification**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all tests pass, no type errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/shop/LotHistory.tsx "src/app/shop/[slug]/page.tsx"
git commit -m "feat(shop): product page with lot history"
```

---

## What this plan does not build

Cart · checkout · BTCPay · Zelle · orders · `order_items` · the admin queue ·
inventory display · nav links into `/shop`. All of it lands in a second plan,
which is blocked on spec §10 items 4 and 5 (shop entity, business bank account,
refund policy) — none of which are code.

`/shop` is reachable by URL only until that plan ships. That is deliberate: a
storefront you cannot buy from should not be advertised in the nav.

## Follow-ups for Karim

1. **The printed labels leak the supplier.** Each vial label's DataMatrix encodes
   its Janoshik report URL — `design/vial-labels/generate-labels.mjs` designed it
   for "consumers with phones" to scan. Any customer who scans a vial reaches a
   page naming WBS-Shanghai Wibson. Task 1 closes the website leak; it cannot
   close this one. Either reprint without the DataMatrix, or accept it until the
   reports are yours — at which point the DataMatrix becomes the best feature on
   the label.
2. **`Vial.slug` still embeds the report code** (`102107-RT_30_D14D7EHWHFH9`), and
   slugs name the label artwork files. Closing it means regenerating that
   artwork. The shop never touches slugs, so this is Mirror-only.
3. **Confirm the four `assayExpectedAt` dates** before `/shop` is public.
4. **Apply `shop_schema.sql` and `shop_seed.sql`** — not done by this plan.
5. **Record real lot codes for VIP, Selank, Semax and NAD+.** Those four carry
   `lotCode: null` because no code was supplied; the vials are real, the codes
   are unknown. They ship without a lot identifier until you provide one, which
   also means no recall path for those batches once orders exist.
