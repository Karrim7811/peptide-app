# Peptide Cortex — Refactor Roadmap

Prioritized remediation backlog for the **web app** (`src/`), independent of the iOS-to-web feature migration (see `IOS-TO-WEB-MIGRATION.md` for that). Items are sequenced for impact + risk, with critical / pre-revenue blockers first.

Effort sizes: XS≈<1h, S≈2–4h, M≈half-day, L≈full-day+.

---

## Critical (pre-revenue blockers)

> **Resolved Decisions context (2026-05-23)**: Karim has resolved all twelve previously-open strategic questions. See `CLAUDE.md` §16 for the full list. This roadmap has been re-prioritized accordingly — new Critical items C-6 / C-7 / C-8 / C-9 / C-10 are direct consequences of those decisions.

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

### C-3 · Add age gate at signup — collect DOB, not self-attest
**Description**: Terms of Service §2 requires users to be 18+. Signup form does not collect or verify age. **Resolved decision (CLAUDE.md §16.10)**: collect actual date-of-birth at signup, not a self-attestation checkbox. Store `profiles.dob` (date column). Block signup if computed age is under 18.
**Why it matters**: minors signing up for a peptide research tool is a top-five "viral lawsuit" risk. A real DOB on record is meaningfully more defensible than a self-attested checkbox if challenged.
**Effort**: S.
**Files**: `src/app/signup/page.tsx` (add DOB input + age computation + block), `supabase/migrations/0006_profile_dob.sql` (new column `dob date`), `src/lib/supabase/server.ts` (handle_new_user to persist DOB into profiles).
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

### C-6 · Eliminate non-canonical domains from the codebase
**Description**: **Resolved decision (CLAUDE.md §16.1)**: `peptidecortex.com` is the only canonical production domain. Find and replace every occurrence of `peptidecortex.ai` and `peptidetracker.app` in the codebase. The critical instance is the Stripe checkout origin fallback in `src/app/api/stripe/create-checkout/route.ts` line 16 (`?? 'https://peptidetracker.app'`) — if Stripe ever falls through to that fallback in production, paid users land on a dead domain mid-checkout. Also update `layout.tsx` `metadataBase`, OG tags, and any hard-coded `https://peptidecortex.ai` strings.
**Why it matters**: a real, latent payment-funnel bug. Plus split SEO signal across three domains. Plus inconsistent OG cards on social shares.
**Effort**: S.
**Files**: `src/app/api/stripe/create-checkout/route.ts`, `src/app/layout.tsx`, `capacitor.config.ts` (allowNavigation — keep `peptidecortex.com`, remove others), grep the whole repo.
**Plugin lens**: code-review, payment-integrity, security-guidance.

### C-7 · Reframe reconstitution calculator for US legal defensibility
**Description**: **Resolved decision (CLAUDE.md §16.9)**: keep the reconstitution calculator on web, but change the framing. The math stays; the language must shift from "personal dose" to "solution chemistry":
- Input labels: ask "what's the protocol concentration you want to prepare?" — not "what's your dose?"
- Output labels: "this solution will contain X mcg per Y units on a U-100 syringe at this reconstitution" — describe the chemistry of the solution, not dosing instructions to a person
- Mandatory disclaimer banner above the calculator (use the `<DisclaimerBlock />` component from M-9): _"For research and reference purposes only. Not intended as dosing instructions for human or animal use. Consult a licensed physician before any medical decisions."_

Apple flagged this on Guideline 1.4.2 for a reason that applies to web too — specific dose calculations directed at an individual create US product-liability exposure even outside the App Store regime.
**Why it matters**: this reframing must land before the next public launch push. Without it, the reconstitution feature is the single largest legal-exposure surface on the site.
**Effort**: S.
**Files**: `src/app/reconstitution/page.tsx`, `src/app/api/reconstitution-ai/route.ts` (prompt update — same reframing in the model's instructions).
**Plugin lens**: security-guidance (US-legal-risk), code-review.

### C-8 · Ship interim refund policy + schedule full legal review
**Description**: **Resolved decision (CLAUDE.md §16.12)**: ship the defensible interim policy now; commission qualified counsel for full ToS + refund policy review before any paid marketing.

**Interim policy text to add to Terms of Service §4 and to a new `/refund-policy` page**:
- 7-day refund window on initial **monthly** subscription, no questions asked.
- 14-day refund window on **lifetime** purchase, no questions asked.
- No refunds after the applicable window.
- Cancellation anytime; takes effect at end of current billing period.
- **Auto-renewal disclosure prominent at checkout** (California Business and Professions Code §17602 specifically requires the dollar amount, billing frequency, and cancellation method to be visible at the point of purchase).

**Full legal review**: $500–$2000, required before any meaningful marketing push. Find a SaaS-experienced attorney in California (most stringent jurisdiction for B2C subscription terms — covers the rest by default).
**Why it matters**: California's auto-renewal law in particular has been enforced with class actions; without a compliant checkout disclosure, every monthly subscription is technically voidable by the user. Easy to fix; expensive to ignore.
**Effort**: S to ship interim. External: schedule counsel.
**Files**: `src/app/terms/page.tsx` (update §4 refund language), new `src/app/refund-policy/page.tsx`, `src/app/pricing/page.tsx` (auto-renewal disclosure block above the "Upgrade to Pro" button).
**Plugin lens**: security-guidance (US-legal-risk), payment-integrity.

### C-9 · Geoblock EU IPs at the Vercel edge
**Description**: **Resolved decision (CLAUDE.md §16.11)**: rather than ship GDPR compliance now, geoblock EU traffic at the edge until EU is an actual market. Implement Vercel edge middleware that checks request country (Vercel exposes `request.geo?.country`) and returns a clean static page (`src/app/(geoblock)/eu/page.tsx`) for EU-listed countries with the message "Peptide Cortex is currently available to US-based users only" plus a "join the waitlist" email capture if Karim wants the lead.
**Why it matters**: GDPR applies the instant we have an EU user. The compliance burden is 3–5 days of focused work. We have ~zero EU users today. Solve the problem by not having the problem.
**Effort**: S (1 hour to implement the middleware + page).
**Files**: `middleware.ts` (re-enable with a matcher + country check), `src/app/(geoblock)/eu/page.tsx` (new), `src/lib/geoblock.ts` (new — list of EU country codes).
**Plugin lens**: security-guidance, devops.

### C-10 · Restructure Stripe SKUs to monthly + lifetime; deprecate yearly
**Description**: **Resolved decision (CLAUDE.md §16.4, §16.5)**: collapse pricing to two SKUs — `$9.99/mo` recurring and `$99.99` one-time lifetime. The `$79.99/yr` SKU is removed. Existing annual subscribers are grandfathered until their next renewal, at which point they are offered conversion to monthly or lifetime.
- Create a new Stripe price `STRIPE_PRO_LIFETIME_PRICE_ID` (`mode=payment`, one-time `$99.99`).
- Retire `STRIPE_PRO_YEARLY_PRICE_ID` from env + code.
- Update `lib/stripe.ts` `STRIPE_PRICES` getters.
- Update `pricing/page.tsx` to show two cards (monthly vs lifetime) instead of monthly/yearly toggle.
- Update `create-checkout/route.ts` to branch on `plan: 'monthly' | 'lifetime'`.
- Update `stripe/webhook/route.ts` to handle `checkout.session.completed` events where `mode = 'payment'` (lifetime) by writing `subscription_tier = 'lifetime'` and `subscription_expires_at = null`.
- Email existing annual subscribers about the change (manual ops work).

**Why it matters**: every day the current `$79.99/yr` is in the code is a day a new user can lock in a deprecated SKU. The longer the cleanup waits, the messier the grandfathering becomes.
**Effort**: M.
**Files**: `src/lib/stripe.ts`, `src/app/api/stripe/create-checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/pricing/page.tsx`, `.env.example`, Vercel env vars, Stripe live dashboard.
**Plugin lens**: payment-integrity, supabase.

---

## High (pre-launch quality and SaaS-readiness)

### H-1 · Refresh `public/manifest.json` for proper PWA install
**Description**: Current manifest names the app "PeptideTracker", uses `#0f172a` / `#0f172a` for background/theme color, and references SVG-only icons. None of this matches the current brand. Rewrite manifest with `name: "Peptide Cortex"`, `short_name: "Peptide Cortex"`, `theme_color: "#1A8A9E"` (or whatever Karim confirms as the canonical teal), `background_color: "#FAFAF8"`. Add raster icons at 192/512 (PNG, plus maskable variants for Android adaptive icons and proper iOS apple-touch sizes 152/167/180).
**Why it matters**: this is the single most important PWA polish item. The web app competes with what the iOS app was supposed to be — a high-quality install on the home screen. If the install drops a stale "PeptideTracker" tile, the user immediately downgrades their perception of the product.
**Effort**: S.
**Files**: `public/manifest.json`, `public/icons/*`, `src/app/layout.tsx` (apple-touch-icon link).
**Plugin lens**: frontend-design, pwa-readiness.

### H-2 · _(merged into C-6)_
This item — single canonical domain in `layout.tsx` metadata — is now folded into Critical item C-6 (eliminate non-canonical domains from the codebase). Retained as a placeholder so item numbering across H-3+ is stable.

### H-3 · Web Push for dose reminders — **v1 web-parity requirement**
**Description**: **Resolved decision (CLAUDE.md §16.6)**: Web Push is a v1 requirement of the web-primary pivot, not a nice-to-have. Implement VAPID + service-worker push subscription so PWA-installed `peptidecortex.com` can deliver dose reminders on iOS Safari 16.4+ (when installed to home screen) and all desktop browsers. Server-side: a Supabase cron or Vercel cron job iterates due `reminders` and posts to each subscriber's endpoint via `web-push` library.
**Why it matters**: without Web Push the web app feels like a website. With it, it feels like an app. This is the single feature that closes the "I need the iOS app for reminders" loop. The whole strategic pivot to web-primary hinges on this working well.
**Effort**: M.
**Files**: `public/sw.js` (add `push` and `notificationclick` event listeners), new `src/app/api/push/subscribe/route.ts`, new `src/app/api/push/send-reminder/route.ts`, `supabase/migrations/0007_push_subscriptions.sql` (table for endpoint + p256dh + auth keys, FK to user), env vars `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT`, scheduling via Supabase pg_cron or Vercel Cron.
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

### H-10 · Adopt JetBrains Mono for numeric / data display
**Description**: **Resolved decision (CLAUDE.md §16.3)**: render precise numeric content in JetBrains Mono — dosages, vial concentrations, lab values, dates, IDs, lab ranges. Two benefits: instrument-panel feel that matches the research-tool positioning; and column-wise digit alignment in tables that genuinely improves bloodwork and dose-log readability.

Implementation:
- Add JetBrains Mono to the Google Fonts `<link>` in `src/app/layout.tsx`.
- Add `mono: ['JetBrains Mono', 'monospace']` to `tailwind.config.js` `fontFamily`.
- Migrate existing numeric displays: bloodwork marker tables, inventory `vial_size_mg` and `quantity_remaining`, dose log entries, reminder times, pricing dollar amounts, peptide knowledge `dosageRange` values, reconstitution calculator outputs.
- Convention: use `<span className="font-mono tabular-nums">` for any number that lives next to other numbers in a column.

**Why it matters**: cheap-to-implement, large perceived-quality lift. The brand reads as more "instrument" and less "wellness app", which is the positioning we want.
**Effort**: S (30 min font wiring + S amount of migration across components).
**Files**: `src/app/layout.tsx`, `tailwind.config.js`, then migration across `src/app/log/page.tsx`, `src/app/inventory/page.tsx`, `src/app/reminders/page.tsx`, `src/app/dosing/page.tsx`, `src/app/reconstitution/page.tsx`, `src/app/pricing/page.tsx`, future `src/app/bloodwork/page.tsx`, future `src/components/Vial.tsx`.
**Plugin lens**: frontend-design, brand-guidelines.

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

### M-2 · _(resolved — closed)_
`cx.teal = #1A8A9E` is **locked as intentional**, not drift. The Tigris Tech Labs family Neural Teal `#00C9B1` is used in PRAIX / Jarvis / alevant-app; Peptide Cortex deliberately diverges to a deeper, more clinical teal that better fits the research/peptide positioning. See CLAUDE.md §6 and §16.2. **Future sessions: do not re-open or "fix" this.** Retained as a placeholder to keep M-3+ numbering stable.

### M-3 · _(moved up — see new H-10)_
JetBrains Mono adoption for data display is resolved per CLAUDE.md §16.3 and has been promoted from Medium to High (see H-10 below). Retained as placeholder.

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

### F-7 · EU market re-entry — lift the geoblock + ship full GDPR compliance
**Description**: When EU becomes a target market (intentional EU marketing push, or a deliberate decision to lift the geoblock from C-9), execute the full GDPR compliance program: (a) Data Processing Agreement signed with Supabase, Stripe, Anthropic, Vercel; (b) cookie banner with granular consent; (c) data-export endpoint (`/api/account/export`) and data-deletion endpoint (already covered by H-8 once landed); (d) Privacy Policy GDPR addendum naming the data controller, processors, lawful basis per processing purpose, and data-subject rights; (e) appoint an EU representative if processing at scale per Art. 27; (f) align cookie / tracker behavior with ePrivacy Directive; (g) lift the geoblock middleware from C-9.
**Why it matters**: defers 3–5 days of compliance work until EU is an actual market, instead of front-loading it for zero EU users today.
**Effort**: L (3–5 focused days when triggered).
**Trigger**: first time we actively market to EU OR a deliberate decision to remove the geoblock.

---

## Roadmap Summary

Updated after Karim's resolution of all twelve open questions (2026-05-23).

- **Critical**: 10 items — C-1 schema reconciliation, C-2 Stripe webhook auth, C-3 age gate via DOB, C-4 GitHub-org backup, C-5 FTC language audit, **C-6 domain cleanup**, **C-7 reconstitution reframing**, **C-8 refund policy + counsel review**, **C-9 EU geoblock**, **C-10 Stripe SKU restructure**.
- **High**: 10 items — H-1 PWA manifest, H-3 Web Push (v1 requirement), H-4 middleware re-enable, H-5 webhook idempotency, H-6 / H-7 prompt fixes, H-8 account-delete, H-9 stale docs, **H-10 JetBrains Mono** (promoted from Medium). H-2 merged into C-6.
- **Medium**: 7 items — M-1 landing refactor, M-4 controlled-substance audit, M-5 vendor framing, M-6 localStorage migration, M-7 Supabase types, M-8 model centralization, M-9 DisclaimerBlock. M-2 closed (resolved). M-3 promoted to H-10.
- **Low**: 5 items — L-1 delete `ios/`, L-2 .env comments, L-3 untrack PDF, L-4 untrack tsbuildinfo, L-5 decide support email.
- **Future Automation**: 7 items — F-1 vendor scraping, F-2 research-feed, F-3 stack curator, F-4 multi-target content generator, F-5 economics dashboard, F-6 regulatory tracker, **F-7 EU market re-entry**.

**Total: ~39 items.**

### Suggested first sprint — "Pre-launch legal/financial defensibility floor" (~1 day)

Sequenced because every item below blocks the next round of public marketing or revenue capture, and each is independently small:

1. **C-3** — DOB age gate at signup (S, ~1 hour)
2. **C-6** — kill `peptidecortex.ai` and `peptidetracker.app` references everywhere (S, ~1 hour) — _fixes a latent Stripe checkout bug_
3. **C-7** — reframe reconstitution calculator language (S, ~2 hours)
4. **C-8** — interim refund policy text into Terms + `/refund-policy` page + auto-renewal disclosure on checkout (S, ~2 hours)
5. **C-9** — Vercel edge middleware EU geoblock (S, ~1 hour)
6. **C-10** — Stripe SKU restructure: new lifetime price, retire yearly, update `pricing/page.tsx` (M, ~half-day)
7. **H-1** — PWA manifest refresh (S, ~1 hour) — _biggest perceived-quality lift for the price_
8. **H-6 / H-7** — the two one-line prompt fixes (XS each)
9. **L-1 / L-4 / L-5** — hygiene quick wins (XS each)

This batch can ship as 8–10 small commits in one focused session.

### Suggested second sprint — "Schema + security + continuity floor" (~1 day)

10. **C-1** — schema reconciliation: introspect Supabase, write the missing migrations, adopt the `supabase/migrations/` convention (M)
11. **C-2** — Stripe webhook auth: introduce `lib/supabase/admin.ts` + `SUPABASE_SERVICE_ROLE_KEY`, refactor webhook to use service role (S–M)
12. **C-4** — move repo to a `tigris-tech-labs` GitHub org (XS)
13. **H-4** — re-enable middleware with real route matchers (S)
14. **H-5** — Stripe webhook idempotency (XS)
15. **H-8** — account-delete / data-reset endpoint (S)

### Suggested third sprint — "Web feels app-like" (~1 day)

16. **H-3** — Web Push for dose reminders (M) — _unlocks the strategic pivot_
17. **H-10** — JetBrains Mono adoption (S)
18. **M-7** — Supabase TypeScript type generation (S)
19. **M-9** — `<DisclaimerBlock />` component + migration (S)

After all three sprints, the floor is in place and the iOS-to-web feature migration (IOS-TO-WEB-MIGRATION.md Phase B onward) can proceed safely.

---

_Last audit: 2026-05-23 by Claude (Opus 4.7, 1M context). Repo head: `b611890`._
