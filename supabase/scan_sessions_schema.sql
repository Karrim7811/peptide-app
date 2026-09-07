-- Phone hand-off for the vial scanner — 2026-09-07
--
-- A row here is a short-lived bearer credential. Someone holding the token can
-- upload one photograph and spend one Claude vision call as the user who
-- created it, without signing in on the phone. That is the entire point of the
-- feature and also its whole risk surface, so the constraints matter more than
-- the columns do.
--
-- ── What bounds the damage ────────────────────────────────────────────────
--
--   token       256 bits of base64url. Not guessable, and never derived from
--               the user id or anything else the holder could reconstruct.
--   expires_at  Minutes, not hours. A QR photographed off someone's screen is
--               useless by the time they have walked away with it.
--   consumed_at Single use. The second upload against a token is refused even
--               inside the window, so a leaked token costs at most one call.
--   No read of anything else. The phone page is given a token and nothing
--               about the account behind it — not the email, not the stack.
--               A stolen token cannot be turned into a look at someone's bench.
--
-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- The owner may read their own rows so the desktop can poll for a result.
-- There are no insert or update policies at all: creating a session and
-- writing a result both happen server-side under the service role, because the
-- phone has no session to authorise with and must never be able to write a row
-- claiming to be someone.

create table if not exists public.scan_sessions (
  -- The token IS the primary key. There is no separate id to leak.
  token        text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  -- Set the moment an upload is accepted, before the vision call is made, so a
  -- slow call cannot be raced with a second upload.
  consumed_at  timestamptz,
  -- The readings, once there are any. Never the image — it is read and dropped.
  result       jsonb,
  -- Set when the vision call fails, so the desktop can stop waiting and say why.
  failed_at    timestamptz,

  constraint token_is_long_enough check (length(token) >= 32),
  constraint window_is_bounded check (expires_at > created_at and expires_at < created_at + interval '1 hour')
);

create index if not exists scan_sessions_user_idx on public.scan_sessions(user_id);
create index if not exists scan_sessions_expiry_idx on public.scan_sessions(expires_at);

alter table public.scan_sessions enable row level security;

drop policy if exists scan_sessions_read_own on public.scan_sessions;
create policy scan_sessions_read_own on public.scan_sessions
  for select using (auth.uid() = user_id);
