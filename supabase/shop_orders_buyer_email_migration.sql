-- Store the buyer's email on the order.
--
-- Apply after shop_orders_schema.sql. Idempotent; safe to re-run.
--
-- ── Why the order carries it rather than reading auth.users ────────────────
--
-- A receipt has to be reproducible from the order alone. Reading the address
-- from auth.users at send time means a customer who changes their account email
-- silently changes where a two-month-old order's receipt would go, and it makes
-- the record of "who was told what, at what address" depend on a mutable row in
-- another table. For a shop where the recall path is the whole argument, that is
-- the wrong trade.
--
-- Nullable on purpose. Orders created before this column existed have no value
-- to backfill that would be true, and inventing one would be worse than a null
-- that reads as "we do not know". The send path treats null as "no receipt",
-- never as a reason to fail.
--
-- Not unique, not an FK. One person may order twice, and the address is a
-- snapshot of what they used then, not a live pointer at an account.

alter table public.shop_orders
  add column if not exists buyer_email text;

comment on column public.shop_orders.buyer_email is
  'Snapshot of the address the receipt was sent to, taken at order time. Null for orders placed before the column existed, or where no address was known. Never read auth.users instead — a receipt must be reproducible from the order alone.';
