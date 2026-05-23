# iOS → Web Migration Plan

Bring the native iOS Peptide Cortex SwiftUI app (`ios-native/`) forward into the Next.js web app at `peptidecortex.com` (`src/`). The web app is the going-forward primary surface; the iOS app will be reframed in a separate effort as a stripped-down educational reference companion to clear App Store Guidelines 1.4.1 and 1.4.2.

See `CLAUDE.md` for context, brand, stack, and known issues.

---

## 1. Feature Inventory

Comparing iOS SwiftUI surfaces (`ios-native/PeptideCortex/Views/`, `ViewModels/`, `Services/`) against the web Next.js surfaces (`src/app/`, `src/components/`, `src/lib/`) and shared API routes (`src/app/api/`). "Shared API" means both surfaces hit the same `/api/*` endpoint.

| # | Feature | iOS Status | Web Status | Migration Priority | Effort | Notes |
|---|---|---|---|---|---|---|
| 1 | **Bloodwork Analyzer UI** | ✅ `BloodworkView` (camera + file import, save results, Create-a-Plan handoff) | 🔴 API only (`/api/bloodwork-analyze`, `/api/bloodwork-ocr`); no `src/app/bloodwork/page.tsx` | **Critical** | M | Top revenue-justifying Pro feature. API is done. Web UI must support paste, drag-drop, and PDF/image upload via `<input type="file">`. |
| 2 | **Protocol Planner UI** | ✅ `ProtocolPlannerView` + `ProtocolPlannerViewModel` (goals → JSON plan, vial mg suggestions) | 🔴 API only (`/api/protocol-plan`, `/api/protocol-consult`); no `src/app/protocol/page.tsx` | **Critical** | M | The "Cortex AI" headline feature. Reuses existing API. |
| 3 | **Vial Scanner UI** | ✅ `VialScannerView` (AVFoundation camera + Claude vision) | 🔴 API only (`/api/scan-vials`); no web entry point | **High** | S | Web equivalent: `getUserMedia` or simple file upload → existing API. |
| 4 | **3D animated vial** | ✅ `SceneKitVial.swift` (glass, liquid, cap, label) | 🔴 Absent | **Medium** | L | Visual identity / craft signal. React Three Fiber port. Optional — gates polish, not function. |
| 5 | **Dashboard "Quick Actions" + animated vial rows** | ✅ Dashboard with vial-based Active Stack rows, supply alerts, streaks | 🟡 Dashboard exists but is feature-light vs iOS | **High** | M | Pull QA card layout and Today's-Doses pattern into web `src/app/dashboard/page.tsx`. |
| 6 | **DoseLog with calendar view, streaks, supply alerts** | ✅ `DoseLogView` | 🟡 `src/app/log/page.tsx` exists, simpler list view | **High** | M | Add calendar grid, streak counter, and supply-running-low alert (joins to `inventory`). |
| 7 | **Smart dose logging + inventory decrement** | ✅ Logging a dose decrements `inventory.quantity_remaining` | ⚪ Unverified on web | **High** | S | Audit `/api/` and client code — likely missing in web. |
| 8 | **Multi-select delete (Stack + Inventory)** | ✅ Recent commit `2a1c3ab` | ⚪ Unverified on web | **Medium** | S | Add bulk-select pattern to `/stack` and `/inventory`. |
| 9 | **Cortex AI Chat** | ✅ `ChatView`, conversational, full-stack context | ✅ `src/app/ai-chat` + `/api/chat` | **None (parity)** | — | Spot-check that web chat loads `stack_items` context the same way as iOS. |
| 10 | **Interaction Checker** | ✅ `CheckerView` (with medicine support) | ✅ `src/app/checker` + `/api/check-interaction` | **None (parity)** | — | Verify web UI exposes medicine + supplement options like iOS does. |
| 11 | **Stack Finder** | ✅ `StackFinderView` | ✅ `src/app/stack-finder` | **None (parity)** | — | Spot-check parity. |
| 12 | **Reconstitution Calculator** | ✅ `ReconstitutionView` (mL/cc unit toggle, schedule preservation from bloodwork) | ✅ `src/app/reconstitution` | **High** | S | Bring the unit toggle and the "preserve existing schedule from bloodwork" flow into web. |
| 13 | **Cycle Tracker** | ✅ `CycleView` + `CycleViewModel` + `Cycle.swift` model | 🟡 `src/app/cycle/page.tsx` exists, but `cycles` table not in `schema.sql` | **Critical** | M | Schema reconciliation first (see roadmap C-1). Then UI parity. |
| 14 | **Injection Sites** | ✅ `SitesView` + `InjectionSite.swift` | 🟡 `src/app/sites/page.tsx` exists, but `injection_sites` table not in `schema.sql` | **High** | M | Schema first. Body-map UI is nice-to-have, list view is fine for v1. |
| 15 | **Side Effects log** | ✅ `SideEffectsView` + `SideEffect.swift` | 🟡 `src/app/side-effects/page.tsx` exists, but `side_effects` table not in `schema.sql` | **High** | M | Schema first. |
| 16 | **Research Notes** | ✅ `NotesView` + `ResearchNote.swift` (bold/italic toolbar reverted) | 🟡 `src/app/notes/page.tsx` exists, but `research_notes` table not in `schema.sql` | **High** | S | Schema first. Skip the rich-text toolbar — reverted on iOS already. |
| 17 | **Reminders** | ✅ `RemindersView` (time + days-of-week) | ✅ `src/app/reminders` | **None (parity)** | — | Web-native push notifications are item #25 below. |
| 18 | **Inventory + Fridge tracker** | ✅ `InventoryView` with vial scanner integration | ✅ `src/app/inventory/page.tsx` (no vial scanner) | **High** | S | Add Vial Scanner button to web inventory once #3 lands. |
| 19 | **Stack management (My Stack)** | ✅ `StackView` showing vial-row layout | ✅ `src/app/stack/page.tsx` (different visual) | **Medium** | S | Visual upgrade — vial rows; or keep simpler web pattern and treat as a design choice. |
| 20 | **Peptide Bible / Reference** | ✅ `PeptideBibleView` (reads `PeptideData.json` from bundle) | ✅ `src/app/reference` (reads `peptide-knowledge.ts`) | **High** | S | Data sync — see §2 content inventory. |
| 21 | **Popular Stacks** | ✅ `PopularStacksView` (24+ named stacks: KLOW, GLOW, Wolverine Stack, Tri-Heal, etc.) | ✅ `src/app/stacks/page.tsx` | **High** | S | Verify all 24+ named stacks from iOS are present in web. |
| 22 | **Vendor directory** | ✅ `VendorsView` | ✅ `src/app/vendors` | **None (parity)** | — | Spot-check. |
| 23 | **Regulatory tracker** | ✅ `RegulatoryView` | ✅ `src/app/regulatory` | **None (parity)** | — | Spot-check. |
| 24 | **Pricing / Upgrade** | ✅ `PricingView` + `StoreService` (StoreKit 2 IAP) | ✅ `src/app/pricing` + Stripe | **None (parity, payment paths diverge by design)** | — | Two payment paths to one `profiles.subscription_tier`. Already correct. |
| 25 | **Push notifications for dose reminders** | ✅ Native APNs (iOS Capacitor PushNotifications plugin in `capacitor.config.ts`) | 🔴 Absent | **Medium** | M | Web Push (VAPID + service worker subscription). Required if `peptidecortex.com` is going to feel app-like. |
| 26 | **About / version / legal links** | ✅ `AboutView` (version, privacy policy, user agreement, AI consent) | 🟡 Links exist but no dedicated About page | **Low** | XS | Add `src/app/about/page.tsx`. |
| 27 | **AI Consent flow** | ✅ `AIConsentManager` + `AIConsentSheet` (native, 5.1.1/5.1.2 compliant) | ✅ `AiConsentProvider` + `AiConsentModal` + `/api/ai-consent` | **None (parity)** | — | Both surfaces persist `user_metadata.ai_consent_granted` with version `1.0`. |
| 28 | **Apple Sign In** | 🟡 Removed temporarily for App Store review (`5848366`) | 🔴 Absent on web | **Low** | M | Supabase supports Apple OAuth on web. Not required for v1 web parity. |
| 29 | **Google Sign In** | ✅ Code present in iOS | 🔴 Absent on web | **Low** | S | Supabase supports Google OAuth. Nice-to-have. |
| 30 | **Delete account / data reset** | ✅ Recent commit `06ab779 feat: delete/reset, legal disclaimers, Cortex AI consultation flow` | ⚪ Unverified on web | **High** | S | Required for GDPR / CCPA compliance even pre-EU. Verify and port. |
| 31 | **Drawer menu** | ✅ `DrawerMenu.swift` with descriptions per tab | ✅ `src/components/MobileNav.tsx` and `Sidebar.tsx` | **None (parity)** | — | Verify web drawer descriptions match iOS. |
| 32 | **Peptide autocomplete in inputs** | ✅ Recent commit `bb469d9` | ⚪ Unverified on web | **Medium** | S | Add typeahead component reading from `peptide-knowledge.ts`. |
| 33 | **Peptide news feed (Market Pulse)** | ✅ Dashboard news strip | ✅ Dashboard `MarketPulse.tsx` + `/api/market-pulse` | **None (parity)** | — | Spot-check. |
| 34 | **Bloodwork → "Create a Plan" handoff to Protocol Planner** | ✅ Recent commit `ff0874f` | 🔴 Will land after items #1 and #2 | **High (composite)** | S | Glue work once both UIs exist. |

---

## 2. Content Inventory

Both surfaces ultimately read from the same Excel master (`Peptides_Master_List_FULL_Explainers_CV_Interactions_Dropdowns.xlsx`), but the transpile targets diverge:

| Content surface | iOS | Web | Drift |
|---|---|---|---|
| **Per-peptide entries (Peptide Bible)** | `ios-native/PeptideCortex/Resources/PeptideData.json` — bundled with the iOS app | `src/lib/peptide-knowledge.ts` — auto-generated by `generate_knowledge.py` | The `dosageRange` strings in `PeptideData.json` are **noticeably more detailed and prescriptive** than the same field in `peptide-knowledge.ts`. e.g. Semaglutide: iOS says "Start 0.25mg/week for 4 weeks, then 0.5mg for 4 weeks, then 1.0mg, up to max 2.4mg/week. Inject same day each week. Titrate slowly to minimize nausea." Web says "0.25 mg weekly titration up to 1.7–2.4 mg weekly (Wegovy)". **Two separate questions arise: (a) which is source-of-truth; (b) the more prescriptive iOS strings create more US legal exposure if exposed on the web verbatim.** See risk register #1. |
| **Peptide count** | 81 entries (per commit `bcd64d8 ... 81 total`) | The web bloodwork-analyze system prompt literal says "Peptide Knowledge Base (58 peptides)" — almost certainly stale; the file itself likely has the 81 entries. | Audit web peptide-knowledge.ts entry count vs iOS JSON entry count. Sync both to the xlsx master. Fix the hard-coded `58` in `bloodwork-analyze/route.ts`. |
| **Named stacks** | 24+ stacks in iOS (KLOW, GLOW, Wolverine Stack, Tri-Heal, etc. per commits `dfa5724`, `bcd64d8`) | Web `src/app/stacks/page.tsx` (26 KB) and `src/app/stack-finder/page.tsx` likely already have most; needs side-by-side verification | Diff iOS stack catalog vs web. |
| **Goal categories** | 12 categories in `PeptideKnowledge.swift` | 12 categories in `peptide-knowledge.ts` (`PEPTIDE_CATEGORIES`) | Confirm exact parity of labels. |
| **Vendor directory** | `VendorsView` data source | `src/app/vendors/page.tsx` (27 KB inline data) | Confirm vendor list parity. |
| **Regulatory data** | `RegulatoryView` | `src/app/regulatory/page.tsx` (15 KB) | Confirm parity. |
| **Stacking compatibility (`stacksWellWith`)** | Per-entry array in `PeptideData.json` | Per-entry array in `peptide-knowledge.ts` | Should be identical post-regenerate. |
| **Spanish translations** | Not present in iOS code | Not present in web code | Neither surface is localized. Add to "future" if Karim wants LATAM growth. |
| **Side-effect reference content** | `SideEffectsView` | `src/app/side-effects/page.tsx` (22 KB) | Spot-check parity. |

**Recommended content workflow going forward**: keep the xlsx as the single source of truth. Run `python generate_knowledge.py` to regenerate `src/lib/peptide-knowledge.ts`. Then write a second script (`generate_ios_data.py`) that emits `PeptideData.json` from the same source — so the iOS bundle and the web knowledge can never silently drift again.

---

## 3. Design Inventory

Visual / UX elements in the iOS app that should carry to web:

| iOS element | Migration target | Notes |
|---|---|---|
| **Vial-row pattern** — every stack item displays as a stylized vial with auto-shrink labels (commits `72497a1`, `b15f0db`) | A React component in `src/components/Vial.tsx` rendering an SVG vial with size-responsive label | Identity-carrying. Use the same uppercase, single-line, auto-shrink rule. |
| **3D SceneKit vial** | React Three Fiber + `<Canvas>` component, optional behind a feature flag | High-craft polish. Defer until parity is hit. |
| **Quick Actions card grid** on Dashboard | Tailwind grid in `src/app/dashboard/page.tsx` | Each card: icon, title, one-line description, deep-link. |
| **Today's Doses with animated vials** | Web equivalent with CSS / framer-motion animation on the vial component | Lighter than SceneKit but visually consistent. |
| **Light-mode lock** (commit `41df606`) | Already enforced by `body { background: '#FAFAF8' }` in `src/app/layout.tsx` | Good. |
| **Drawer menu with per-tab descriptions** (commit `dec1525`) | Verify `src/components/MobileNav.tsx` and `Sidebar.tsx` show descriptions | Cheap polish. |
| **Bottom nav (back / dashboard shortcut)** (commit `157d523`) | Web has `BottomNav.tsx` — verify parity | — |
| **Black text in input fields** (commits `72c3504`, `6111b3b`, `a2e3063`) | Web is light-mode-default so usually fine; spot-check `<input>` `color:` in Tailwind | — |
| **App icon redesign** (commit `bac8f55`) | iOS Assets.xcassets has the canonical icons; web `public/icons/` needs the same set | Critical for PWA install. |
| **Apple touch icon / splash** | Already linked in `src/app/layout.tsx` | Verify the actual SVG matches the redesigned iOS icon. |
| **AI consent sheet visual** | `AiConsentModal.tsx` already exists; verify copy matches iOS `AIConsentSheet.swift` | Compliance-relevant — copy must match. |

---

## 4. Database Schema Diff (iOS Swift models vs `supabase/schema.sql`)

iOS models that map cleanly to tables already in `schema.sql`:

| Swift model | Table | Status |
|---|---|---|
| `Profile.swift` | `profiles` | ✅ |
| `StackItem.swift` | `stack_items` | ✅ |
| `Reminder.swift` | `reminders` | ✅ |
| `DoseLog.swift` | `dose_logs` | ✅ |
| `InventoryItem.swift` | `inventory` | ✅ |
| `BloodworkResult.swift` | `bloodwork_results` | ✅ |
| `PeptideKnowledge.swift` | _N/A — local bundle data, not a DB table_ | ✅ |

iOS models that **do not** have a matching table in `supabase/schema.sql`:

| Swift model | Implied table | Schema action needed |
|---|---|---|
| `Cycle.swift` | `cycles` | Write `supabase/migrations/0002_cycles.sql` (`id`, `user_id`, `name`, `compound_name`, `start_date`, `end_date`, `dose`, `notes`, `created_at`) + RLS |
| `InjectionSite.swift` | `injection_sites` | Write migration (`id`, `user_id`, `dose_log_id?`, `site_name`, `notes`, `used_at`, `created_at`) + RLS |
| `ResearchNote.swift` | `research_notes` | Write migration (`id`, `user_id`, `title`, `body`, `compound_name?`, `created_at`, `updated_at`) + RLS |
| `SideEffect.swift` | `side_effects` | Write migration (`id`, `user_id`, `stack_item_id?`, `description`, `severity`, `started_at`, `resolved_at?`, `notes`, `created_at`) + RLS |

**Reverse direction**: every table currently in `schema.sql` already maps to an iOS model. No iOS-side schema gap.

**Schema hygiene gap**: `supabase/schema.sql` is one monolithic file plus two more (`subscription_migration.sql`, `admin_access.sql`). There is no versioned `supabase/migrations/` folder, no `seed.sql`, no `supabase.config.toml`. This means migrations are applied by hand via the Supabase SQL editor. Roadmap C-1 introduces the formal `supabase/migrations/` convention so future schema changes are tracked.

---

## 5. Recommended Migration Order

Sequenced for highest user value first, with dependency order respected. Effort sizes use XS/S/M/L (where XS≈<1h, S≈2-4h, M≈half-day, L≈full-day+).

### Phase A — Schema reconciliation (unblocks everything else)
1. **C-1: Introspect Supabase project and write missing migrations** for `cycles`, `injection_sites`, `research_notes`, `side_effects`. Move `schema.sql` into `supabase/migrations/0001_init.sql` and adopt the Supabase CLI migration convention. Effort: M.
2. **Verify which tables the existing `/cycle`, `/sites`, `/notes`, `/side-effects` pages actually write to** — they may currently be writing to localStorage or to tables that exist remotely but aren't checked in. Effort: S.

### Phase B — Highest-value Pro features that already have backends (UI gap closure)
3. **Bloodwork Analyzer web UI** (`src/app/bloodwork/page.tsx`) — paste markers, file upload via `/api/bloodwork-ocr`, display analysis + recommendations + warnings from `/api/bloodwork-analyze`, save to `bloodwork_results`. Effort: M.
4. **Protocol Planner web UI** (`src/app/protocol/page.tsx`) — goals form, calls `/api/protocol-plan`, renders JSON plan, links to `/reconstitution` per peptide. Effort: M.
5. **Vial Scanner web UI** — file upload or `getUserMedia` → existing `/api/scan-vials` → auto-fills new inventory or stack item. Effort: S.
6. **Bloodwork → Create-a-Plan handoff** (depends on #3 and #4). Effort: XS.

### Phase C — Tracking parity polish
7. **DoseLog calendar view + streaks + supply alerts** on `/log`. Effort: M.
8. **Smart-dose logging that decrements `inventory.quantity_remaining`** — backend logic. Effort: S.
9. **Multi-select delete** on `/stack` and `/inventory`. Effort: S.
10. **Delete-account / data-reset flow** in user settings. Effort: S.

### Phase D — Reference & content parity
11. **Sync `peptide-knowledge.ts` with the latest xlsx** (regenerate) and add a second emitter for `PeptideData.json` so iOS and web cannot drift. Effort: S.
12. **Fix the hard-coded `58 peptides` literal** in `bloodwork-analyze/route.ts`. Effort: XS.
13. **Audit web Popular Stacks vs iOS Popular Stacks** — confirm KLOW / GLOW / Wolverine / Tri-Heal etc. all present. Effort: S.

### Phase E — Visual identity & craft
14. **`<Vial />` React component** matching the iOS vial rows (SVG, uppercase, auto-shrink). Effort: S.
15. **Dashboard Quick Actions card grid + Today's Doses row.** Effort: M.
16. **Reconstitution: mL/cc unit toggle + preserve schedule from bloodwork.** Effort: S.
17. **3D vial WebGL port** (React Three Fiber). Effort: L. **Optional, gated behind feature flag.**

### Phase F — PWA / web-native delight
18. **Refresh `public/manifest.json`** with correct app name (`Peptide Cortex`), theme colors (`#FAFAF8` / `#1A8A9E`), and rasterised icon set (192, 512, plus iOS-touch sizes). Effort: S.
19. **Web Push reminders** (VAPID keys + service-worker push subscription + dose-time scheduling). Effort: M.
20. **Splash screens** for iOS home-screen install. Effort: S.

### Phase G — Optional auth
21. **Google OAuth** via Supabase. Effort: S.
22. **Apple OAuth** via Supabase. Effort: M.

---

## 6. Risk Register — What Should NOT Migrate to Web (US Legal / Liability)

The web app is not bound by App Store Guidelines but is bound by US law. Several iOS features carry legal exposure that needs deliberate framing, gating, or in some cases a deliberate decision **not** to ship on web.

| Risk | Source feature | Exposure | Recommended posture |
|---|---|---|---|
| **R-1: Prescriptive dosing strings** | `PeptideData.json` `dosageRange` fields ("Start 0.25mg/week for 4 weeks, then 0.5mg…") | Reads as practicing medicine without a license; FDA labeling adjacency; product-liability surface if a user injures themselves following the schedule. | Either (a) keep the **less prescriptive** strings from `peptide-knowledge.ts`, or (b) wrap the prescriptive strings inline with a "research-literature reference, not a prescription" badge per row. Do NOT show the prescriptive version unauthenticated. |
| **R-2: Personalized AI dose recommendations** | `/api/protocol-plan` outputs a structured personalized plan including injection schedules | Personalized medical recommendation to an individual = practicing medicine in most US states. | Already partially mitigated by AI consent flow + Terms §1. Add: (a) explicit on-page "this is a generated reference, not a prescription"; (b) suppress patient-specific framing in the prompt — generate a "research-literature plan template" instead of "your plan"; (c) require AI consent already enforced ✅. |
| **R-3: Bloodwork interpretation** | `/api/bloodwork-analyze` analyses lab markers and suggests peptides | Reads as diagnosis + treatment recommendation when applied to a real person's lab values. | Already framed as educational reference in the system prompt (good). Add: (a) hard ceiling on tokens; (b) refuse if markers are dangerously out-of-range (auto-redirect to "see a doctor immediately" instead of suggesting peptides); (c) log every analysis request to `bloodwork_results` with the user's consent state at the time. |
| **R-4: Recon calculator (the 1.4.2 issue on iOS)** | `/reconstitution` calculates injection volumes from vial mg + desired dose | Apple flagged this as needing manufacturer/institutional sponsorship. On web it's allowed but still creates product-liability surface — if the math is wrong and someone overdoses, that's a lawsuit. | Keep, but: (a) display the math, not just the result, so users can verify; (b) clamp to research-grade peptides only (no insulin, no controlled substances); (c) add a per-page disclaimer; (d) cover with the existing Terms §7 (As-Is) and §8 (limited liability). |
| **R-5: Interaction Checker labelled "medical interaction checker"** | `src/app/api/check-interaction/route.ts` system prompt opens with "You are a medical interaction checker…" | The word "medical" in the system prompt instructs the model to behave like a medical professional. Terms says we don't provide medical advice; the prompt says we do. | Change the prompt to "You are a research-literature reference for compound interactions…" — keep the underlying behavior, change the framing word. Effort: XS. |
| **R-6: Inviting users to enter their own dosing into a "schedule"** | Reminders + dose log + cycle UI | Lower exposure (it's user-entered data, not advice), but worth a "you are responsible for these schedules" disclaimer on first reminder creation. | Add one-time onboarding modal acknowledging responsibility. |
| **R-7: Cycle Tracker / SARMs / unscheduled compounds** | iOS has cycle support; peptide knowledge includes some compounds bordering on PED territory (e.g. growth-hormone secretagogues) | DEA / FDA / state-AG attention is higher on PED-adjacent content. | Audit `peptide-knowledge.ts` for any Schedule III/IV substances or unapproved drugs marketed to humans. Anything questionable: scrub or move behind a stronger 18+ acknowledgement. |
| **R-8: Vendor directory** | `/vendors` lists vendors of research peptides | Vendors selling unapproved drugs are sometimes the target of FDA action; being publicly tied to specific vendors can create joint-and-several liability if a vendor is later prosecuted. | Frame vendor entries as "community-reported, not endorsed", display a per-vendor disclaimer, allow community to flag inactive/sketchy vendors. Already partially in place — confirm copy. |
| **R-9: Selling Pro access to under-18 users** | Signup form does not collect or verify age | Terms requires 18+, but signup doesn't enforce it. Stripe and Supabase will not check. | Add age-acknowledgement checkbox at signup (self-attested 18+). Effort: XS. |
| **R-10: Bloodwork PDF uploads (PII / PHI)** | `/api/bloodwork-ocr` accepts PDFs that may contain a patient's name, DOB, MRN | Even though we're not a covered entity under HIPAA (B2C app), state laws (CA, IL, NY, MA) have their own health-data regimes. Sentry/log data should not retain the PDF content. | Strip PII from logs; consider client-side redaction before upload; document handling in Privacy Policy. |
| **R-11: Anything that reads as "treats / cures / diagnoses / heals"** | Marketing copy on `/`, `/pricing`, `/ai-chat` | FTC will pursue health-claim false-advertising independent of FDA. | Replace any direct outcome claims with "users report" / "research suggests" / "studies have investigated". Audit `src/app/page.tsx`. |

**iOS-only features that should remain iOS-only:**
- StoreKit 2 IAP — web has Stripe; no reason to add native-IAP semantics on web.
- AVFoundation-native camera capture — web should use `<input type="file" accept="image/*" capture="environment">` and / or `getUserMedia`, which is simpler.
- APNs push — replaced by Web Push on web.
- 3D SceneKit vial — direct port unnecessary; React Three Fiber is the web-native replacement.

---

## 7. Done-Definition Checklist

When the migration is "done" the web app should pass each of these:

- [ ] Every iOS view has a web equivalent at the URL implied by its name (no 404s).
- [ ] Every iOS feature that hits a `/api/*` endpoint is wired in the web UI to that same endpoint.
- [ ] `peptide-knowledge.ts` entry count equals `PeptideData.json` entry count, and both are regenerated from the same xlsx in one CI step.
- [ ] All four missing tables (`cycles`, `injection_sites`, `research_notes`, `side_effects`) have versioned migrations in `supabase/migrations/`.
- [ ] PWA installs cleanly to iPhone home screen with the correct name, icon, and splash.
- [ ] Web Push delivers a test dose reminder.
- [ ] Disclaimer text on every medical-adjacent page reads the same as Terms §1.
- [ ] Age-gate on signup is in place.
- [ ] Top-level marketing copy on `/` has been audited against R-11 (no "treats / cures / diagnoses").
- [ ] All three canonical domains (`peptidecortex.com`, `peptidecortex.ai`, `peptidetracker.app`) point to the same Vercel deployment OR the duplicates are removed from code.

---

_Last audit: 2026-05-23 by Claude (Opus 4.7, 1M context)._
