-- Mirror schema reconciliation — 2026-08-06
--
-- These four tables have existed in the live project (peptide-tracker,
-- uvpmrjsgaekejjofgtup) since the pages that write to them shipped, but their
-- DDL was never written back into this repo. That is the schema/code drift
-- flagged as issue #1 in CLAUDE.md §13.
--
-- The DDL below was captured by READ-ONLY introspection of the live project on
-- 2026-08-06, not authored from scratch. All four tables were EMPTY (0 rows) at
-- capture time, so nothing here risks customer data.
--
-- IF-NOT-EXISTS throughout: this file documents what is already there. Running
-- it against the live project should be a no-op. It exists so the repo stops
-- lying about its own schema.
--
-- ── Two shape mismatches the Mirror has to bridge ──────────────────────────
--
-- 1. `cycles` does NOT carry the design's cycle object. The handoff's CYCLE is
--    { day, length, start, washout, adherence, onTime }; the live table stores
--    { name, start_date, peptide_names[], on_weeks, off_weeks, status, notes }.
--    Everything the Mirror displays must therefore be DERIVED:
--        day      = today - start_date
--        length   = on_weeks * 7
--        washout  = start_date + (on_weeks * 7 days)
--        adherence / onTime = computed from dose_logs, never stored
--    That last one is the derive-don't-store rule arriving for free — there is
--    no adherence column to leak.
--
-- 2. `injection_sites` is an injection LOG, not site geometry. The handoff
--    README says "SITES -> injection_sites (geometry only)", but the live table
--    has no x/y at all — it stores one row per injection (site, peptide_name,
--    logged_at). The body-map coordinates are static app-side constants
--    (SITES in src/lib/catalog.ts); usage counts derive from these rows.
--
-- ── Two pre-existing oddities, documented not fixed ────────────────────────
--
-- * `inventory` carries BOTH `vial_size_mg` and `vial_size`. Almost certainly a
--   legacy duplicate. Not touched here — dropping a column is a §15 ask-first
--   change and the Mirror does not read either.
--
-- * Foreign-key targets are inconsistent across the schema: the original tables
--   (stack_items, dose_logs, reminders, bloodwork_results) reference
--   public.profiles(id), while these four reference auth.users(id) directly.
--   Both work because profiles.id is itself auth.users(id). Left as found;
--   normalising it would rewrite constraints on tables holding real rows.

-- ── cycles ─────────────────────────────────────────────────────────────────
create table if not exists public.cycles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  start_date    date not null,
  peptide_names text[] default '{}'::text[],
  on_weeks      integer not null default 8,
  off_weeks     integer not null default 4,
  status        text not null default 'on',
  notes         text default ''::text,
  created_at    timestamptz not null default now()
);

-- ── injection_sites ────────────────────────────────────────────────────────
-- One row per injection. See note 2 above: this is a log, not geometry.
create table if not exists public.injection_sites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  site         text not null,
  peptide_name text default ''::text,
  notes        text default ''::text,
  logged_at    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- ── research_notes ─────────────────────────────────────────────────────────
create table if not exists public.research_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  peptide_name text not null,
  note         text not null,
  url          text default ''::text,
  created_at   timestamptz not null default now()
);

-- ── side_effects ───────────────────────────────────────────────────────────
create table if not exists public.side_effects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  peptide_name text not null,
  effect       text not null,
  severity     integer not null default 3,
  notes        text default ''::text,
  logged_at    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- ── Row level security ─────────────────────────────────────────────────────
-- RLS is already ENABLED on all four in the live project. The policy bodies
-- were not captured by the introspection used to build this file, so the
-- policies below restate the own-row pattern the rest of the schema uses
-- (see schema.sql). VERIFY against the live policies before treating this
-- section as authoritative — it is the one part of this file that is inferred
-- rather than observed.

alter table public.cycles           enable row level security;
alter table public.injection_sites  enable row level security;
alter table public.research_notes   enable row level security;
alter table public.side_effects     enable row level security;

-- CREATE POLICY has no IF NOT EXISTS in Postgres, so guard on pg_policies.
do $$
declare
  t text;
  policy_name text;
begin
  foreach t in array array['cycles', 'injection_sites', 'research_notes', 'side_effects']
  loop
    policy_name := format('Users manage own %s', t);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = policy_name
    ) then
      execute format(
        'create policy %I on public.%I
           for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
        policy_name, t
      );
    end if;
  end loop;
end $$;

-- ── Indexes ────────────────────────────────────────────────────────────────
-- The Mirror reads these per-user and orders by time; without these the
-- Ledger and rotation tabs sequential-scan once a user has real history.
create index if not exists cycles_user_id_idx          on public.cycles (user_id);
create index if not exists injection_sites_user_id_idx on public.injection_sites (user_id, logged_at desc);
create index if not exists research_notes_user_id_idx  on public.research_notes (user_id, created_at desc);
create index if not exists side_effects_user_id_idx    on public.side_effects (user_id, logged_at desc);
