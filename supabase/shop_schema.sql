-- Shop catalogue — 2026-09-04
--
-- Products and lots for the direct-sales storefront. Orders, order_items and
-- payment records are NOT here; they arrive with the checkout migration, which
-- is blocked on the shop entity and business bank account existing.
--
-- ── The one column that is deliberately absent ─────────────────────────────
--
-- There is no assay_report_code, and there must never be one. A Janoshik code
-- resolves to a public page naming the client, the manufacturer and a
-- supplier-prefixed batch number, so a code in a table the storefront reads is
-- a published supply chain. Codes live server-side in
-- src/lib/vial-reports.server.ts. Decision D3 in
-- docs/superpowers/specs/2026-09-04-peptide-shop-design.md.
--
-- ── Two things the checks encode ──────────────────────────────────────────
--
-- assay_state is an enum and never null. A missing assay is a state the page
-- renders — 'pending' with the month it is waiting for — not an absent number
-- that some later query can quietly treat as zero. The same rule the Mirror
-- already follows for unassayed vials.
--
-- assay_type splits purity from composition. A single compound is assayed for
-- purity and reports one percentage; a blend is assayed by composition and
-- reports milligrams per component with no single percentage to quote. KLOW is
-- why. A nullable purity column alone would have been a lie by omission.

create table if not exists public.shop_products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  -- Into the app catalog. Null for a blend or a non-peptide (KLOW, NAD+).
  compound_id  text,
  size_value   numeric not null check (size_value > 0),
  size_unit    text not null check (size_unit in ('mg', 'IU')),
  price_cents  integer not null check (price_cents >= 0),
  blend_of     text[],
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),

  -- A product is one compound or a blend, never both and never neither.
  constraint one_compound_or_a_blend
    check ((compound_id is null) <> (blend_of is null))
);

create table if not exists public.shop_lots (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.shop_products(id) on delete cascade,
  -- Nullable: a pending batch is physically real but may have no recorded code
  -- yet. Postgres permits many nulls under a unique constraint, which is what
  -- we want — and a null here means that batch has no recall path.
  lot_code           text unique,
  assay_state        text not null check (assay_state in ('assayed', 'pending', 'none')),
  assay_type         text not null check (assay_type in ('purity', 'composition')),
  purity_pct         numeric check (purity_pct is null or (purity_pct > 0 and purity_pct <= 100)),
  components         jsonb,
  label_mg           numeric not null check (label_mg > 0),
  measured_total_mg  numeric,
  -- YYYY-MM.
  assay_expected_at  text,
  mfg                text,
  exp                text,
  shelf_life         text,
  is_current         boolean not null default false,
  created_at         timestamptz not null default now(),

  constraint pending_names_the_month_it_waits_for
    check (assay_state <> 'pending' or assay_expected_at is not null),
  constraint pending_publishes_no_figure
    check (assay_state <> 'pending' or purity_pct is null),
  constraint assayed_purity_carries_a_figure
    check (assay_state <> 'assayed' or assay_type <> 'purity' or purity_pct is not null),
  constraint assayed_composition_carries_components
    check (assay_state <> 'assayed' or assay_type <> 'composition'
           or (components is not null and measured_total_mg is not null))
);

create index if not exists shop_lots_product_idx on public.shop_lots(product_id);

-- Exactly one current lot per product.
create unique index if not exists shop_lots_one_current_per_product
  on public.shop_lots(product_id) where is_current;

create table if not exists public.shop_inventory (
  lot_id        uuid primary key references public.shop_lots(id) on delete cascade,
  qty_on_hand   integer not null default 0 check (qty_on_hand >= 0),
  qty_reserved  integer not null default 0 check (qty_reserved >= 0),
  updated_at    timestamptz not null default now(),

  constraint cannot_reserve_more_than_is_held check (qty_reserved <= qty_on_hand)
);

-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- The catalogue is public: anyone can read products and lots without an
-- account, because the assay data IS the marketing. Writes have no policy at
-- all, so RLS denies them — the seed and any later catalogue change run under
-- the service role.

alter table public.shop_products  enable row level security;
alter table public.shop_lots      enable row level security;
alter table public.shop_inventory enable row level security;

drop policy if exists shop_products_public_read on public.shop_products;
create policy shop_products_public_read on public.shop_products for select using (true);

drop policy if exists shop_lots_public_read on public.shop_lots;
create policy shop_lots_public_read on public.shop_lots for select using (true);

-- shop_inventory gets NO read policy. Stock levels are commercially sensitive,
-- the storefront does not display them, and "3 left!" is the kind of urgency
-- tactic this brand is positioned against.
