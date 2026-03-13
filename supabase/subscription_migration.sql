-- Run this in your Supabase SQL editor
-- Adds subscription fields to profiles and creates helper tables

-- 1. Add subscription columns to profiles
alter table public.profiles
  add column if not exists subscription_tier text default 'free'
    check (subscription_tier in ('free', 'pro', 'lifetime')),
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists stripe_customer_id text;

-- 2. Create subscription events audit table
create table if not exists public.subscription_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  tier text not null,
  provider text not null,
  provider_event_id text,
  created_at timestamptz default now() not null
);

-- Enable RLS on subscription_events
alter table public.subscription_events enable row level security;

-- Only admins (service role) can write; users can read their own
create policy "Users can view own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- 3. Create interaction_checks table for rate limiting
create table if not exists public.interaction_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_a text not null,
  item_b text not null,
  created_at timestamptz default now() not null
);

alter table public.interaction_checks enable row level security;

create policy "Users can view own checks"
  on public.interaction_checks for select
  using (auth.uid() = user_id);

create policy "Users can insert own checks"
  on public.interaction_checks for insert
  with check (auth.uid() = user_id);

-- 4. Index for fast daily count queries
create index if not exists interaction_checks_user_date_idx
  on public.interaction_checks (user_id, created_at);

-- 5. Grant service role access to update profiles (for webhook)
-- This is handled automatically by Supabase service role key
