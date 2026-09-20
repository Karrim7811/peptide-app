-- Local pickup — 2026-09-19
--
-- Apply after shop_orders_schema.sql. Karim asked for either a promo code or a
-- local pickup option, whichever was cheaper to build; this is that option.
--
-- Two changes, and the second is the one that matters.
--
--   1. 'pickup' joins the shipping_method check.
--   2. The four address columns become nullable — AND a new constraint makes
--      them mandatory for every method that is not pickup.
--
-- Step 2 without step 2's second half would be the actual risk here. Dropping
-- NOT NULL on ship_line1 in order to let one method omit it would also let a
-- bug write a postal order with no address, and the first anyone would know is
-- a parcel that cannot be labelled. The constraint below re-imposes exactly the
-- old rule for exactly the old methods, so the only row shape that gains the
-- right to be address-less is the one that is collected by hand.
--
-- ship_name stays NOT NULL. Somebody still has to be handed the box.
--
-- Shipping at zero cents is legitimate on this method and `totals_add_up`
-- already permits it: total = subtotal + 0. No money constraint changes here,
-- which is the whole reason pickup was the cheaper of the two asks.

alter table public.shop_orders
  drop constraint if exists shop_orders_shipping_method_check;

alter table public.shop_orders
  add constraint shop_orders_shipping_method_check
  check (shipping_method in ('standard', 'priority', 'overnight', 'pickup'));

alter table public.shop_orders alter column ship_line1  drop not null;
alter table public.shop_orders alter column ship_city   drop not null;
alter table public.shop_orders alter column ship_state  drop not null;
alter table public.shop_orders alter column ship_postal drop not null;

-- The rule the NOT NULLs used to carry, now stated once and scoped to the
-- methods it was ever true for. A posted order without a full address is
-- refused by the database, not merely discouraged by the server action.
alter table public.shop_orders
  drop constraint if exists posted_orders_have_an_address;

alter table public.shop_orders
  add constraint posted_orders_have_an_address check (
    shipping_method = 'pickup'
    or (
      ship_line1  is not null
      and ship_city   is not null
      and ship_state  is not null
      and ship_postal is not null
    )
  );

-- And the converse, so a collected order cannot quietly accumulate an address
-- nobody will ever post to. Without this, a half-updated checkout that keeps
-- sending the address fields would write a pickup row that reads, to anyone
-- packing it, exactly like a parcel to be mailed.
alter table public.shop_orders
  drop constraint if exists collected_orders_have_no_address;

alter table public.shop_orders
  add constraint collected_orders_have_no_address check (
    shipping_method <> 'pickup'
    or (
      ship_line1  is null
      and ship_line2  is null
      and ship_city   is null
      and ship_state  is null
      and ship_postal is null
    )
  );
