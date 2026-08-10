# Handoff — 2026-08-09

Picking this up? Read `CLAUDE.md` first, then this. Where the two disagree,
this file is newer.

The Mirror redesign is **merged to `main` and pushed** (`6a09f71`). Nothing is
half-finished in the code; everything below is either an operational step that
needs your dashboard access, or something built but never watched working.

---

## Stop here first

**Nothing in the app has been exercised against a populated stack.** The Mirror
renders, typechecks and passes tests, but the only account used to look at it
had an empty stack. The single highest-value next action is to sign in and click
through `/welcome` → `/dashboard` with real data.

That one pass exercises: onboarding writes, the RLS policy and column grants
added on 2026-08-07, the live read mapping, the seeded field, the tier logic on
a Pro account, and the layer 2/3 geometry with actual nodes.

---

## Blocked on you, not on code

### 1. Live Stripe prices
Test mode has them; **live mode does not**.

| | Test price ID (product `prod_U9BwnRqqwMy88z`) |
|---|---|
| $14.99/mo | `price_1U1uH2HCjY7acAQmN2FT6PtA` |
| $119.88/yr | `price_1U1uH2HCjY7acAQmUpHj5llJ` |

The **live** monthly price is still **$9.99** while the pricing page says
**$14.99**. Create the two live prices, then set `STRIPE_PRO_MONTHLY_PRICE_ID`
and `STRIPE_PRO_ANNUAL_PRICE_ID` in Vercel.

**Do not edit the existing price.** Stripe prices are immutable and current
subscribers stay on whatever they signed up to. Create new ones alongside.

Checkout **fails closed** (`PLAN_UNAVAILABLE`) when a price is missing, so
nobody is being misbilled in the meantime — annual simply cannot be purchased.

Local checkout also needs `STRIPE_SECRET_KEY` (`sk_test_...`) in `.env.local`;
there is a commented line waiting for it.

### 2. SMTP — Resend was ready as of 2026-08-07 but is not wired
Supabase → Project Settings → Authentication → SMTP Settings:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | your Resend `re_...` API key |
| Sender | `noreply@peptidecortex.com` |

Requires `peptidecortex.com` verified in Resend first (DKIM + SPF in DNS).

Then **Authentication → Providers → Email → enable "Confirm email".** Right now
anyone can register any address without proving they own it. The signup code
already branches on whether Supabase returns a session, so enabling it needs no
code change — signup will simply go back to the "check your email" screen.

Until SMTP exists, `/reset-password` is sound code with no delivery behind it.

### 3. Review the 13 FDA-approved library entries
Their `riskCautions` and `drugInteractions` were drafted from published labels,
**not** from the Peptide Bible. Everything else in the library is your own prose.
Check them against current prescribing information before any public launch.

---

## Conventions that are load-bearing — do not "improve" these

- **Research-tier compounds carry `Dosage Range = 'N/A'`.** The library
  deliberately publishes no protocol numbers for anything without an FDA label.
  Adding community dosing would create real legal exposure.
- **Evidence grade maps 1:1 from `evidenceLevel`. `cvRating` must never touch
  it.** It is a cardiovascular score. A prior revision used it as a tiebreaker
  and fabricated distinctions.
- **THE MATH is framed as solution chemistry, not dosing.** Apple rejected the
  iOS app under Guideline 1.4.2 for a dose calculator. Do not reword it toward
  "draw X for your dose". `/dosing` was retired for the same reason.
- **History is tier-blind; the maths built on it is not.** `ent.history()` shows
  every logged dose at any tier; `ent.siteUsage()` filters. They are supposed to
  disagree.
- **Side effects are never gated**, and no upgrade affordance may appear in that
  tool.
- **Legacy input CSS in `globals.css` is scoped out of `.cx-surface`** with
  `:not()` guards. Removing them repaints every dark-surface input near-black —
  `input[type='email']` at (0,1,1) beats Tailwind's `.text-ink` at (0,1,0).

## Pipeline

Peptide data regenerates, it is not hand-edited:

```
Peptides_Master_List_*.xlsx
  → python generate_knowledge.py   → src/lib/peptide-knowledge.ts
  → node generate_catalog.mjs      → src/lib/catalog.ts
```

Editing `catalog.ts` directly means the next regeneration silently reverts it.
That happened on 2026-08-07 and reverted the taxonomy detector.

## Cleanup deferred on purpose

Orphaned, no importer: `src/lib/ics.ts`, `src/app/bloodwork/BloodworkClient.tsx`,
`src/components/BottomNav.tsx`, `src/components/Navbar.tsx`, and all 16
components in `src/app/_landing/`. Thirteen route files are redirect stubs whose
implementations live only in git history.

All of it is kept until the Mirror has run against real data — it is the
fallback if something turns out to be missing.

## Not committed

`design/vial-labels/` is untracked (pre-existing work, ~60 SVGs). Left alone
deliberately; commit it if you want it backed up.

## Verification state

tsc clean · 74 tests · production build compiles · `main` = `ada7c38`.
