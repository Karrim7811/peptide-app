-- Tenant Portal schema
-- Run this against the DEDICATED tenant-portal Supabase project (not Peptide Cortex).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- The landlord creates tenant records (via /admin) keyed by email. When a user
-- signs up with a matching email, the trigger below links user_id.
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  full_name text not null,
  unit text not null,
  monthly_rent_cents integer not null check (monthly_rent_cents > 0),
  -- Day of month rent is due. Capped at 28 so every month has the date.
  rent_due_day integer not null default 1 check (rent_due_day between 1 and 28),
  active boolean not null default true,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount_cents integer not null,
  period text not null, -- rent month, 'YYYY-MM'
  -- 'processing' covers ACH payments that complete asynchronously.
  status text not null default 'processing' check (status in ('processing', 'succeeded', 'failed')),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- At most one successful rent payment per tenant per month.
create unique index if not exists payments_tenant_period_succeeded
  on public.payments (tenant_id, period)
  where status = 'succeeded';

create index if not exists payments_tenant_created
  on public.payments (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Tenants can read their own record and their own payments. All writes go
-- through the service role (admin API routes + Stripe webhook), so no
-- insert/update/delete policies are defined.

alter table public.tenants enable row level security;
alter table public.payments enable row level security;

create policy "Tenants can view own record"
  on public.tenants for select
  using (auth.uid() = user_id);

create policy "Tenants can view own payments"
  on public.payments for select
  using (tenant_id in (select id from public.tenants where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Triggers: link auth users to tenant records by email, in both directions
-- ---------------------------------------------------------------------------

-- Tenant signs up AFTER the landlord added their record.
create or replace function public.link_tenant_on_signup()
returns trigger as $$
begin
  update public.tenants
     set user_id = new.id
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_link_tenant on auth.users;
create trigger on_auth_user_created_link_tenant
  after insert on auth.users
  for each row execute procedure public.link_tenant_on_signup();

-- Landlord adds the tenant record AFTER the tenant already signed up.
create or replace function public.link_user_on_tenant_insert()
returns trigger as $$
begin
  if new.user_id is null then
    select id into new.user_id
      from auth.users
     where lower(email) = lower(new.email)
     limit 1;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_tenant_created_link_user on public.tenants;
create trigger on_tenant_created_link_user
  before insert on public.tenants
  for each row execute procedure public.link_user_on_tenant_insert();
