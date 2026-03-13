-- ============================================================
-- Admin / Founder Access Setup
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Create the pro whitelist table
create table if not exists public.pro_whitelist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  tier text default 'lifetime' check (tier in ('pro', 'lifetime')),
  note text,
  added_at timestamptz default now() not null
);

-- Only service role can read/write (no RLS exposure to users)
alter table public.pro_whitelist enable row level security;

-- 2. Update the signup trigger to grant lifetime access to whitelisted emails
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_tier text;
begin
  -- Check if this email is on the whitelist
  select tier into v_tier
  from public.pro_whitelist
  where lower(email) = lower(new.email)
  limit 1;

  -- Default to 'free' if not on whitelist
  if v_tier is null then
    v_tier := 'free';
  end if;

  insert into public.profiles (id, email, subscription_tier)
  values (new.id, new.email, v_tier);

  return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger (uses the updated function above)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 3. Add whitelisted users
-- FILL IN YOUR EMAIL AND THEIRS BELOW
-- ============================================================

insert into public.pro_whitelist (email, name, tier, note) values
  ('YOUR_EMAIL_HERE',          'Karim (founder)',      'lifetime', 'App owner'),
  ('DEMIR_EMAIL_HERE',         'Demir Tan',            'lifetime', 'Founding user'),
  ('EDDIE_EMAIL_HERE',         'Eddie Gonzalez Rubio', 'lifetime', 'Founding user')
on conflict (email) do update set tier = excluded.tier, name = excluded.name;


-- ============================================================
-- 4. Grant immediate Pro access to EXISTING accounts
-- (for users who already registered before this migration)
-- ============================================================

update public.profiles
set subscription_tier = 'lifetime'
where lower(email) in (
  'YOUR_EMAIL_HERE',
  'DEMIR_EMAIL_HERE',
  'EDDIE_EMAIL_HERE'
);


-- ============================================================
-- 5. Verify — run this to confirm it worked
-- ============================================================
-- select email, subscription_tier from public.profiles
-- where subscription_tier = 'lifetime';
