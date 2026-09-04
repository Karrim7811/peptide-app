# Shop — Catalogue & Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the shop's **data layer** — seven products, real assay data, per-mg
unit pricing, schema and seed — plus the contract the new storefront is built
against. **No UI.**

**Architecture:** Products and lots become Postgres tables seeded from typed TS
constants that stay the reviewable source of truth in git. The storefront itself
is being built separately in Claude Design, so this plan ends at a documented read
shape and a real sample payload rather than at a page. Nothing here handles money.

**Division of labour:** this repo owns data, schema, pricing logic and the rules.
Claude Design owns the pixels. `docs/BACKEND-CONTRACT.md` is the interface — the
same channel the wider redesign already uses.

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

- [x] **Step 1: Write the failing test**

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

- [x] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/vial-reports.test.ts`
Expected: FAIL — cannot resolve `@/lib/vial-reports.server`.

- [x] **Step 3: Extract the codes into a server-only module**

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

- [x] **Step 4: Update the existing catalog test that asserted the field**

Replace `src/lib/catalog.test.ts:61` (which read
`VIALS.filter((vial) => !vial.slug.endsWith(vial.reportCode))`) with:

```ts
    const mismatched = VIALS.filter((vial) => !REPORT_CODES[vial.slug])
```

and add `import { REPORT_CODES } from '@/lib/vial-reports.server'` to that file.

- [x] **Step 5: Run the whole suite**

Run: `npm test && npx tsc --noEmit`
Expected: all pass. The suite was 101 tests; expect 103 now.

- [x] **Step 6: Commit**

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

- [x] **Step 1: Write the failing test**

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

- [x] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/catalogue.test.ts`
Expected: FAIL — cannot resolve `@/lib/shop/catalogue`.

- [x] **Step 3: Write the types**

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

- [x] **Step 4: Write the catalogue**

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

- [x] **Step 5: Run the tests**

Run: `npm test -- src/lib/shop/catalogue.test.ts`
Expected: PASS, 9 tests.

- [x] **Step 6: Commit**

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

- [x] **Step 1: Write the failing test**

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

- [x] **Step 2: Run it and watch it fail**

Run: `npm test -- src/lib/shop/pricing.test.ts`
Expected: FAIL — cannot resolve `@/lib/shop/pricing`.

- [x] **Step 3: Implement**

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

- [x] **Step 4: Run the tests**

Run: `npm test -- src/lib/shop/pricing.test.ts`
Expected: PASS, 5 tests.

- [x] **Step 5: Commit**

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

- [x] **Step 1: Write the schema**

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

- [x] **Step 2: Write the seed generator**

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

- [x] **Step 3: Generate the seed and eyeball it**

```bash
npx tsx scripts/generate-shop-seed.mjs
head -20 supabase/shop_seed.sql
```

Expected: `wrote 7 products, 9 lots`, and no Janoshik code anywhere in the file.

- [x] **Step 4: Verify the redaction invariant survived generation**

```bash
grep -E 'XAKRSW4WN85N|D14D7EHWHFH9|MDTR34NN18JH' supabase/shop_seed.sql && echo 'LEAK' || echo 'clean'
```

Expected: `clean`.

- [x] **Step 5: Commit**

```bash
git add supabase/shop_schema.sql supabase/shop_seed.sql scripts/generate-shop-seed.mjs
git commit -m "feat(shop): catalogue schema and generated seed"
```

> **Do not run these against the live project as part of this task.** Applying
> them is Karim's call — spec §10 items 4 and 5 are still open and nothing should
> touch the production database before the shop entity exists.

---

### Task 5: The frontend contract and sample payload

The storefront UI is being built separately in Claude Design. This task produces
what it builds against. No UI is written here.

**Files:**
- Modify: `docs/BACKEND-CONTRACT.md` (append section 13)
- Create: `docs/shop-sample-payload.json`

**Interfaces:**
- Consumes: `PRODUCTS`, `LOTS` from `@/lib/shop/catalogue`; pricing helpers
- Produces: a documented read shape and a real sample payload for all 7 products

- [x] **Step 1: Append section 13 to the backend contract**

Follow the existing file's voice: describe what exists and what it refuses to do,
never how it should look. Cover the `ShopProduct` / `ShopLot` types verbatim from
`src/lib/shop/types.ts`, the three assay states, the two assay shapes, and this
list of refusals:

```markdown
### Rules a shop frontend inherits

- **No Janoshik report code is available, ever.** There is no field for one and
  no endpoint returns one. A published code resolves to a page naming the
  manufacturer. Do not add a "verify" link; there is nothing to link to yet.
- **`unitPriceDisplay` is null for blends.** That is a decision, not missing
  data. A price per milligram of a four-molecule mixture is meaningless. Render
  the component table in its place.
- **Never sort, rank, filter or badge the catalogue by unit price.** Per-mg
  compares within a compound only. NAD+ at $0.075/mg beside Semax at $6.00/mg
  says nothing about value, and a "best value" affordance built on it would
  mislead. Sort by `sortOrder`.
- **`pending` must show its expected month and must not look comfortable.** It
  carries the line "This product ships with no published assay until then." If
  that state reads as tidy, the published figures stop meaning anything.
- **Stock levels are not exposed.** `shop_inventory` is not publicly readable.
- Every numeric — purity, mg, price, lot code, date — renders in JetBrains Mono.
- Accent teal is `#1A8A9E`, deliberately deeper than the Tigris family teal.
```

- [x] **Step 2: Verify neither artifact leaks a report code**

```bash
grep -nE 'XAKRSW4WN85N|D14D7EHWHFH9|MDTR34NN18JH|UZMJ2BZU2N7V|9XKFJS7PIVZL|MKF4CLBUWS7F|VJUDHK6MDGT3'   docs/shop-sample-payload.json docs/BACKEND-CONTRACT.md && echo 'LEAK' || echo 'clean'
```

Expected: `clean`.

- [x] **Step 3: Verify the payload matches the catalogue it claims to sample**

```bash
node -e "
const p=require('./docs/shop-sample-payload.json');
const slugs=p.products.map(x=>x.slug).sort();
console.log(p.products.length, 'products');
console.log('null unit price:', p.products.filter(x=>x.unitPriceDisplay===null).map(x=>x.slug));
console.log('pending:', p.products.filter(x=>x.lot.assayState==='pending').map(x=>x.slug));
console.log('with history:', p.products.filter(x=>x.lotHistory.length>1).map(x=>x.slug));
"
```

Expected: 7 products · null unit price `[ 'klow-80mg' ]` · pending
`[ 'vip-5mg', 'selank-5mg', 'semax-5mg', 'nad-1000mg' ]` · with history
`[ 'glp-3-30mg' ]`.

- [x] **Step 4: Commit**

```bash
git add docs/BACKEND-CONTRACT.md docs/shop-sample-payload.json
git commit -m "docs(shop): frontend contract and real sample payload"
```

---

## What this plan does not build

**Any storefront UI.** No `/shop` route, no components, no pages. That is Claude
Design's work, built against Task 5's contract and payload.

Cart · checkout · BTCPay · Zelle · orders · `order_items` · the admin queue ·
inventory display. All of it lands in a second plan, which is blocked on spec §10
items 4 and 5 (shop entity, business bank account, refund policy) — none of which
are code.

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

---

## Execution record — 2026-09-04

All five tasks complete. 129 tests passing (was 101), `tsc --noEmit` clean.

**One deviation, in Task 1.** The plan deferred the slug leak to a follow-up,
which contradicted this plan's own first global constraint — "not as a field,
**not embedded in a slug**". Removing the field while leaving every slug ending
in its own report code would have been worse than not starting, because the
field's absence made it look handled. Checked first that nothing resolves label
artwork by slug (identity and test messages only) and that `peptides.json` is
never imported by the app, then stripped the codes from slugs and rekeyed
`REPORT_CODES` by lot. The label generator is untouched and the SVGs keep their
original filenames.

`vial-reports.test.ts` now serializes `VIALS` and asserts no code appears in it,
so a slug that embeds one again fails loudly rather than quietly.

**Still open, all Karim's:** real `assayExpectedAt` dates; lot codes for the four
pending batches (they have no recall path without them); the printed labels'
DataMatrix; applying `shop_schema.sql` and `shop_seed.sql`; and the shop entity
and bank account that block the checkout plan.
