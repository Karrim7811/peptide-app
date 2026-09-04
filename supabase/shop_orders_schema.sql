-- Shop orders — 2026-09-04
--
-- Money and fulfilment. The catalogue lives in shop_schema.sql; apply that one
-- first, since these tables reference it.
--
-- ── Two columns that carry more weight than they look like they do ─────────
--
-- order_items.unit_price_cents is a SNAPSHOT taken when the order was placed.
-- Never render a historical order by joining to shop_products — a price change
-- would silently rewrite what a customer was charged, and you would discover it
-- during a dispute rather than before one.
--
-- order_items.lot_id is filled in at PACK time, not order time, because it
-- records the vial that physically left the shelf. It is the recall path: the
-- difference between notifying eleven customers and emailing the whole list.
-- Four launch batches currently have no lot code at all, so orders containing
-- them have no recall path until Karim supplies one.
--
-- ── Payment ───────────────────────────────────────────────────────────────
--
-- Two rails, neither of them Stripe. The subscription business runs on a Stripe
-- account that must never see a peptide sale: discovery there risks termination,
-- a 90–180 day reserve and MATCH-listing, which would take the working business
-- down with the new one. Nothing in this file touches it.
--
-- Zelle has no merchant API, so payment_reference is the only link between money
-- landing in a bank account and a row in this table. It is unique because a
-- human matches it by eye.

create type shop_order_status as enum (
  'awaiting_payment', 'paid', 'packed', 'shipped', 'delivered',
  'expired', 'refunded', 'cancelled'
);

create table if not exists public.shop_orders (
  id                 uuid primary key default gen_random_uuid(),
  -- restrict, not cascade: deleting a user must not silently destroy the record
  -- of what was shipped to them.
  user_id            uuid not null references auth.users(id) on delete restrict,
  status             shop_order_status not null default 'awaiting_payment',

  subtotal_cents     integer not null check (subtotal_cents >= 0),
  shipping_cents     integer not null default 0 check (shipping_cents >= 0),
  total_cents        integer not null check (total_cents >= 0),

  payment_provider   text not null check (payment_provider in ('btcpay', 'zelle')),
  -- The provider's own id for the charge. Null for Zelle, which has none.
  provider_ref       text,
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

  -- An order cannot be fulfilled without a record of when it was paid for.
  constraint paid_orders_know_when check (
    status not in ('paid', 'packed', 'shipped', 'delivered') or paid_at is not null
  ),
  constraint totals_add_up check (total_cents = subtotal_cents + shipping_cents),
  -- Zelle carries no provider reference; BTCPay always does once charged.
  constraint zelle_has_no_provider_ref check (
    payment_provider <> 'zelle' or provider_ref is null
  )
);

create index if not exists shop_orders_user_idx      on public.shop_orders(user_id);
create index if not exists shop_orders_status_idx    on public.shop_orders(status);
create index if not exists shop_orders_reference_idx on public.shop_orders(payment_reference);

create table if not exists public.shop_order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.shop_orders(id) on delete cascade,
  -- restrict: a product that has ever been ordered cannot be deleted out from
  -- under the order that references it.
  product_id        uuid not null references public.shop_products(id) on delete restrict,
  -- Null until packed. Then it is the lot that actually shipped.
  lot_id            uuid references public.shop_lots(id) on delete restrict,
  qty               integer not null check (qty > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  -- Denormalised so a historical order still renders correctly after a product
  -- is renamed, repriced or delisted.
  product_name      text not null,
  size_display      text not null
);

create index if not exists shop_order_items_order_idx on public.shop_order_items(order_id);
create index if not exists shop_order_items_lot_idx   on public.shop_order_items(lot_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- A customer reads their own orders and nothing else.
--
-- There are no insert or update policies at all, deliberately. Orders are
-- created by a server action and advanced by the BTCPay webhook or the admin
-- queue, all of which run under the service role. Without an update policy a
-- customer cannot mark their own order paid, which is the single most obvious
-- thing to try against a shop that accepts bank transfers.

alter table public.shop_orders      enable row level security;
alter table public.shop_order_items enable row level security;

drop policy if exists shop_orders_read_own on public.shop_orders;
create policy shop_orders_read_own on public.shop_orders
  for select using (auth.uid() = user_id);

drop policy if exists shop_order_items_read_own on public.shop_order_items;
create policy shop_order_items_read_own on public.shop_order_items
  for select using (
    exists (
      select 1 from public.shop_orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
