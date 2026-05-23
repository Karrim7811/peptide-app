# Peptide Cortex — Refactor Roadmap

Prioritized remediation backlog for the **web app** (`src/`), independent of the iOS-to-web feature migration (see `IOS-TO-WEB-MIGRATION.md` for that). Items are sequenced for impact + risk, with critical / pre-revenue blockers first.

Effort sizes: XS≈<1h, S≈2–4h, M≈half-day, L≈full-day+.

---

## Critical (pre-revenue blockers)

### C-1 · Schema reconciliation: write missing migrations for the four orphan tables
**Description**: `/cycle`, `/sites`, `/notes`, `/side-effects` pages exist in `src/app/` but the implied tables (`cycles`, `injection_sites`, `research_notes`, `side_effects`) are absent from `supabase/schema.sql`. Either the live Supabase project has them (drift) or the pages save to `localStorage` (data loss on signout). Adopt the formal `supabase/migrations/` directory convention, move existing SQL into `0001_init.sql`, and write `0002_cycles.sql`, `0003_injection_sites.sql`, `0004_research_notes.sql`, `0005_side_effects.sql` with RLS.
**Why it matters**: undiscovered data loss is the worst kind of bug. Until this is closed, every Pro upgrade is selling features that may not durably persist user data. This is a customer-trust issue.
**Effort**: M.
**Files**: `supabase/migrations/0001_init.sql` (new), `supabase/migrations/0002_*` … `0005_*` (new), `src/app/cycle/page.tsx`, `src/app/sites/page.tsx`, `src/app/notes/page.tsx`, `src/app/side-effects/page.tsx`.
**Plugin lens**: supabase (schema reconciliation), code-review (drift detection), security-guidance (RLS on user data).

### C-2 · Confirm Stripe webhook can actually write to `profiles`
**Description**: `/api/stripe/webhook/route.ts` calls `createClient()` from `@/lib/supabase/server` — which is the cookie-based SSR client, not a service-role client. The handler then runs `supabase.from('profiles').update(...).eq('id', userId)`. Under RLS, an anonymous user is not allowed to update a `profiles` row that isn't their own session. Either there's an open update policy on `profiles` (which would be a security hole), or the webhook silently fails and no Stripe Pro upgrade has ever actually flipped `subscription_tier`.
**Why it matters**: this is the difference between "paid users get Pro" and "paid users get charged and stay free." Untested billing is brand-ending.
**Effort**: S to diagnose, S–M to fix (introduce a `SUPABASE_SERVICE_ROLE_KEY`, add a `lib/supabase/admin.ts` client, refactor webhook + admin queries to use it).
**Files**: `src/app/api/stripe/webhook/route.ts`, `src/lib/supabase/server.ts` or new `src/lib/supabase/admin.ts`, `.env.example`, `supabase/schema.sql` RLS policies on `profiles`.
**Plugin lens**: security-guidance (privilege boundary), code-review (correctness), payment-integrity.

### C-3 · Add age gate at signup
**Description**: Terms of Service §2 requires users to be 18+. Signup form does not collect or self-attest age. Add a checkbox "I confirm I am 18 years of age or older" with form validation, and persist a `profiles.age_attested_at` timestamp.
**Why it matters**: minors signing up for a peptide research tool is a top-five "viral lawsuit" risk. The fix is one checkbox and a migration. The cost of not fixing it is unbounded.
**Effort**: XS.
**Files**: `src/app/signup/page.tsx`, `supabase/migrations/0006_age_attestation.sql` (add column), `src/lib/supabase/server.ts` (handle_new_user to record).
**Plugin lens**: security-guidance, US-legal-risk.

### C-4 · Push web app to GitHub backup verified + add `Tigris Tech Labs` org continuity
**Description**: The repo lives on a network share (T:\) and pushes to `github.com/Karrim7811/peptide-app.git`. GitHub state at audit time matches local (`b611890`). However: the repo is under a personal account (`Karrim7811`), not a `tigris-tech-labs` GitHub org. If the personal account is lost / suspended, the codebase access vanishes. Create a `tigris-tech-labs` GitHub org, transfer the repo, and add at least one collaborator with admin rights.
**Why it matters**: single point of failure on the most valuable digital asset Karim owns. This is a 30-minute fix that removes a real existential risk.
**Effort**: XS.
**Files**: GitHub org settings (no code change).
**Plugin lens**: backup / continuity.

### C-5 · Audit `src/app/page.tsx` (landing) for FTC health-claim language
**Description**: The landing page is a 38 KB single-file marketing surface. It's the most likely place for unguarded "treats / cures / diagnoses / heals / improves" outcome claims that the FTC pursues independently of FDA. A line-by-line audit is needed; replace any direct outcome claims with "users report" / "research suggests" / "studies have investigated".
**Why it matters**: FTC enforcement is fast, public, and expensive. Apple's App Store rejection on 1.4.1 is a signal that the framing on this codebase has been health-claim-adjacent.
**Effort**: S.
**Files**: `src/app/page.tsx`, `MARKETING.md` (also out of date — separate issue).
**Plugin lens**: security-guidance (legal-risk), code-review.

---

## High (pre-launch quality and SaaS-readiness)

### H-1 · Refresh `public/manifest.json` for proper PWA install
**Description**: Current manifest names the app "PeptideTracker", uses `#0f172a` / `#0f172a` for background/theme color, and references SVG-only icons. None of this matches the current brand. Rewrite manifest with `name: "Peptide Cortex"`, `short_name: "Peptide Cortex"`, `theme_color: "#1A8A9E"` (or whatever Karim confirms as the canonical teal), `background_color: "#FAFAF8"`. Add raster icons at 192/512 (PNG, plus maskable variants for Android adaptive icons and proper iOS apple-touch sizes 152/167/180).
**Why it matters**: this is the single most important PWA polish item. The web app competes with what the iOS app was supposed to be — a high-quality install on the home screen. If the install drops a stale "PeptideTracker" tile, the user immediately downgrades their perception of the product.
**Effort**: S.
**Files**: `public/manifest.json`, `public/icons/*`, `src/app/layout.tsx` (apple-touch-icon link).
**Plugin lens**: frontend-design, pwa-readiness.

### H-2 · Refresh `src/app/layout.tsx` metadata to a single canonical domain
**Description**: `metadataBase: new URL('https://peptidecortex.ai')` in layout.tsx, but `capacitor.config.ts` allowNavigation lists `peptidecortex.com`, and `/api/stripe/create-checkout` falls back to `peptidetracker.app`. Pick one. Update OG meta, structured data, sitemap, robots.txt, Stripe success/cancel URLs, and any hard-coded `https://` strings to match.
**Why it matters**: ranking signals split across multiple domains. Stripe success URL pointing to a different domain than the canonical = broken funnel. Open Graph cards on social shares may 404.
**Effort**: S.
**Files**: `src/app/layout.tsx`, `capacitor.config.ts`, `src/app/api/stripe/create-checkout/route.ts`, `public/robots.txt` (if exists), Vercel project domain settings.
**Plugin lens**: frontend-design, devops.

### H-3 · Web Push for dose reminders (the "feels app-like" bar)
**Description**: PWA-installed `peptidecortex.com` needs Web Push (VAPID + service worker push subscription) to schedule and deliver dose reminders. Without this the web "competes with iOS" claim falls apart for the reminder use-case.
**Why it matters**: dose-time push is one of the only reasons a Pro user would prefer the iOS app over the web app. Closing this gap collapses the remaining "I need the native app" argument.
**Effort**: M.
**Files**: `public/sw.js` (add push event listener), new `src/app/api/push/subscribe/route.ts`, new `src/app/api/push/send-reminder/route.ts`, `supabase/migrations/0007_push_subscriptions.sql`, env vars `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`, scheduling needed (Vercel Cron or Supabase cron).
**Plugin lens**: frontend-design, pwa-readiness, supabase, mcp-builder (cron scheduling).

### H-4 · Auth hardening — re-enable session middleware
**Description**: `middleware.ts` matches `_never_match_this_route_` which disables Next.js middleware entirely. Pages refresh session on each render. While functional, this leaves the door open for stale-cookie state on long-lived pages and gives no central place to enforce "must be authenticated to access `/dashboard`, `/stack`, `/inventory`…". Replace the matcher with a real list, and have the middleware call `updateSession` from `src/lib/supabase/middleware.ts`.
**Why it matters**: session refresh in one place is the standard Next-App-Router-with-Supabase pattern. Defence in depth — even if a page forgets to check `auth.getUser()`, middleware would have already redirected.
**Effort**: S.
**Files**: `middleware.ts`, `src/lib/supabase/middleware.ts`.
**Plugin lens**: security-guidance, code-review.

### H-5 · Stripe webhook idempotency
**Description**: The webhook handler logs `subscription_events` but does not check whether the `provider_event_id` has already been processed. Stripe retries failed deliveries; without idempotency the same renewal can be recorded twice, double-incrementing `subscription_expires_at` or double-emitting analytics events later.
**Why it matters**: billing-system invariants. The fix is a `unique(provider_event_id)` index and a `on conflict do nothing` on the insert.
**Effort**: XS.
**Files**: `src/app/api/stripe/webhook/route.ts`, `supabase/migrations/0008_subscription_events_idempotent.sql`.
**Plugin lens**: payment-integrity, supabase.

### H-6 · Update bloodwork-analyze system prompt to compute peptide count dynamically
**Description**: `src/app/api/bloodwork-analyze/route.ts` line 92 says literal "Peptide Knowledge Base (58 peptides):" — but the underlying file has 81 entries. The model is being lied to about its own context size. Replace with template literal `${PEPTIDE_KNOWLEDGE.length}`.
**Why it matters**: silently misleads the model and silently goes stale every time we add peptides. One-line fix.
**Effort**: XS.
**Files**: `src/app/api/bloodwork-analyze/route.ts`.
**Plugin lens**: code-review, simplify.

### H-7 · Change interaction-checker system prompt from "medical" to "research-literature reference"
**Description**: `/api/check-interaction/route.ts` opens its system prompt with "You are a medical interaction checker…" The word "medical" instructs the model to behave like a medical professional, which contradicts the Terms-of-Service framing that we provide educational reference only.
**Why it matters**: aligns the prompt with the legal posture. Removes a direct discoverable contradiction between code and Terms.
**Effort**: XS.
**Files**: `src/app/api/check-interaction/route.ts` line 45.
**Plugin lens**: security-guidance (legal-risk), code-review.

### H-8 · Delete account / data reset endpoint
**Description**: iOS app added delete/reset in commit `06ab779`. Web has no equivalent. Add `/api/account/delete` that hard-deletes the `profiles` row (cascades clean up by FK), revokes the session, and clears Stripe customer (`stripe.customers.del`).
**Why it matters**: CCPA / GDPR right-to-deletion. Even pre-EU expansion, California and a handful of other states already require this for B2C apps.
**Effort**: S.
**Files**: new `src/app/api/account/delete/route.ts`, new `src/app/settings/page.tsx` if not exists, Stripe SDK.
**Plugin lens**: security-guidance, supabase.

### H-9 · Replace stale README + MARKETING with current state
**Description**: `README.md` calls the app "PeptideTracker", references "58 peptides", and limits users to "max 20." `MARKETING.md` uses the old dark-navy / indigo brand palette (`#0f172a` / `#6366f1`) instead of the cx.* palette. These are the first files any new contributor reads; both currently misinform.
**Why it matters**: future Claude sessions reading these will make wrong-stack decisions. Karim's collaborators (if any) will too.
**Effort**: S.
**Files**: `README.md`, `MARKETING.md`.
**Plugin lens**: docs, frontend-design (brand alignment).

---

## Medium (UX polish, performance, brand alignment)

### M-1 · Refactor 38 KB `src/app/page.tsx` landing into composed sections
**Description**: Single-file 38 KB landing page is hard to read, hard to A/B test, and hard for future Claude sessions to edit safely. Extract `<Hero />`, `<FeatureGrid />`, `<Testimonials />`, `<PricingPreview />`, `<FAQ />`, `<Footer />` into `src/app/(marketing)/_components/`.
**Why it matters**: the landing page is the most-edited file in any consumer SaaS. Composition makes future edits faster and lower-risk.
**Effort**: M.
**Files**: `src/app/page.tsx`, `src/app/(marketing)/_components/*` (new).
**Plugin lens**: code-review, simplify, frontend-design.

### M-2 · Confirm `cx.teal` against Tigris Tech Labs family spec
**Description**: Tailwind defines `cx.teal: #1A8A9E`. Tigris Tech Labs family brand spec names "Neural Teal `#00C9B1`". One of these is wrong. Decide, update `tailwind.config.js`, update PWA manifest theme color, update all inline `#1A8A9E` hex literals (currently ~40+ across the codebase).
**Why it matters**: brand consistency across the Tigris family is the foundation for cross-promotion between Peptide Cortex / PRAIX / alevant-app / Jarvis. If each product has a slightly different teal, the family identity is gone.
**Effort**: S.
**Files**: `tailwind.config.js`, `public/manifest.json`, `src/app/pricing/page.tsx` (many inline `#1A8A9E`), `src/app/terms/page.tsx`, etc.
**Plugin lens**: frontend-design, brand-guidelines.

### M-3 · Add JetBrains Mono if the brand spec calls for it
**Description**: Tigris Tech Labs family typography spec includes JetBrains Mono for data display (mentioned by Karim). Not currently in `tailwind.config.js` or the Google Fonts `<link>` in `src/app/layout.tsx`. Confirm needed, then add font + Tailwind `font-mono` token.
**Why it matters**: consistency across Tigris products that use JetBrains Mono. Numeric data in tables (dose log, inventory mg, bloodwork values) reads more authoritatively in mono.
**Effort**: XS.
**Files**: `tailwind.config.js`, `src/app/layout.tsx`.
**Plugin lens**: frontend-design, brand-guidelines.

### M-4 · Audit `peptide-knowledge.ts` for Schedule III/IV compounds and PED-adjacent content
**Description**: Current file includes growth-hormone secretagogues (CJC-1295, GHRPs, etc.) which are PED-adjacent. Are any compounds in the file actually Schedule III/IV controlled substances or DEA-listed analogues? If yes, either remove or move behind a hard 18+ acknowledgement.
**Why it matters**: DEA and state-AG attention is higher on PED-adjacent content than on general supplement content. Worth knowing what we're carrying.
**Effort**: M.
**Files**: `src/lib/peptide-knowledge.ts`, `Peptides_Master_List_*.xlsx`.
**Plugin lens**: security-guidance, US-legal-risk.

### M-5 · Vendor directory: add "community-reported, not endorsed" framing
**Description**: `/vendors/page.tsx` lists vendors of research peptides. If any listed vendor is later subject to FDA action, public listing without disclaimer can create joint-and-several liability. Add per-vendor disclaimer, add a "report a vendor" link, allow community flagging.
**Why it matters**: vendor liability is a real, recurring risk in this space.
**Effort**: S.
**Files**: `src/app/vendors/page.tsx`.
**Plugin lens**: security-guidance, US-legal-risk.

### M-6 · Replace `localStorage` for client-side state with server-persisted state where appropriate
**Description**: `src/lib/ai-consent.ts` uses `localStorage` for client-side consent caching, which is fine. But several other client-only state surfaces likely use `localStorage` as a stopgap (search hits in many `/app/*/page.tsx` files). Audit and move anything that should survive device switches into Supabase.
**Why it matters**: cross-device parity. A user pays for Pro on desktop, logs in on iPhone Safari, and finds their "stack" empty because it was localStorage-only — that's a refund.
**Effort**: M.
**Files**: grep `localStorage` across `src/`.
**Plugin lens**: code-review, supabase.

### M-7 · Add Supabase TypeScript type generation
**Description**: `src/types/index.ts` hand-defines `Profile`, `StackItem`, `Reminder`, `DoseLog`. These will drift from the actual schema. Run `supabase gen types typescript --project-id <ref> > src/types/supabase.ts` and refactor app code to use the generated types.
**Why it matters**: kills a whole class of "I renamed a column and the build still passes" bugs.
**Effort**: S.
**Files**: `src/types/supabase.ts` (generated), refactor of `src/types/index.ts` consumers.
**Plugin lens**: supabase, code-review.

### M-8 · Standardize Claude model selection via an env-driven config
**Description**: Different routes hardcode `claude-opus-4-5` (web) and `claude-sonnet-4-20250514` (iOS code). When Anthropic ships a new model (e.g. `claude-opus-4-7`, current as of this audit), upgrading means a multi-file grep. Centralize in `src/lib/claude.ts` with named tiers (`MODEL_FAST`, `MODEL_SYNTHESIS`, `MODEL_CREATIVE`) driven by env vars.
**Why it matters**: this codebase already references three different model names. Without centralization it'll be five in six months.
**Effort**: S.
**Files**: new `src/lib/claude.ts`, refactor every `/api/*/route.ts` that constructs an Anthropic client.
**Plugin lens**: claude-api, simplify, code-review.

### M-9 · Add an internal `<DisclaimerBlock />` component and use it on every medical-adjacent page
**Description**: Currently disclaimers are inline strings repeated across `bloodwork-analyze`, `reconstitution`, `dosing`, `regulatory`, `checker`, `reference`, `cycle`, `inventory`, `sites`, `stacks`, `side-effects`, etc. Extract a single component, single source of truth for disclaimer copy, easier to update.
**Why it matters**: legal-language drift is real risk. Counsel updates the Terms; inline disclaimers across 20+ pages stay stale.
**Effort**: S.
**Files**: new `src/components/DisclaimerBlock.tsx`, refactor consumers.
**Plugin lens**: simplify, security-guidance (legal-risk).

---

## Low (hygiene)

### L-1 · Delete unused `ios/` Capacitor wrapper directory
**Description**: `ios/` (Capacitor wrapper) is largely empty (`App/`, one debug.xcconfig). `ios-native/` is the active iOS surface. The presence of two `ios*` directories confuses future readers (and confused this audit until directory listing).
**Why it matters**: clarity. One iOS folder per repo.
**Effort**: XS.
**Files**: delete `ios/` entirely.
**Plugin lens**: simplify.

### L-2 · Add `.env.example` notes for which keys are required for which surface
**Description**: `.env.example` lists 8 env vars without context. New contributors don't know whether `STRIPE_WEBHOOK_SECRET` is only used in the webhook route or globally. Comment each line.
**Effort**: XS.
**Files**: `.env.example`.
**Plugin lens**: docs.

### L-3 · Remove the 234 KB `Complete_Peptide_Bible_v2.pdf` from git tracking
**Description**: The PDF is the source authoring document, not a shipped asset. It bloats every clone by 234 KB and won't be edited in-repo. Move to `T:\TigrisTechLabs\Products\peptide-app-assets\` or similar, add to `.gitignore`.
**Why it matters**: clean repo, faster clones, no LFS needed.
**Effort**: XS (but rewrites history if Karim wants it fully purged — defer to `git filter-repo` only on explicit ask).
**Files**: `.gitignore`, root.
**Plugin lens**: simplify.

### L-4 · `tsconfig.tsbuildinfo` is tracked — it shouldn't be
**Description**: 1 MB `tsconfig.tsbuildinfo` is checked into the repo. It's a TypeScript incremental-build cache and should always be in `.gitignore`.
**Effort**: XS.
**Files**: `.gitignore`, `git rm --cached tsconfig.tsbuildinfo`.
**Plugin lens**: simplify.

### L-5 · Decide and document the canonical email address
**Description**: Terms references `support@tigristechlabs.com`. Pricing FAQ references `support@peptidecortex.com`. Pick one as the public support address. Set up forwarding.
**Effort**: XS.
**Files**: `src/app/terms/page.tsx`, `src/app/pricing/page.tsx`.
**Plugin lens**: docs.

---

## Future Automation Opportunities

These are not ship-blocking; they're force-multipliers for once the app has traction.

### F-1 · Scheduled vendor scraping for price / availability changes
**Description**: A scheduled job (Vercel Cron or Supabase scheduled function) hits each vendor URL in `/vendors`, parses pricing + stock, and updates a `vendor_snapshots` table. The vendor directory becomes a live price-comparison surface — the closest thing to "Kayak for peptide vendors" the community has.
**Why it matters**: defensible-moat content. Users come back daily to check prices. Differentiator vs. the iOS app and vs. any competitor.
**Effort**: L (initial), then ongoing.
**MCP angle**: a `mcp-vendor-scraper` MCP server that exposes `scrape_vendor(url)` and `diff_snapshot(vendor_id)` tools — usable both by the cron job and by future agentic data ops.

### F-2 · Automated content updates from published research
**Description**: A scheduled job tracks PubMed / Semantic Scholar / EFSA for new peptide-related publications, summarizes via Claude, and proposes additions to `peptide-knowledge.ts`'s `keyEffects` / `evidenceLevel` fields. Karim approves via a `/admin/research-queue` page.
**Why it matters**: keeps the Peptide Bible current without manual literature-review effort. Compounds Karim's research moat.
**Effort**: L.
**MCP angle**: a `mcp-research-feed` MCP server exposing `pubmed_search(query, date_from)` and `summarize_abstract(pmid)`. Plugs into both the cron job and any future research-companion agent.

### F-3 · Expand `compatibility checker` entries via an MCP-driven research agent
**Description**: The `stacksWellWith` arrays per peptide are hand-curated and rarely updated. A scheduled agent reads the current knowledge base, picks under-documented pairs, runs deep research (Claude + web search), and proposes new `stacksWellWith` entries with citations.
**Why it matters**: deepens the most-used Pro feature (interaction checker) automatically.
**Effort**: M (after F-2 lands the research-feed MCP).
**MCP angle**: reuses `mcp-research-feed` plus a new `mcp-stack-curator` tool.

### F-4 · Auto-generate the iOS `PeptideData.json` from the same xlsx as the web TS
**Description**: Today the iOS bundle and the web TS file are generated separately, and the iOS strings have drifted more prescriptive. Replace `generate_knowledge.py` with a multi-target script that emits both `src/lib/peptide-knowledge.ts` and `ios-native/PeptideCortex/Resources/PeptideData.json` from the same xlsx. CI runs the script on every push and fails the build if either output is stale.
**Why it matters**: kills the iOS/web content drift permanently. Also closes the legal risk of the more-prescriptive iOS strings — both surfaces use one curated source.
**Effort**: M.

### F-5 · Stripe + Anthropic spend monitoring dashboard
**Description**: A `/admin/economics` page (whitelisted to Karim's account) showing daily Stripe MRR, churn, ARPU, and Anthropic API spend per feature (interaction-check, bloodwork-analyze, chat, etc.). Knows whether each Pro user's API spend exceeds their subscription revenue.
**Why it matters**: this is the only economic instrument Karim has on the business until he hires an ops person. Without it, a heavy Pro user with bloodwork-analysis spam could push the unit economics underwater silently.
**Effort**: M.
**MCP angle**: `mcp-claude-billing` and `mcp-stripe-reporting` are existing Anthropic MCP servers / patterns — wire them.

### F-6 · Continuous regulatory tracker — automate `/regulatory` page
**Description**: `/regulatory/page.tsx` (15 KB) is currently static. A scheduled job hits FDA Drug Shortages, FDA 483 letters, DEA scheduling actions, and the relevant state pharmacy boards, tags entries by peptide, and updates the page.
**Why it matters**: turns a "we list regulatory status" page into a "we are the source of truth for regulatory status" page.
**Effort**: L.

---

## Roadmap Summary

- **Critical**: 5 items — schema reconciliation, Stripe webhook auth, age gate, GitHub org backup, FTC language audit.
- **High**: 9 items — manifest refresh, domain canonicalization, Web Push, middleware re-enable, webhook idempotency, prompt fixes (x2), account-delete, stale docs.
- **Medium**: 9 items — landing refactor, brand-color decision, JetBrains Mono, controlled-substance audit, vendor framing, localStorage migration, Supabase types, model centralization, DisclaimerBlock.
- **Low**: 5 items — delete `ios/`, comment env, untrack PDF, untrack tsbuildinfo, decide support email.
- **Future**: 6 items — vendor scraping, research-feed, stack curator, multi-target content generator, economics dashboard, regulatory tracker.

Total: **34 items**.

Suggested first sprint (one focused session, ~3–4 hours):
- C-3 (age gate, XS)
- H-1 (PWA manifest refresh, S)
- H-2 (domain canonicalization, S)
- H-6 (bloodwork prompt count, XS)
- H-7 (interaction-checker prompt, XS)
- L-1, L-2, L-4, L-5 (hygiene quick wins, all XS)

Then C-1 + C-2 + C-4 as a single Phase-2 sprint focused on the schema/security/continuity floor.

---

_Last audit: 2026-05-23 by Claude (Opus 4.7, 1M context). Repo head: `b611890`._
