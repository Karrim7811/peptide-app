-- ============================================================
-- Profile DOB + 18+ enforcement
-- Run this in your Supabase SQL editor.
-- ============================================================
-- Adds a date-of-birth column to profiles, backs the signup flow's
-- 18+ requirement at the database layer (so a malformed client cannot
-- bypass it), and updates handle_new_user() to copy DOB from the
-- auth signup metadata into profiles.

-- 1. Add DOB column to profiles
alter table public.profiles
  add column if not exists dob date;

-- 2. Update the signup trigger to read DOB from auth user_metadata
--    and to refuse the insert if the user is under 18 or DOB is missing.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_tier text;
  v_dob date;
begin
  -- DOB must be present in the signup metadata.
  v_dob := nullif(new.raw_user_meta_data->>'dob', '')::date;
  if v_dob is null then
    raise exception 'Date of birth is required'
      using errcode = '22023';
  end if;

  -- Hard 18+ gate.
  if v_dob > (current_date - interval '18 years')::date then
    raise exception 'You must be 18 or older to use Peptide Cortex'
      using errcode = '22023';
  end if;

  -- Tier comes from the founder whitelist; default 'free'.
  select tier into v_tier
  from public.pro_whitelist
  where lower(email) = lower(new.email)
  limit 1;

  if v_tier is null then
    v_tier := 'free';
  end if;

  insert into public.profiles (id, email, subscription_tier, dob)
  values (new.id, new.email, v_tier, v_dob);

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger (no-op if unchanged)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
