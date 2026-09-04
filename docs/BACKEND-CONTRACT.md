# Peptide Cortex — backend contract

What the data and server layer provides, so a new frontend can be built against
it without reading the existing UI. Nothing here describes how anything should
look; it describes what exists, what shape it is, and what it will refuse to do.

Verified against the tree at commit `87c57dc`. Where this document and the code
disagree, the code is right — and please fix this file.

> **CLAUDE.md is stale in two places.** §16.4 says pricing is $9.99/mo and a
> $99.99 lifetime; the code says $14.99/mo and $119.88/yr with a one-month
> trial, and lifetime stopped being sold on 2026-08-06. §13 says `cycles`,
> `injection_sites`, `research_notes` and `side_effects` are missing from the
> database; all four exist in production. Trust this file over CLAUDE.md on
> those two points, and the code over both.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 App Router, React 18, TypeScript 5 |
| Styling | Tailwind 3.4 |
| Data | Supabase — Postgres + Auth + RLS, via `@supabase/ssr` |
| AI | `@anthropic-ai/sdk`, `claude-opus-4-5` on most routes |
| Payments | Stripe |
| Tests | Vitest — `npm test` |

`middleware.ts` is deliberately inert (`matcher: ['/_never_match_this_route_']`).
There is no route-level auth. **Every page reads its own session.** A new
frontend must keep doing that or introduce middleware on purpose.

---

## 2. The two peptide datasets

There are two, they must stay identical in membership, and `src/lib/catalog.test.ts`
fails if they don't. Both currently hold **124 peptides**.

### `src/lib/catalog.ts` — the typed catalog

```ts
interface Compound {
  id: string                 // 'retatrutide' — the key used everywhere
  name: string               // 'Retatrutide'
  fullName: string           // 'Retatrutide (research)' — this is the SEARCH INDEX
  category: string           // 'Metabolic/Weight'
  catId: string              // 'metabolic-weight'
  purpose: string
  action: string             // mechanism
  effects: string
  dosage: string             // may state that no human dose exists — see §9
  cautions: string
  interactions: string
  bottomLine: string
  evidence: EvidenceLevel    // one of 5 exact strings
  grade: Grade               // 'A'|'B'|'C'|'D'|'—', derived 1:1 from evidence
  bars: number               // 0-4, presentational mirror of grade
  cv: number                 // 0-5 cardiovascular score. NEVER an evidence signal
  cvNotes: string
  stacksWith: string[]       // compound ids; empty on the 32 researched entries
  sourced?: 'researched'     // provenance; absent on the original 92
}
```

Exports: `COMPOUNDS` (id-keyed record), `COMPOUND_LIST`, `CATEGORIES` (12),
`CATEGORY_BY_ID`, `COUNTS` (`{compounds: 124, categories: 12, stack: 6, vials: 27}`),
`compound(id)`, `compoundsInCategory(catId)`, `sortByGrade()`, `gradeFor(evidence)`,
`taxonomyMismatch(entry)`, `assertGradeIntegrity()`.

**The grade rule is load-bearing.** `grade` maps one-to-one from `evidence` via
`EVIDENCE_TO_GRADE`, with no tiebreaker. `cv` must never influence it — an
earlier revision used `cv` as a tiebreaker and fabricated a distinction between
two compounds with identical evidence. `gradeFor()` is the only sanctioned
derivation and `assertGradeIntegrity()` proves it over all 124.

`taxonomyMismatch()` exists because the library disagrees with itself in places
(GHK-Cu is filed under GH Axis with a Skin/Hair purpose). It returns the
category the compound arguably belongs in, or null. Surfacing the contradiction
is the intended behaviour; do not silently "fix" it.

### `src/lib/catalog.ts` — vials

```ts
interface Vial {
  slug: string               // matches design/vial-labels/labels-*/<slug>.svg
  compoundId: string | null  // null for a blend
  label: string
  qty: number
  unit: 'mg' | 'IU'          // 26 are mg; HGH is IU. Do not hardcode mg
  purity: number | null      // assay %; null on 6 batches
  lot: string
  mfg: string | null         // 'YYYY-MM'; null on 4 batches
  exp: string | null         // travels with mfg — both null or both set
  shelfLife: string
  reportCode: string         // Janoshik report the label's DataMatrix resolves to
  blendOf?: string[]         // component compound ids, blends only
}
```

`VIALS` (27) and `vialsFor(compoundId)`, which returns direct holdings **and**
blends containing that compound. GLOW answers to `tb-500` without being TB-500 —
tell them apart by `blendOf`.

Six vials have `purity: null`; four of those also have `mfg`/`exp` null. Those
gaps are real, not placeholders. Any expiry indicator needs an unknown state.

### `src/lib/peptide-knowledge.ts` — the prose dataset

Different shape, same 124 peptides, keyed by `name` (which equals `Compound.fullName`).
Fields: `name, primaryPurpose, whatItDoes, commonUseExamples, dosageRange,
riskCautions, bestFor, keyEffects, evidenceLevel, bottomLine, avoidIf, cvRating,
cvNotes, drugInteractions, goalCategory, goalCategories, stacksWellWith`.

Helpers: `searchPeptides(query)`, `getPeptidesByCategory(category)`.

**This is what the AI routes and `/reference` read.** `catalog.ts` drives the
dashboard. A peptide added to only one is invisible on the other half of the
product — that exact bug is why the sync tests exist.

`searchPeptides` matches substrings of `name`, `whatItDoes`, `keyEffects`,
`commonUseExamples`, `bestFor` and `goalCategory`. Brand names live inside
`name` (`Semaglutide (Wegovy/Ozempic)`, `Botulinum Toxin Type A (Botox, …)`),
which is why that string is the search index and must not be trimmed for display
purposes at the data layer.

### Other data modules

`bloodwork-markers.ts`, `stacks.ts` (named stacks), `peptide-sites.ts`,
`peptide-display.ts`, `ics.ts` (calendar export), `mirror/geometry.ts`.

---

## 3. Auth

Supabase email/password. `src/lib/supabase/`:

- `client.ts` — browser client
- `server.ts` — server client plus `getAuthenticatedUser()`, which accepts a
  cookie session **or** a `Bearer` token (the native app uses the latter)
- `middleware.ts` — a session-refresh helper that nothing currently calls

Pages: `/login`, `/signup`, `/reset-password`. Sign-out is `POST /api/auth/signout`.

Signup collects **date of birth** and blocks under-18. `profiles.dob` is a real
column; self-attestation was explicitly rejected as insufficient.

A `handle_new_user` trigger on `auth.users` creates the `profiles` row and reads
`pro_whitelist` to set the tier.

---

## 4. Database

Postgres on Supabase project `uvpmrjsgaekejjofgtup`. RLS is on and every user
table is own-rows-only. The Stripe webhook is the one thing that bypasses RLS,
via `createServiceClient()` with the service-role key; it throws if the key is
absent.

| Table | Columns |
|---|---|
| `profiles` | `id, email, created_at, subscription_tier, subscription_expires_at, stripe_customer_id, dob, display_name, experience_level, onboarded_at` |
| `stack_items` | `id, user_id, name, type, dose, unit, notes, active, created_at` |
| `dose_logs` | `id, user_id, stack_item_id, taken_at, dose, notes, created_at` |
| `inventory` | `id, user_id, name, vial_size_mg, quantity_remaining, unit, expiry_date, notes, created_at, vial_size` |
| `reminders` | `id, user_id, stack_item_id, time, days_of_week[], dose, active, created_at` |
| `cycles` | `id, user_id, name, peptide_names[], on_weeks, off_weeks, start_date, status, notes, created_at` |
| `injection_sites` | `id, user_id, site, peptide_name, notes, logged_at, created_at` |
| `research_notes` | `id, user_id, peptide_name, note, url, created_at` |
| `side_effects` | `id, user_id, peptide_name, effect, severity, notes, logged_at, created_at` |
| `bloodwork_results` | `id, user_id, markers, analysis, recommendations, warnings, created_at` |
| `interaction_checks` | `id, user_id, item_a, item_b, created_at` — the rate-limit ledger |
| `subscription_events` | `id, user_id, event_type, tier, provider, provider_event_id, created_at` |
| `pro_whitelist` | `id, email, name, tier, note, added_at` — service-role only |

Two things to know:

- **User rows store peptide `name`, not `id`.** `stack_items.name`,
  `inventory.name`, `research_notes.peptide_name` and friends are free text.
  `resolveCompoundId()` in `src/lib/mirror/mapping.ts` maps them back to catalog
  ids, and `unmatchedNames()` returns the ones that matched nothing. Unmatched
  rows are **surfaced, not hidden** — see `MirrorData.unmatched`.
- **`inventory` is empty in production.** Zero rows. Any inventory UI is
  building for a table nobody has written to yet.

---

## 5. Read path

```ts
import { loadMirrorData, EMPTY_MIRROR_DATA, type MirrorData } from '@/lib/mirror/load'

interface MirrorData {
  tier: SubscriptionTier
  stack: StackEntry[]
  doseLog: DoseLogEntry[]
  cycle: Cycle | null
  hasLabs: boolean
  unmatched: string[]        // stack rows matching no catalog compound
  records: Record<string, CompoundRecords>   // keyed by compound id
}

interface CompoundRecords {
  reminders: Array<{ id, time, daysOfWeek: number[], dose }>
  notes: Array<{ id, note, url, createdAt }>
  sideEffects: Array<{ id, effect, severity, notes, loggedAt }>
}
```

`loadMirrorData()` is `server-only`. It loads the user's rows and runs them
through the pure mapping layer. **It does not filter by tier** — deliberately.
A loader that pre-filtered would put a second gate in the system, which is the
shape of every paywall leak the design hit. Tier decisions belong to
`entitlement.ts` and nowhere else.

---

## 6. Write path — server actions

`src/app/dashboard/actions.ts`, all `'use server'`, all returning
`{ ok: boolean, error?: string }`. They take **compound ids**, not names, and
resolve to rows internally.

```ts
logDose({ compoundId, dose?, site?, notes? })
addStackItem({ compoundId, dose?, unit?, notes? })
removeStackItem(compoundId)
setInventory({ compoundId, vialSizeMg, quantityRemaining, expiryDate? })
setReminder({ compoundId, time, daysOfWeek, dose? })
removeReminder(reminderId)
addNote({ compoundId, note, url? })
removeNote(noteId)
logSideEffect({ compoundId, effect, severity, notes? })
removeSideEffect(id)
startCycle({ name, startDate, onWeeks, offWeeks })
```

`src/app/welcome/actions.ts` has `completeOnboarding(input: OnboardingInput)`
returning `OnboardingResult`, which seeds a new user's stack and marks
`profiles.onboarded_at`.

Every action revalidates `/dashboard`. There is **no REST layer for user data** —
these actions are the write API. A new frontend either calls them or adds routes.

---

## 7. API routes

All POST unless noted. AI routes need `ANTHROPIC_API_KEY` and enforce AI consent.

| Route | Input | Notes |
|---|---|---|
| `/api/check-interaction` | `{ itemA, itemB }` | Opus 4.5. Writes `interaction_checks` — this is the rate-limit ledger; Free is 3/day |
| `/api/chat` | `{ messages, stackContext }` | Opus 4.5. Cortex AI conversation |
| `/api/protocol-plan` | `{ peptides, profile, customInstructions }` | Opus 4.5 |
| `/api/protocol-consult` | `{ message, history }` | Sonnet 4 |
| `/api/bloodwork-analyze` | `{ markers, currentStack, currentStackSchedule, goals }` | Opus 4.5 |
| `/api/bloodwork-ocr` | multipart / image | Opus 4.5 vision — parses a lab PDF or photo |
| `/api/scan-vials` | image | Sonnet 4 vision — reads a vial label into a stack entry |
| `/api/stack-finder` | goals | Opus 4.5 |
| `/api/reconstitution-ai` | `{ peptideName, amountMg }` | Opus 4.5 |
| `/api/market-pulse` | GET | Opus 4.5. News feed |
| `/api/user-count` | GET | Public signup counter |
| `/api/ai-consent` | — | Persists `user_metadata.ai_consent_granted` |
| `/api/auth/signout` | — | |
| `/api/stripe/create-checkout` | — | Subscription checkout session |
| `/api/stripe/portal` | — | Billing portal |
| `/api/stripe/webhook` | Stripe events | Service-role; updates `profiles.subscription_tier` |

**AI consent is a hard gate.** `src/lib/ai-consent.ts` exposes `hasAiConsent()`
and `requireAiConsent()`; `AiConsentProvider` wraps the app and mounts
`AiConsentModal` on the first AI call. Any new AI surface inherits it.

---

## 8. Tiers and entitlements

`src/lib/tier.ts` — `resolveTier(profileRow)` collapses a profile to an effective
tier and treats an expired `pro` as `free`. `lifetime` is a payment path into
Pro, **not a third feature set**; gating treats it identically to `pro`.
`FREE_LIMITS = { interactionChecksPerDay: 3 }` — a display value; the real
enforcement is server-side.

`src/lib/entitlement.ts` — `createEntitlements(input): Entitlements`. This is the
only tier gate in the system. The model is three states, not two:

- **owned** — the user's, tier-blind
- **resolved** — owned *and* readable at this tier (`held(id)`)
- **locked** — owned but withheld by tier (`lockedEntry(id)`)

`FREE_RESOLVED_ALLOWANCE = 1`. Free users own their whole stack and see it;
one compound is resolved.

Notable: `history()` is **tier-blind on purpose** — the pricing page lists the
dose log and injection-site record as open on Free. Only maths *built* on
history filters by tier. `siteUsage()` does, and that filtering is what stopped
a Free-tier leak of a locked compound's history during design. Keep that split.

Also on `Entitlements`: `labsOn` (attached AND Pro), `markers(all)`,
`cycleReport()`, `tensionCatId()`, `resolvedCount`, `lockedCount`, `stackCount`.

---

## 9. Constraints any frontend inherits

These are not style preferences. They are why the data reads the way it does.

1. **Educational research reference, not medical advice. Adults 18+.** Any
   surface showing peptide content, dosing or AI output inherits the disclaimer
   posture in `src/app/terms/page.tsx`. No exceptions.
2. **Never render a dose the data doesn't state.** Fourteen of the 124 say
   outright that no human dose exists, and a test enforces that any compound
   without a regulatory approval keeps saying so. Do not fill those with a
   placeholder, an animal-derived figure, or a dash that reads as zero.
3. **The reconstitution calculator describes solution chemistry, not dosing.**
   Inputs ask for a protocol concentration to prepare; outputs describe what the
   solution contains. This framing exists because Apple rejected the iOS app
   under Guideline 1.4.2 and the same US legal exposure applies on web.
4. **`purity: null` and `mfg`/`exp: null` are states, not missing data.**
5. **`unit` is `'mg' | 'IU'`.** HGH is IU.
6. **`cv` is not an evidence signal.** Never let it influence a grade.
7. **EU traffic is geoblocked** — `src/lib/geoblock.ts` (`BLOCKED_COUNTRIES`,
   `isBlockedCountry()`) and the `/eu` page. This is a deliberate GDPR
   avoidance decision, not a bug.

---

## 10. Pricing

`src/lib/pricing.ts` is the single source. **Do not hardcode prices.**

`MONTHLY_PRICE = 14.99`, `ANNUAL_PRICE = 119.88`, `TRIAL_MONTHS = 1`
(`TRIAL_DAYS = 30`). Derived: `annualSaving`, `annualSavingPct`,
`annualPerMonth`, `fullYearPrice`. Formatters: `money()`, `priceLabel(cycle)`,
`priceUnit(cycle)`, `priceEquivalent(cycle)`, `priceFootnote(cycle)`,
`proCta(cycle)`, `saveLabel`, `trialNote`, `trialPhrase`.

`pricing.test.ts` guards the two ways this breaks: a derived figure drifting from
the constants, and the headline showing anything other than what is charged.

California's auto-renewal law requires the amount, frequency and cancellation
method to be disclosed at checkout, before the user pays. Refund policy is at
`/refund-policy` — 7 days on monthly, 14 on lifetime.

---

## 11. Existing routes

`/` `/login` `/signup` `/reset-password` `/welcome` `/dashboard` `/stack`
`/stacks` `/stack-finder` `/reference` `/checker` `/ai-chat` `/bloodwork`
`/reconstitution` `/dosing` `/log` `/cycle` `/sites` `/notes` `/side-effects`
`/reminders` `/inventory` `/vendors` `/regulatory` `/guides/retatrutide-reconstitution`
`/pricing` `/upgrade` `/terms` `/privacy` `/refund-policy` `/eu`

`/inventory` is a redirect to `/dashboard`; vials moved onto the compound view.
Treat this list as the feature inventory to cover, not a required navigation.

---

## 12. Known gaps

- `inventory` has zero production rows.
- `dose_logs` and `reminders` have zero rows.
- No analytics, no Sentry, no feature flags.
- No Web Push yet. It is a stated v1 requirement — without it the web app
  cannot replace the iOS reminder use case.
- No ESLint config; `next lint` prompts to create one. `npm test` and
  `npx tsc --noEmit` are the checks that exist.
- `src/app/reference/page.tsx` reads `peptide-knowledge.ts` while the dashboard
  reads `catalog.ts`. Both now hold the same 124, but they are still two files.
- `stacksWith` is empty on the 32 researched compounds. Deliberate — stacking
  guidance was not invented for them.
