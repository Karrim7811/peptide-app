-- ============================================================
-- PeptideTracker Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- stack_items
-- ============================================================
create table if not exists public.stack_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('peptide','medication','supplement')),
  dose text default '',
  unit text default '',
  notes text default '',
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.stack_items enable row level security;

create policy "Users manage own stack"
  on public.stack_items for all
  using (auth.uid() = user_id);

-- ============================================================
-- reminders
-- ============================================================
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stack_item_id uuid references public.stack_items(id) on delete cascade not null,
  time time not null,
  days_of_week integer[] not null,
  dose text default '',
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.reminders enable row level security;

create policy "Users manage own reminders"
  on public.reminders for all
  using (auth.uid() = user_id);

-- ============================================================
-- dose_logs
-- ============================================================
create table if not exists public.dose_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stack_item_id uuid references public.stack_items(id) on delete cascade not null,
  taken_at timestamptz default now() not null,
  dose text default '',
  notes text default '',
  created_at timestamptz default now() not null
);

alter table public.dose_logs enable row level security;

create policy "Users manage own logs"
  on public.dose_logs for all
  using (auth.uid() = user_id);

-- ============================================================
-- inventory
-- ============================================================
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  unit text not null,
  vial_size numeric(10,2) not null,
  quantity_remaining numeric(10,2) not null,
  expiry_date text,
  notes text default '',
  created_at timestamptz default now() not null
);

alter table public.inventory enable row level security;

create policy "Users manage own inventory"
  on public.inventory for all
  using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on new user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_tier text;
begin
  select tier into v_tier
  from public.pro_whitelist
  where lower(email) = lower(new.email)
  limit 1;

  if v_tier is null then
    v_tier := 'free';
  end if;

  insert into public.profiles (id, email, subscription_tier)
  values (new.id, new.email, v_tier);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
