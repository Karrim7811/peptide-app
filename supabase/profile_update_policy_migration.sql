-- profiles UPDATE policy — 2026-08-07
--
-- `profiles` had RLS enabled with SELECT-own and INSERT-own policies but NO
-- UPDATE policy at all. Under RLS a missing policy is not an error — the write
-- simply matches zero rows and reports success. Two things were silently
-- broken by that:
--
--   1. Onboarding could never set `onboarded_at`, so the /dashboard gate would
--      bounce the user back to /welcome forever.
--
--   2. The Stripe webhook writes `subscription_tier` through the same
--      auth-scoped client (CLAUDE.md §13 issue #3). It has never been able to
--      write. A customer who paid stayed on `free`.
--
-- ── Why the policy alone is not enough ─────────────────────────────────────
-- A plain `for update using (auth.uid() = id)` lets a user update ANY column
-- of their own row — including `subscription_tier`. That is free Pro for
-- anyone who calls the REST endpoint directly with their own anon token.
--
-- RLS cannot restrict columns, so the column list is enforced with GRANTs:
-- `authenticated` may update only the fields a user legitimately owns.
-- Everything billing-related is withheld and stays writable only by
-- `service_role`, whose grants are untouched here.
--
-- NOTE: this does NOT by itself fix the Stripe webhook. The webhook must be
-- switched to a service-role client to write `subscription_tier` — it is
-- currently using the anon/cookie client and will still fail. Tracked
-- separately; this migration only stops the hole from being opened wider.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- Column-level grants. Revoke the blanket UPDATE, then re-grant only the
-- user-owned fields. `service_role` is unaffected and retains full access.
revoke update on public.profiles from authenticated;

grant update (display_name, experience_level, onboarded_at, dob)
  on public.profiles to authenticated;
