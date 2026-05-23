# Peptide Cortex — Project Brief

> Read this first. Future Claude sessions should not write a line of code in this repo without finishing this file.

---

## 1. Context & Intent

Karim Naga is SVP at Aon by day and founder of **Tigris Tech Labs** by night. **Peptide Cortex** is the productized version of Karim's longstanding "Peptide Bible" reference document — a private spreadsheet that grew into a vendor-cross-referenced compendium of peptides, dosing ranges, cardiovascular impact ratings, drug interactions, and stacking guidance.

The target user is the **peptide researcher / biohacker** — technically literate, runs multi-compound protocols, already maintains a stack in a Notes app or spreadsheet, and wants a single tool that combines a high-quality reference, an AI interaction checker, and a tracker. Peptide Cortex is positioned against the absence of trustworthy, structured peptide data in mainstream health apps.

**Pricing**: a free tier and a paid Pro tier (Stripe-billed monthly/yearly). A third "lifetime" tier exists at the data-model level — granted via a Supabase whitelist for founders and early-supporter accounts, not purchasable. Whether `lifetime` was intended as a publicly-marketed third commercial tier is an open question (see §13).

**Hosting**: production lives at `peptidecortex.com` (per `capacitor.config.ts` allowNavigation). `peptide-app-nine.vercel.app` is the current Vercel hostname; `peptidecortex.ai` appears as `metadataBase` in `src/app/layout.tsx`; `peptidetracker.app` appears as a fallback domain in `src/app/api/stripe/create-checkout/route.ts`. Domain canonicalization needs cleanup (see §13).

**Sister products** under the Tigris Tech Labs umbrella:
- **PRAIX** — AI residential real estate platform (separate repo, paused after April 2026 Vercel security incident)
- **alevant-app** — AI-native CRM for residential real estate (separate repo, pre-pilot)
- **Jarvis** — personal idea-capture system (separate repo, in active development)

Communication style with Karim: technical, direct, push back when warranted. He is the only operator on this codebase today.

---

## 2. Strategic Pivot (read this first)

The native iOS Peptide Cortex app was **rejected by Apple** under two App Store Review Guidelines:

- **1.4.1** — Medical / Drugs: the app provides medical advice without regulatory clearance.
- **1.4.2** — Dose calculator: the reconstitution calculator and dosing UI require manufacturer or institutional sponsorship.

Going forward:

- **`peptidecortex.com` (this web app) is the primary delivery surface** and gets the full functionality — Peptide Bible, interaction checker, Cortex AI chat, Protocol Planner, bloodwork analysis, reconstitution calculator, dose tracker, cycles, sites, inventory, research notes, side effects, vendor directory, regulatory tracker.
- **The native iOS app will be reframed**, in a separate effort, as a stripped-down reference-and-tracking companion (no dose calculator, no personalized AI-generated dosing recommendations, no bloodwork analysis), so it can survive App Store review under the educational-reference framing already begun in commit `3a45720 fix: reframe app as educational reference tool for App Store compliance`.
- All new work in **this repo** brings the web frontend to feature parity with the iOS Swift app and beyond.
- The legal posture for the web app is "**educational research reference, not medical advice; for adults 18+; for research purposes only**." Disclaimers, framing, terms-of-service language, jurisdictional language, and the AI consent flow must be consistent across every surface that displays medical-adjacent content. The web app is not bound by App Store rules, but it **is** bound by US law (FDA, FTC, state-level practice-of-medicine statutes, product-liability law). Defensibility is the floor, not the ceiling.

---

## 3. Repository Topology

| Path | Role |
|---|---|
| `T:\TigrisTechLabs\Products\peptide-app` | **This repo.** Web app + native iOS app live in the same git repo. Origin: `github.com/Karrim7811/peptide-app.git`. Branch `main` is the working line. |
| `T:\TigrisTechLabs\Products\peptide-app-ios` | Read-only **reference clone** of the same repo, kept on disk so future sessions can read the iOS Swift code without confusion when the web tree changes. Do not commit to it. |
| `T:\TigrisTechLabs\Products\peptide-app\src` | Next.js 14 web app (the going-forward primary surface). |
| `T:\TigrisTechLabs\Products\peptide-app\ios-native` | Native SwiftUI iOS app — `PeptideCortex.xcodeproj` generated via XcodeGen. This is where the App Store rejection lives. |
| `T:\TigrisTechLabs\Products\peptide-app\ios` | Capacitor-generated iOS wrapper (largely unused; `ios-native/` is the active iOS surface). |
| `T:\TigrisTechLabs\Products\peptide-app\supabase` | Three raw SQL files: `schema.sql`, `subscription_migration.sql`, `admin_access.sql`. No formal migrations folder — see Known Issues. |

Both directories share the name "peptide-app" but the iOS clone has the `-ios` suffix. **Never confuse them in future sessions.** When in doubt, work in `T:\TigrisTechLabs\Products\peptide-app` (no suffix) — that's the canonical repo and the only one that should ever receive commits.

---

## 4. What Peptide Cortex Is

A single hybrid product across two surfaces (web + native iOS) sharing one Supabase backend and one set of Next.js API routes:

**Reference layer** — the Peptide Bible: 81+ peptide entries (auto-generated from `Peptides_Master_List_FULL_Explainers_CV_Interactions_Dropdowns.xlsx` via `generate_knowledge.py`), each carrying primary purpose, mechanism, dosage range, risk cautions, evidence level, CV impact rating 0–5, drug interactions, goal category, and a curated list of compounds that stack well. Plus 24+ pre-defined named stacks (KLOW, GLOW, Wolverine Stack, Tri-Heal, etc.). Plus vendor directory, regulatory status tracker, and side-effect reference.

**Intelligence layer** — Anthropic Claude-powered tools:
- **Interaction Checker** — checks any two compounds (peptide / Rx / supplement / OTC) for interaction (`/api/check-interaction`, model `claude-opus-4-5`).
- **Cortex AI Chat** — conversational assistant with the user's full stack loaded as context (`/api/chat`).
- **Protocol Planner** — generates a personalized dosing plan from goals + existing stack (`/api/protocol-plan`, `/api/protocol-consult`).
- **Bloodwork Analyzer** — accepts lab markers + current stack + goals, returns an educational overview and peptide references commonly studied in relation to those biomarkers (`/api/bloodwork-analyze`, `/api/bloodwork-ocr`).
- **Vial Scanner** — Claude vision parses a photo of a vial label and extracts name + mg into a structured stack entry (`/api/scan-vials`).
- **Stack Finder** — given goals, suggests a stack (`/api/stack-finder`).
- **Reconstitution AI** — assists with mixing-water calculations (`/api/reconstitution-ai`).
- **Market Pulse** — peptide news feed surface (`/api/market-pulse`).

**Tracking layer** — Supabase-backed user data:
- Stack (`stack_items`) — active peptides/meds/supps
- Reminders (`reminders`) — time + day-of-week scheduling
- Dose Log (`dose_logs`) — historical doses
- Fridge Inventory (`inventory`) — vial sizes, quantity remaining, expiry
- Bloodwork (`bloodwork_results`) — saved analyzer outputs
- Interaction Checks (`interaction_checks`) — audit trail and rate-limit ledger

**Subscription gating** — Free tier = 5 stack items, 3 interaction checks/day, 3 reminders, no PeptideAI chat, no cycle/sites/inventory/notes/side-effects. Pro = unlimited. Lifetime = whitelisted founders and early supporters, equivalent to permanent Pro.

**Brand** — see §6.

---

## 5. Tech Stack (web)

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.29 (App Router) |
| Language | TypeScript 5 |
| UI | React 18 + Tailwind CSS 3.4.1 + lucide-react icons |
| Backend | Supabase (Postgres + Auth + RLS) via `@supabase/ssr` 0.4 and `@supabase/supabase-js` 2.44 |
| AI | `@anthropic-ai/sdk` 0.24.3 — Claude Opus 4.5 for synthesis (`claude-opus-4-5`), Sonnet 4 in iOS app code (`claude-sonnet-4-20250514`) |
| Payments | Stripe 20.4.1 (API version `2026-02-25.clover`) with webhook-driven `profiles.subscription_tier` updates |
| Mobile shell | Capacitor 8.2.0 (configured in `capacitor.config.ts`, mostly used by the native Swift app to embed remote URLs during transitional builds) |
| Hosting | Vercel (`vercel.json: { "framework": "nextjs" }`, currently `peptide-app-nine.vercel.app` → `peptidecortex.com`) |
| PWA | `/manifest.json` + `/sw.js` service worker (registered in `src/app/layout.tsx` only when `!window.Capacitor`). Apple touch icon present. See Known Issues — manifest is stale. |
| Fonts | Cormorant Garamond (display), Jost (sans) — loaded from Google Fonts in `src/app/layout.tsx` |

No analytics SDK, no Sentry, no PostHog wired in. No feature-flag system. No CI workflow file in `.github/workflows/` for the web app (iOS app has one in commit history).

---

## 6. Brand

Tigris Tech Labs family. The Tailwind palette in `tailwind.config.js` defines:

| Token | Hex | Use |
|---|---|---|
| `cx.parchment` | `#FAFAF8` | Page background |
| `cx.off` | `#F2F0ED` | Card surfaces |
| `cx.light` | `#E8E5E0` | Borders, dividers |
| `cx.stone` | `#B0AAA0` | Secondary text |
| `cx.dark` | `#3A3730` | Primary text |
| `cx.black` | `#1A1915` | Headlines, sidebar |
| `cx.teal` | `#1A8A9E` | Primary accent (CTAs, badges, links) |
| `cx.sidebar` | `#1A1915` | Sidebar background |

**Type**: Cormorant Garamond (display, serif), Jost (sans). JetBrains Mono (mentioned in the Tigris Tech Labs family spec) is **not** currently in the Tailwind config or layout — flag in §13.

**Accent colour mismatch**: the Tigris Tech Labs family spec referenced by Karim names the primary accent "Neural Teal `#00C9B1`". This codebase uses `#1A8A9E` (a darker, cooler teal closer to petrol). Whether the brand spec changed or the code drifted is an open question — see §13.

**Marketing voice** (`MARKETING.md`): "analytical, practical, slightly edgy. Science-first biohacking. NOT overly medical, scary, or supplement-bro. Smart and direct." `MARKETING.md` is also out of date — it carries the old `PeptideTracker` name and an old dark-navy/indigo colour palette (`#0f172a`, `#6366f1`) that no longer matches the live cx palette.

---

## 7. Repository Layout (web app)

```
src/
  app/
    layout.tsx                    Root layout, AiConsentProvider, PWA registration
    page.tsx                      Landing page (38 KB — large single-file marketing surface)
    globals.css
    ai-chat/                      Cortex AI conversational interface
    api/                          12 API route handlers
      ai-consent/route.ts         Persist user_metadata.ai_consent_granted=true
      auth/signout/route.ts
      bloodwork-analyze/route.ts  Opus 4.5 educational overview of markers
      bloodwork-ocr/route.ts      Claude vision parse of lab PDFs
      chat/route.ts               Cortex AI conversation
      check-interaction/route.ts  Opus 4.5 interaction check
      market-pulse/route.ts       Peptide news feed
      protocol-consult/route.ts   Conversational protocol assistant
      protocol-plan/route.ts      Structured protocol generation
      reconstitution-ai/route.ts  AI-assisted recon math
      scan-vials/route.ts         Claude vision vial label parser
      stack-finder/route.ts       Goal-to-stack recommender
      user-count/route.ts         "X users signed up" public counter
      stripe/
        create-checkout/route.ts  Subscription checkout session
        portal/route.ts           Customer billing portal
        webhook/route.ts          checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted, invoice.payment_failed
    checker/                      Interaction Checker UI
    cycle/                        Cycle Tracker UI
    dashboard/                    Overview + MarketPulse component
    dosing/                       Dosing reference UI
    inventory/                    Fridge Inventory UI
    log/                          Dose Log UI
    login/                        Auth — email/password
    notes/                        Research Notes UI
    pricing/                      Free vs Pro pricing page
    privacy/                      Privacy policy
    reconstitution/               Recon calculator UI
    reference/                    Peptide Bible UI
    regulatory/                   Regulatory status tracker
    reminders/                    Reminders UI
    side-effects/                 Side-effect log UI
    signup/                       Auth — email/password
    sites/                        Injection sites tracker
    stack/                        My Stack UI
    stack-finder/                 Stack Finder UI
    stacks/                       Popular Stacks browser
    terms/                        Terms of service
    upgrade/                      Stripe upgrade landing
    vendors/                      Vendor directory
  components/
    AiConsentModal.tsx            Mounted by AiConsentProvider on first AI call
    AiConsentProvider.tsx         Global provider, wraps app in layout.tsx
    BottomNav.tsx                 Mobile bottom-nav
    CortexStrip.tsx               Branded marketing strip
    MobileNav.tsx                 Mobile drawer menu
    Navbar.tsx                    Desktop nav
    Sidebar.tsx                   Desktop sidebar
    TopBar.tsx                    Desktop topbar
  lib/
    ai-consent.ts                 hasAiConsent / requireAiConsent helpers
    peptide-knowledge.ts          81+ peptide entries, generated from xlsx
    peptides.ts                   Smaller helper module
    stripe.ts                     Stripe client + checkout/portal helpers
    subscription.ts               getUserSubscription / isProUser / rate-limit count
    supabase/
      client.ts                   Browser client
      server.ts                   Server client + getAuthenticatedUser (cookie OR Bearer)
      middleware.ts               Session refresh helper
  types/
    index.ts                      Profile / StackItem / Reminder / DoseLog types
supabase/
  schema.sql                      Profiles, stack_items, reminders, dose_logs, inventory, bloodwork_results + handle_new_user trigger
  subscription_migration.sql      Add subscription_tier, subscription_expires_at, stripe_customer_id; subscription_events; interaction_checks
  admin_access.sql                pro_whitelist + lifetime tier assignment
public/
  manifest.json                   PWA manifest (STALE — see §10)
  sw.js                           Service worker (network-first for API, cache-first for static)
  icons/                          App icons
ios-native/
  PeptideCortex/                  SwiftUI app (App / Config / Models / Resources / Services / ViewModels / Views)
  project.yml                     XcodeGen spec
generate_knowledge.py             Excel → TS knowledge transpiler
Complete_Peptide_Bible_v2.pdf     Source reference document (commit history doc, not shipped to users)
Peptides_Master_List_*.xlsx/csv   Authoring source for peptide knowledge
MARKETING.md                      Marketing playbook (out of date — see §10)
README.md                         Out of date — see §10
middleware.ts                     No-op (`matcher: ['/_never_match_this_route_']`) — disables Next.js middleware entirely
next.config.js                    Empty default config
capacitor.config.ts               appId 'ai.peptidecortex.app', appName 'Peptide Cortex'
tailwind.config.js                cx.* palette + Cormorant/Jost fonts
vercel.json                       { "framework": "nextjs" }
```

---

## 8. Feature State (Web)

Status legend: ✅ working · 🟡 partial · 🔴 broken · ⚪ planned/unknown

| Feature | Status | File |
|---|---|---|
| Landing page | ✅ | `src/app/page.tsx` |
| Auth — email/password sign up + sign in | ✅ | `src/app/login`, `src/app/signup` |
| Auth — Apple Sign In | ⚪ Web-side missing | iOS-only, removed for App Store |
| Dashboard overview | ✅ | `src/app/dashboard` |
| My Stack | ✅ | `src/app/stack` |
| Stack Finder | ✅ | `src/app/stack-finder` |
| Popular Stacks browser | ✅ | `src/app/stacks` |
| Peptide Bible reference | ✅ | `src/app/reference` |
| Interaction Checker | ✅ | `src/app/checker` + `/api/check-interaction` |
| Cortex AI Chat | ✅ | `src/app/ai-chat` + `/api/chat` |
| Bloodwork Analyzer (UI) | 🔴 Missing | API exists (`/api/bloodwork-analyze`, `/api/bloodwork-ocr`); no page in `src/app/bloodwork/` |
| Protocol Planner (UI) | 🔴 Missing | API exists (`/api/protocol-plan`, `/api/protocol-consult`); no page in `src/app/protocol/` |
| Reconstitution Calculator | ✅ | `src/app/reconstitution` |
| Dose Log | ✅ | `src/app/log` |
| Fridge Inventory | ✅ | `src/app/inventory` |
| Reminders | ✅ | `src/app/reminders` |
| Cycle Tracker (UI) | ✅ | `src/app/cycle` — but `cycles` table is **not** in `supabase/schema.sql` |
| Injection Sites tracker (UI) | ✅ | `src/app/sites` — but `injection_sites` table is **not** in `supabase/schema.sql` |
| Research Notes (UI) | ✅ | `src/app/notes` — but `research_notes` table is **not** in `supabase/schema.sql` |
| Side Effects log (UI) | ✅ | `src/app/side-effects` — but `side_effects` table is **not** in `supabase/schema.sql` |
| Vendors directory | ✅ | `src/app/vendors` |
| Regulatory status tracker | ✅ | `src/app/regulatory` |
| Market Pulse news feed | ✅ | `/api/market-pulse` |
| Vial Scanner (UI) | 🔴 Missing | API exists (`/api/scan-vials`); web has no camera/upload UI calling it |
| Stripe checkout | ✅ | `/api/stripe/create-checkout` |
| Stripe customer portal | ✅ | `/api/stripe/portal` |
| Stripe webhook | ✅ | `/api/stripe/webhook` |
| Pricing page | ✅ | `src/app/pricing` |
| Terms of Service | ✅ | `src/app/terms` — Tigris Tech Labs-branded, US-law, educational-only framing |
| Privacy Policy | ✅ | `src/app/privacy` |
| AI Consent modal + persistence | ✅ | `src/components/AiConsentModal.tsx` + `/api/ai-consent` |
| PWA manifest | 🟡 Stale | `public/manifest.json` still names "PeptideTracker" with `#0f172a` colours |
| Service worker | ✅ | `public/sw.js` — network-first for `/api/*` and `/auth/*`, cache-first for static |
| Apple touch icon | ✅ | `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />` |
| Route-level auth middleware | 🔴 Disabled | `middleware.ts` matcher is `'/_never_match_this_route_'` — auth is per-page Supabase session reads only |
| Analytics / observability | ⚪ None | No Sentry, no PostHog, no Plausible, no Vercel Analytics |

---

## 9. Feature Inventory (Native iOS) — Migration Source

These are present in the iOS Swift app and either missing from the web app, missing the matching UI, or implemented less richly on web. The full migration plan lives in `IOS-TO-WEB-MIGRATION.md`.

**iOS Views** (`ios-native/PeptideCortex/Views/`):

- Auth: `LoginView`, `SignupView` (Apple/Google sign-in support in code, Apple button temporarily removed for review)
- Components: `AIConsentSheet`, `LoadingView`, `ProGateView`, `SceneKitVial`, `SearchBar`, `StatCard`, `VialScannerView`, `VialView`
- Dashboard: `DashboardView` with Quick Actions, Today's Doses (with animated 3D vial rows), Active Stack, streaks, supply alerts
- Intelligence: `ChatView`, `CheckerView`, `ProtocolPlannerView`, `StackFinderView`
- Navigation: `DrawerMenu`, `MainView`
- Pricing: `PricingView` (StoreKit 2-backed in-app purchases via `StoreService.swift`)
- Protocol: `CycleView`, `DosingView`, `ReconstitutionView` (with mL/cc unit toggle), `SitesView`, `StackView`
- Reference: `AboutView`, `PeptideBibleView`, `PopularStacksView`, `RegulatoryView`, `VendorsView`
- Tracking: `BloodworkView`, `DoseLogView` (with calendar + streaks), `InventoryView` (with vial scanner), `NotesView` (with bold/italic toolbar — recently reverted), `RemindersView`, `SideEffectsView`

**iOS-only features that require deliberate decisions before/against migrating** to web:

| Feature | Notes |
|---|---|
| SceneKit 3D vial | A WebGL / React Three Fiber port could carry the visual identity to web. Treat as a "high-craft" optional polish. |
| Native Vial Scanner via AVFoundation | Web equivalent is `getUserMedia` + canvas snapshot → `/api/scan-vials`. The API already exists; the web UI doesn't. |
| StoreKit 2 IAP | Web uses Stripe. iOS users get IAP; web users get Stripe. Two payment paths to one `profiles.subscription_tier` is intentional and OK. |
| Push notifications | Native APNs on iOS. On web, Web Push (VAPID) — not yet implemented. |
| Apple / Google native sign-in | OAuth on web via Supabase if needed; not necessary for v1 web parity. |
| Bold/italic toolbar in Notes | Reverted on iOS (`9ac175f`). Hold. |

---

## 10. Data Model

`supabase/schema.sql` defines the canonical tables. **Note**: several pages in the web app (`/cycle`, `/sites`, `/notes`, `/side-effects`) imply tables that are not present in any of the three SQL files in `supabase/`. Either those tables exist in the Supabase project but the SQL was never written back into the repo, or the pages save to other tables / `localStorage`. **This is the single biggest schema/code drift in the repo.** Audit recommended (REFACTOR-ROADMAP item C-1).

| Table | Columns | RLS | Owner of writes |
|---|---|---|---|
| `profiles` | `id uuid PK → auth.users`, `email`, `created_at`, `subscription_tier ('free'|'pro'|'lifetime')`, `subscription_expires_at`, `stripe_customer_id` | Yes (select/insert own) | `handle_new_user` trigger + Stripe webhook |
| `stack_items` | `id`, `user_id`, `name`, `type ('peptide'|'medication'|'supplement')`, `dose`, `unit`, `notes`, `active`, `created_at` | Yes (all-on-own) | User |
| `reminders` | `id`, `user_id`, `stack_item_id`, `time`, `days_of_week int[]`, `dose`, `active`, `created_at` | Yes | User |
| `dose_logs` | `id`, `user_id`, `stack_item_id`, `taken_at`, `dose`, `notes`, `created_at` | Yes | User |
| `inventory` | `id`, `user_id`, `name`, `unit`, `vial_size_mg`, `quantity_remaining`, `expiry_date`, `notes`, `created_at` | Yes | User |
| `bloodwork_results` | `id`, `user_id`, `markers (text JSON)`, `analysis`, `recommendations (text JSON)`, `warnings (text JSON)`, `created_at` | Yes | User |
| `subscription_events` | `id`, `user_id`, `event_type`, `tier`, `provider`, `provider_event_id`, `created_at` | Read-own only | Stripe webhook (service role) |
| `interaction_checks` | `id`, `user_id`, `item_a`, `item_b`, `created_at` | Yes | User (insert) for rate-limit counter |
| `pro_whitelist` | `id`, `email unique`, `name`, `tier ('pro'|'lifetime')`, `note`, `added_at` | RLS enabled, no policies — service-role only | Manual |
| `cycles` ⚠️ | Implied by `/cycle/page.tsx` but **not in schema.sql** | ? | ? |
| `injection_sites` ⚠️ | Implied by `/sites/page.tsx` but **not in schema.sql** | ? | ? |
| `research_notes` ⚠️ | Implied by `/notes/page.tsx` but **not in schema.sql** | ? | ? |
| `side_effects` ⚠️ | Implied by `/side-effects/page.tsx` but **not in schema.sql** | ? | ? |

**Triggers**: `on_auth_user_created` on `auth.users` → `handle_new_user()` reads `pro_whitelist` and inserts a `profiles` row with the correct tier.

---

## 11. Integrations

| Service | Purpose | Where |
|---|---|---|
| Supabase | DB + Auth + RLS | All `src/lib/supabase/*` and every API route |
| Anthropic Claude | Interaction check, bloodwork analysis, chat, protocol planner, vial scan, recon AI | `@anthropic-ai/sdk` in every `/api/*` route except auth and Stripe. Model used: `claude-opus-4-5` (web), `claude-sonnet-4-20250514` (iOS code) |
| Stripe | Pro subscription payments | `src/lib/stripe.ts`, `/api/stripe/*` |
| Google Fonts | Cormorant Garamond + Jost | `src/app/layout.tsx` |

**Env vars required** (`.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
```

There is **no** `SUPABASE_SERVICE_ROLE_KEY` referenced in `.env.example` and no obvious service-role usage in any API route — every call uses the anon key + the user's session. This is good for RLS-as-defence-in-depth but means the Stripe webhook's `profiles` updates are running under anon, which would fail RLS. Audit recommended (REFACTOR-ROADMAP item C-3).

---

## 12. Lifecycle Stage

**Pre-launch, pre-revenue**. Web app is deployed to Vercel but the public URL canonicalization is unresolved (three different domain strings exist in code). Stripe is wired but no live transactions confirmed in this audit. App Store launch is blocked. The product is feature-rich (most surfaces work) but has structural debt (schema drift, stale README/manifest, no observability, no analytics, no test suite).

The next 90 days of work are about getting `peptidecortex.com` to the polish level a paying Pro user would expect — clean PWA install, schema reconciliation, defensible legal posture, and bringing the iOS-only UIs (Bloodwork, Protocol Planner, Vial Scanner) into the web frontend.

---

## 13. Known Issues & Open Questions

### Hard issues (will burn a real session if not addressed)

1. **Schema/code drift** — `/cycle`, `/sites`, `/notes`, `/side-effects` pages exist but their tables are absent from `supabase/schema.sql`. Pages may be writing to tables only the Supabase remote knows about, or to `localStorage`. Need to introspect the live Supabase project and write missing migrations.
2. **Middleware is a no-op** — `middleware.ts` matches `/_never_match_this_route_`. No route-level session refresh. Pages do per-render session reads. Acceptable but worth a deliberate decision.
3. **Stripe webhook writes to `profiles` under anon** — `createClient()` in `/api/stripe/webhook/route.ts` is the SSR cookie client, not a service-role client. Under RLS, anon should not be able to UPDATE another user's profile. Either RLS has an open update policy I haven't found, or the webhook is silently failing.
4. **PWA manifest stale** — `public/manifest.json` still names the app "PeptideTracker", uses `#0f172a` / `#0f172a` as `background_color` / `theme_color`, and references SVG icons. None of this matches the current `cx.*` palette or the `Peptide Cortex` brand. This is the user's first impression on iPhone home-screen install.
5. **Three different production domains in code** — `peptidecortex.com` (capacitor.config.ts), `peptidecortex.ai` (layout.tsx metadataBase), `peptidetracker.app` (stripe/create-checkout fallback). Open-graph cards, share links, Stripe success URLs, and middleware all need one canonical domain.
6. **README and MARKETING.md are out of date** — README says "PeptideTracker", "58 peptides", "max 20 users"; MARKETING.md uses an old dark-navy/indigo brand palette. Both contradict current code.
7. **No off-NAS backup** — origin GitHub remote is `Karrim7811/peptide-app.git` and the working copy is on the T:\ network share. GitHub push status is up-to-date as of clone (`b611890`). Single point of failure if the GitHub account or the NAS is lost.
8. **No tests, no CI for the web app** — `.github/workflows/` has iOS-only workflows. No `vitest` / `jest` / `playwright` config.

### Soft / strategic questions for Karim

1. **Brand accent colour** — is the primary teal `#1A8A9E` (current code) or `#00C9B1` (Tigris Tech Labs family spec named "Neural Teal")? Same question for the Tigris monogram / wordmark usage on the web app.
2. **JetBrains Mono** — the Tigris Tech Labs family typography spec includes JetBrains Mono for data. Not used anywhere in this codebase. Wanted on web?
3. **Third commercial tier** — `subscription_tier` schema allows `'free' | 'pro' | 'lifetime'`. The pricing page shows only Free and Pro. Is `lifetime` meant to be a paid tier we sell (e.g. one-time $299), or is it only ever a comp grant?
4. **Stripe price strategy** — pricing page hardcodes "Save 51%" calc from `$9.99 * 12 → $79.99`. Are those the live values, or stale?
5. **Bloodwork prompt literal** — the bloodwork-analyze system prompt says "Peptide Knowledge Base (58 peptides)". Actual knowledge file is 81+ entries. Update to compute count dynamically.
6. **Web push** — should `peptidecortex.com` support Web Push for dose reminders (VAPID + service worker subscription)? Required to compete with the native iOS push reminders.
7. **Bloodwork PDF/image upload via web** — the iOS app has camera scan + file import (`4516e2a feat: add camera scan and file import for bloodwork analyzer`). Web does not. How critical to v1 web parity?
8. **Vial Scanner on web** — `getUserMedia` + canvas → `/api/scan-vials` is straightforward, but is this a Pro feature on web or free?
9. **Dose-calculator framing on web** — Apple rejected on 1.4.2 because the recon calculator gives dosing without manufacturer/institutional sponsorship. On web, this is allowed under US law but still creates product-liability surface. Keep, hide behind disclaimer, or convert to a "reference tool" that shows ranges only?
10. **Data residency / DPA** — Supabase US region assumed. Confirm before any EU users sign up; current Terms says US law only.
11. **Age verification** — Terms requires 18+, but signup flow does not collect DOB or assert age. Consider an age gate on `/signup`.
12. **Refund policy** — Terms say refunds "at our discretion" with a 7-day window. State refund-policy languages required by FTC / various state AGs? Defer to counsel before public launch.

---

## 14. Working Principles for Claude in this Repo

- **Read this file first.** If anything below contradicts CLAUDE.md, push back and ask before writing code.
- **Confirm the surface.** Are you changing the web app (`src/`), the iOS app (`ios-native/`), the shared backend (`supabase/` + `/api/*`), or all three? Make it explicit before editing.
- **Schema before code.** If you're adding a feature that needs a new table or column, write the migration first and check it into `supabase/`. Do not rely on the Supabase dashboard to be the source of truth.
- **Disclaimer parity.** Anything new that displays peptide content, dosing, or AI-generated guidance must inherit the same disclaimer surface as `src/app/terms/page.tsx`. No exceptions.
- **Stripe + RLS together.** When changing anything in `/api/stripe/*` or `subscription_tier`, also re-verify the RLS policy on `profiles` and the trigger on `handle_new_user`.
- **Brand parity.** Use `cx.*` Tailwind tokens, not raw hex. Use Cormorant Garamond for display, Jost for UI.
- **Use commits.** Push small, descriptive commits (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`). The existing log style is consistent — match it.
- **Never assume the README.** It's stale. Trust the code.

---

## 15. Autonomy Guidelines

**Claude decides without asking** (reversible, low-risk, scoped to this repo):
- File naming and folder structure inside `src/`
- Refactor patterns (component extraction, hook extraction, type narrowing)
- Adding dependencies inside the existing stack (e.g. another React lib, another Tailwind plugin, another `lucide` icon, another Claude model)
- Formatting, lint fixes, dead-code removal
- Commit messages, branch naming, PR descriptions
- Writing tests, writing docs, fixing typos
- Anything obviously reversible by `git revert`

**Claude asks first** (irreversible, customer-affecting, regulatory):
- Schema migrations that alter or drop existing tables / columns with real customer data
- Anything that touches real customer PII or stored health data (bloodwork, dose history, notes)
- New external paid integrations (a new SaaS bill on Karim's card)
- Anything that changes Stripe price IDs, billing cadence, or refund policy text
- Anything that changes the Terms of Service, Privacy Policy, or AI consent text
- Going live with a domain switch or DNS change
- `git push --force`, branch deletion, history rewrite
- Anything that creates new US legal / liability surface (dosing guidance for individuals, medical claims, "treats / cures / diagnoses" language)

---

## 16. Open Questions (consolidated for §13)

These need Karim's decision before further work. Future sessions: each unanswered item below is a parking-lot for now — don't assume a default.

1. Canonical production domain — `peptidecortex.com` vs `peptidecortex.ai`?
2. Primary teal — `#1A8A9E` (current code) vs `#00C9B1` (Neural Teal brand spec)?
3. JetBrains Mono — adopt for web?
4. `lifetime` tier — sell as third commercial tier, or comp-only?
5. Stripe live price IDs and amounts — confirm the `$9.99/mo`, `$79.99/yr` strings in `pricing/page.tsx`.
6. Web Push for reminders — v1 web parity requirement?
7. Bloodwork OCR upload UI on web — v1 requirement?
8. Vial Scanner on web — free or Pro-gated?
9. Reconstitution calculator on web — keep, hide, or convert to range-only reference?
10. Age gate at signup — collect DOB or self-assert?
11. EU / DPA / GDPR — when do non-US users become a real market?
12. State-specific refund-policy language — defer to counsel before public launch?

---

_Last audit: 2026-05-23 by Claude (Opus 4.7, 1M context). Repo head at audit time: `b611890 fix: robust JSON extraction for bloodwork AI analysis` on `main`._
