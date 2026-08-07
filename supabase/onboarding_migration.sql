-- Onboarding — 2026-08-07
--
-- Three nullable columns on `profiles`. Additive only: no existing column is
-- altered or dropped, no existing row is rewritten, and every current query
-- keeps working untouched. The table holds real accounts, so nothing here
-- backfills or defaults into existing rows — they simply read NULL and are
-- treated as not-yet-onboarded.
--
-- `dob` already exists and is collected at signup, so age is derived rather
-- than stored again.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists experience_level text,
  add column if not exists onboarded_at timestamptz;

-- Constrained rather than free text so the copy that branches on it cannot
-- drift. NULL means "not answered", which is distinct from any level.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_experience_level_check'
  ) then
    alter table public.profiles
      add constraint profiles_experience_level_check
      check (experience_level is null or experience_level in ('new', 'some', 'experienced'));
  end if;
end $$;

comment on column public.profiles.display_name is
  'What the user asked to be called. Collected during onboarding.';
comment on column public.profiles.experience_level is
  'new | some | experienced. Tunes how much Cortex explains; never gates anything.';
comment on column public.profiles.onboarded_at is
  'Set when onboarding completes. NULL sends the user to /welcome on next load.';
