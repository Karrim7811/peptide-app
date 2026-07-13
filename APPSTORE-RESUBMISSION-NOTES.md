# App Store Resubmission — Session Notes (2026-07-11)

Status snapshot for the Guideline 2.1(a) rejection (submission a940a077, reviewed 2026-03-25).
Saved for a later session. File is intentionally **untracked** — commit or delete as you see fit.

## Where things stand

All three reported bugs are fixed and a new build is on TestFlight.

| Reviewer bug | Root cause | Resolution |
|---|---|---|
| Apple Sign-In error | Reviewed build predated the nonce fix (`03880ea`) | Apple button removed entirely (`5848366`, Mar 31). Email/password only — compliant with 4.8. |
| Google login failed | Same-era build | Google sign-in removed entirely. |
| No verification email | Supabase built-in mailer never delivered to reviewer (`nathannorth2005@gmail.com`, Mar 25 — confirmation sent, never received). Email confirmation was disabled in Supabase that day, but iOS still showed "Check your email". | `4627dba` on main: signup is now session-aware — auto-confirm returns a session and the app signs the user straight in. "Check your email" only shows if confirmation is genuinely pending. |

## Shipped this session

- **Commit `4627dba` (main)** — iOS signup: session-aware flow + DOB DatePicker with client-side 18+ validation, `dob` passed in auth metadata (parity with web, decision 16.10). Files: `SupabaseService.swift`, `AuthViewModel.swift`, `SignupView.swift`.
- **CI run 29159105705**: green — compiled, signed, **uploaded to TestFlight**. (The May 24/27 runs had failed on `REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`; that Apple agreement is evidently signed now.)
- **Live Supabase (`uvpmrjsgaekejjofgtup`) migrations applied** (they existed in the repo but had never been run in prod):
  - `profile_dob_18_plus_gate` — adds `profiles.dob`, hard 18+/DOB-required gate in `handle_new_user()`.
  - `create_pro_whitelist_table` — `pro_whitelist` didn't exist in prod; the new trigger crashed without it (caught by live end-to-end test).
- **Verified against the live auth API**: adult signup → instant session + correct profile row; under-18 and missing-DOB → rejected by DB. Test accounts deleted.

## Update 2026-07-13 — iPhone-only

Commit `7b13959` (main): `TARGETED_DEVICE_FAMILY = "1"` + iPad orientation keys
removed. iPads now run the app in iPhone-compatibility mode; there is no iPad
UI surface for review (the rejection device was an iPad Pro 11" M4). Decision:
iPad users are served by peptidecortex.com; device-family support can be added
later but never removed, so this had to ship before first approval.
New build: CI run 29257735646 → TestFlight. **Supersedes run 29159105705** —
submit only the newer build. Demo-account password confirmed in hand.

## To do before resubmitting (Karim, in App Store Connect)

1. Submit **only the build from run 29257735646** (iPhone-only + DOB gate; all older binaries fail signup — DB requires DOB — and are universal).
2. Review notes: demo account `review@tigristechlabs.com` — password confirmed (2026-07-13).
3. Set age rating to 17+/18+ to match the DOB gate.
4. ~~iPad sanity-pass~~ — no longer applicable; app is iPhone-only. A quick launch in iPad compatibility mode on a simulator is optional peace of mind.

## Open items found along the way

- **`peptidecortex.com/signup` returns 404** — custom domain isn't serving the app; `peptide-app-nine.vercel.app` works. Fix domain attachment in Vercel before launch.
- **`pro_whitelist` is empty** — `admin_access.sql` emails are placeholders. `karimnp@gmail.com`, Demir, Eddie are all `free` tier; add rows when decided.
- **Email long-term**: confirmation is disabled (fine for review/launch). If ever re-enabled, set up real SMTP (e.g. Resend) first — the built-in sender is what burned the reviewer.
- CLAUDE.md §10/§13 schema-drift notes are partially stale now: `dob` and `pro_whitelist` are live in prod; `cycles` / `injection_sites` / `research_notes` / `side_effects` drift still unaudited.
