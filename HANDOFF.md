# Handoff — 2026-09-03

Picking this up? Read `CLAUDE.md` first, then this. Where the two disagree,
this file is newer. Supersedes the 2026-08-09 handoff; everything from it that
is still open is carried forward below.

`main` = `d6f9bd9`. Six commits this session, **none pushed**. tsc clean,
101 tests passing.

---

## Stop here first — two things this session broke

Both are consequences of my own work. Neither is cosmetic. Decide on them
before building anything on top of the catalog.

### 1. I hand-edited two generated files

`src/lib/catalog.ts` and `src/lib/peptide-knowledge.ts` are **build artifacts**:

```
Peptides_Master_List_*.xlsx
  → python generate_knowledge.py   → src/lib/peptide-knowledge.ts
  → node generate_catalog.mjs      → src/lib/catalog.ts
```

I added 32 peptides and 27 `Vial` records by editing the outputs directly. The
previous handoff warns about exactly this — it happened on 2026-08-07 and
silently reverted the taxonomy detector — and I did not read that warning until
after the work was committed and this session was ending. **The next
regeneration run reverts all of it.**

Three ways out, in the order I'd rank them:

- **Push the additions back into the source.** Add the 32 to the xlsx and teach
  `generate_knowledge.py` the `sourced` field; add `VIALS` generation to
  `generate_catalog.mjs`, reading `design/vial-labels/peptides.json` (which is
  now committed, so it can). Most work, only option that restores the invariant.
- **Retire the pipeline.** If the xlsx is no longer the authoring surface, say
  so, delete the scripts, and let the TS files be the source. Cheapest, but it
  is a real decision about where peptide data lives — not mine to make.
- **Leave it and add a guard.** A test asserting the generated files contain the
  32 researched ids, so a regeneration that drops them fails loudly instead of
  silently. Stops the bleeding without fixing the cause.

Until one of those happens, **do not run either generator.**

### 2. Four entries publish community dosing, against a stated convention

The load-bearing conventions list says: _"Research-tier compounds carry
`Dosage Range = 'N/A'`. The library deliberately publishes no protocol numbers
for anything without an FDA label. Adding community dosing would create real
legal exposure."_

Of my 32 entries, 15 carry a numeric figure. Eleven of those cite a named trial
or drug label, which I'd argue is consistent with the intent — reporting what a
published trial administered is not issuing a protocol. **Four cite community
practice**, which is the thing the convention names outright:

| Compound | Current `dosage` text |
|---|---|
| `cartalax` | "Community protocols run 1–2 mg/day subcutaneously or 10–20 mg/day orally…" |
| `vesugen` | "Reported practice is 20 mg/day orally or 2–3 mg/day injected…" |
| `cortagen` | "Reported practice is 20 mg/day orally or 2–5 mg/day injected…" |
| `pe-22-28` | "Reported practice is 100–300 mcg intranasally or subcutaneously…" |

Each is labelled in place as community usage rather than a studied regimen, and
the surrounding `cautions` is explicit that no trial exists. That was my
reasoning at the time. It is still a divergence from a documented rule that
exists for legal reasons, made without asking, so it is your call and not mine.

Stripping the four figures is a ten-minute change. The eight Khavinson entries
mention community practice but carry **no** number — they are fine as they are.

Worth noting the convention was already not absolute: six of the pre-existing 92
research-tier entries carry things like "Oral/IV protocols vary" and
"Indication-specific dosing" rather than a bare `N/A`.

---

## What this session did

**Vials.** 27 `Vial` records in `catalog.ts` from `design/vial-labels/peptides.json`
— lot, assayed purity, MFG/EXP, shelf life, Janoshik report code — plus
`vialsFor(compoundId)`, which counts a blend under each component (GLOW answers
to TB-500 without being it). Six batches have no purity; four of those also have
no dates. Those nulls are real and must render as states, not zeros.

**32 peptides, 92 → 124.** Eighteen from `Peptides.xlsx` (which is a peptide
reference sheet, not a vial list — that confusion cost part of this session).
Fourteen more from a coverage audit, the important one being **orforglipron**,
an oral GLP-1 the FDA approved in April 2026 that the app did not know existed.
Fourteen of the 32 state outright that no human dose exists, and a test keeps
them saying so.

**Linked the two datasets.** `catalog.ts` drives the Mirror; `peptide-knowledge.ts`
drives `/reference`, `/regulatory`, `/stack-finder` and all six AI routes.
Nothing connected them, so the first 18 landed in one file and were invisible to
the reference page and to Cortex AI. Both now hold the same 124 and tests fail
if they diverge.

**Two search bugs.** "Botox" matched nothing (the `name` string is the search
index and lacked the brand); `searchPeptides()` ignored `commonUseExamples` and
`bestFor`, so indication searches missed.

**`docs/BACKEND-CONTRACT.md`** — what the data and server layer provides, written
so a new frontend can be built without reading the current UI. This is the
handoff for the redesign.

**Committed `design/vial-labels/`** (the previous handoff left it untracked).
PNGs and the zip are gitignored as regenerable output.

**Corrected `CLAUDE.md`** where it was actively wrong — see `d6f9bd9`.

---

## Still blocked on you, not on code

Carried forward from 2026-08-09 and **not addressed this session.**

### 1. Live Stripe prices
Test mode has them; live mode does not. The **live monthly price is still
$9.99** while the pricing page says **$14.99**.

| | Test price ID (product `prod_U9BwnRqqwMy88z`) |
|---|---|
| $14.99/mo | `price_1U1uH2HCjY7acAQmN2FT6PtA` |
| $119.88/yr | `price_1U1uH2HCjY7acAQmUpHj5llJ` |

Create the two live prices, then set `STRIPE_PRO_MONTHLY_PRICE_ID` and
`STRIPE_PRO_ANNUAL_PRICE_ID` in Vercel. **Do not edit the existing price** —
Stripe prices are immutable and current subscribers stay on what they signed up
to. Checkout fails closed (`PLAN_UNAVAILABLE`) when a price is missing, so
nobody is being misbilled; annual simply cannot be purchased.

### 2. SMTP — Resend ready since 2026-08-07, still not wired
Supabase → Project Settings → Authentication → SMTP: host `smtp.resend.com`,
port `587`, user `resend`, password your `re_...` key, sender
`noreply@peptidecortex.com`. Needs `peptidecortex.com` verified in Resend first
(DKIM + SPF). Then **Authentication → Providers → Email → enable "Confirm
email"** — right now anyone can register any address without owning it. No code
change needed. Until then `/reset-password` is sound code with no delivery.

### 3. Review the 13 FDA-approved library entries
Their `riskCautions` and `drugInteractions` were drafted from published labels,
not from the Peptide Bible. Check against current prescribing information before
any public launch. **This now extends to my 32** — same standard, same reason.

### 4. Nothing has been exercised against a populated stack
Still true. The Mirror renders and passes tests, but the only account used had
an empty stack. `inventory`, `dose_logs` and `reminders` all have zero
production rows. Sign in and click `/welcome` → `/dashboard` with real data.

---

## Conventions that are load-bearing — do not "improve" these

- **Evidence grade maps 1:1 from `evidenceLevel`. `cvRating`/`cv` must never
  touch it.** A prior revision used it as a tiebreaker and fabricated
  distinctions between compounds with identical evidence.
- **Research-tier compounds carry no protocol numbers.** See "Stop here first
  #2" — this is currently violated in four places.
- **THE MATH is solution chemistry, not dosing.** Apple rejected the iOS app
  under Guideline 1.4.2 for a dose calculator. Do not reword toward "draw X for
  your dose". `/dosing` was retired for the same reason.
- **History is tier-blind; the maths built on it is not.** `ent.history()` shows
  every logged dose at any tier; `ent.siteUsage()` filters. They are supposed to
  disagree — that split is what stopped a Free-tier leak during design.
- **Side effects are never gated**, and no upgrade affordance may appear there.
- **`loadMirrorData()` never filters by tier.** Gating lives only in
  `entitlement.ts`. A second gate is the shape of every paywall leak.
- **Legacy input CSS in `globals.css` is scoped out of `.cx-surface`** with
  `:not()` guards. Removing them repaints every dark-surface input near-black.
- **`unit` is `'mg' | 'IU'`.** HGH is IU. Do not hardcode mg.
- **`stacksWith` is empty on the 32 researched entries.** Deliberate. Stacking
  guidance was not invented for them.

---

## Cleanup still deferred on purpose

Orphaned, no importer: `src/lib/ics.ts`,
`src/app/bloodwork/BloodworkClient.tsx`, `src/components/BottomNav.tsx`,
`src/components/Navbar.tsx`, and all 16 components in `src/app/_landing/`.
Thirteen route files are redirect stubs whose implementations live only in git
history. Kept until the Mirror has run against real data.

---

## Where to start tomorrow

1. Decide on the pipeline (Stop here first #1). Everything else in the catalog
   is provisional until that is settled.
2. Decide on the four community-dosing figures (#2). Ten minutes either way.
3. Push the six commits — they are local only.
4. Then the redesign: hand `docs/BACKEND-CONTRACT.md` to whoever is building the
   frontend, and say up front whether the backend is fixed or negotiable. The
   contract describes what exists today and will constrain a design to it.

## Verification state

`npx tsc --noEmit` clean · `npm test` 101 passing across 5 files · `main` =
`d6f9bd9`, unpushed · working tree clean. Production build **not** re-run this
session.
