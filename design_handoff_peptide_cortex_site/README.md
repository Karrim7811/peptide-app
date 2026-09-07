# Handoff: Peptide Cortex — site reinvention (Home → Library/Bench → Shop → Order)

Date: 2026-09-05 (rev 2 — post-audit). Supersedes the two earlier handoffs in this repo (`design_handoff_peptide_cortex`, `design_handoff_peptide_cortex_v4`) for every screen listed below. Anything not listed (dashboard tools, AI chat, bloodwork, admin) is untouched by this design.

## Overview
A full redesign of the public site and the signed-in shell of the Next.js app in this repo (`src/app`). Three ideas drive it:

1. **Publish the numbers.** Every batch shows its assay, lot, dates and price per mg. Missing data is rendered as a *state* ("no purity figure", "[ $ TBC ]", "no lot yet"), never hidden and never faked.
2. **Reading is free; keeping a bench is Pro.** The library (124 compounds) is fully readable without an account. The bench (vials, schedule, notes, kept preparations) is what the subscription pays for.
3. **The math is third-person.** The reconstitution panel describes what a *solution contains* ("This solution contains 250 mcg per unit…"). It never instructs the reader to inject anything.

## About the design files
Everything in this folder is a **design reference built in HTML** (`*.dc.html` files + plain ES-module data files). They open in a browser and behave like the intended product, but they are **not production code**. The task is to **recreate these screens inside the existing Next.js 14 / Tailwind / Supabase app** in this repo, using its App Router pages, server actions and existing `src/lib` modules. Do not ship the HTML.

`support.js` is only the prototype runtime; ignore it.

**Do not copy, import or port any `.js` data file in this folder** (`library.js`, `vials.js`, `catalog.js`, `shop-data.js`). They are prototype-only snapshots. Read from `src/lib/catalog.ts`, `src/lib/peptide-knowledge.ts` and `src/lib/shop/catalogue.ts`. In particular, third-party assay report codes and the assay lab's name are server-only (`src/lib/vial-reports.server.ts`) and must never reach a client bundle — this revision's `vials.js` carries none and its slugs are the code-free form (`102107-RT_30`), but the TS files are still the only source. After integrating, build and grep `.next/static` for the report-code list held in that server module: it must return nothing. The code list is deliberately not reproduced in this file.

## Vocabulary
User-facing copy says **peptide**, never "compound" (the code's `compound` identifiers are internal and must not surface). Three entries are not peptides — NAD+ (dinucleotide coenzyme), Vitamin B12 (corrinoid), L-Carnitine (amino-acid derivative) — and each says so on its own page via an italic line under the title (see `notPeptideLine` in App). Empty batch list reads "No tested batches on file." (not "no vials").

## Fidelity
**High-fidelity.** Colors, type, spacing, copy and behaviour are final. Recreate pixel-for-pixel. All styles in the prototypes are inline on each element — read the element you are rebuilding for exact values.

## Design tokens (the whole palette — do not add colors)
- Paper `#E6E9EB` (page bg) · Paper-raised `#F4F5F6` (side panels, cards) · Paper-selected `#EDF0F1` (picked radio rows)
- Ink `#1A1D1F` (text, rules, primary button bg, footer bg) · Ink-2 `#3B4045` (body secondary) · Ink-3 `#7E878E` (kickers, meta, inactive tabs) · Ink-4 `#9AA3A9` (placeholder)
- Accent `#1A8A9E` (teal: kickers, current lot, hover, active dot) · Footer text `#C9CED2`
- Hairline rules: `1px solid #1A1D1F` (structural) · `1px solid rgba(26,29,31,.18)` (row dividers) · `rgba(26,29,31,.35)` (inline link underline)
- Radius: **0 everywhere.** No shadows. Structure is drawn entirely with 1px rules and background changes.

### Type (Google Fonts; load Cormorant Garamond 300/400/500 + italics, Jost 400/500, JetBrains Mono 400/500)
- Display/body: **Cormorant Garamond**, weight 300 for headings. H1 `clamp(38px,6.4vw,84px)` lh .98 ls -.03em; H2 `clamp(28px,3vw,40px)` lh 1.05 ls -.024em; H3 `clamp(26px,2.6vw,34px)`; body 17px/1.45 (#3B4045); ledes 18–22px/1.4; italic 19–22px for prompts/placeholders.
- Labels/kickers/buttons: **Jost** 10–11px, uppercase, letter-spacing .18–.26em (kicker 10.5px/.26em; footer 10px/.18em; button 11px/.24em).
- Numbers/codes/lots: **JetBrains Mono** 12–15px body, 20px emphasis, `clamp(30px,3.6vw,44px)` for tally figures.
- `text-wrap: pretty` on all headings and paragraphs.

### Spacing
Page gutter `clamp(16px,3vw,32px)`; section padding `clamp(24px,3vw,40px)` vertical; hero `clamp(40px,7vw,96px)` top. Header row 12–14px vertical padding. Min hit target 44px on all buttons/links that act as buttons.

### Components (recurring)
- **Header**: 1px bottom rule; brand = 7px teal dot + "PEPTIDE CORTEX" (Cormorant 500 15px ls .22em); right-aligned Jost nav; active item has 1px bottom border in ink. Wraps on narrow screens.
- **Footer**: ink bg, `#C9CED2` Jost 10px uppercase; left = `LEGAL` string from shop-data; right = Terms / Privacy / Refunds links.
- **Primary button**: ink bg, paper text, Jost 11px/.24em, padding 14px 22px, min-height 44px; hover → teal bg/border. **Secondary**: same but transparent bg, ink border; hover → ink bg, paper text.
- **Tab row**: Jost labels; active ink + 1px ink underline, inactive `#7E878E`.
- **Fact grid** rows: `grid-template-columns: <label> minmax(0,1fr)`; label Jost 10px uppercase ink-3; value serif 17px or mono 14px; row divider rgba .18.
- **Radio rows** (shipping/payment): full-width block, bg `#EDF0F1` when picked, 8px dot filled ink when picked, transparent otherwise.
- **Disabled CTA**: opacity .4, still rendered; a one-line "why" note sits beside it (never a modal or toast).

## Screens

### 1. Home — `Home.dc.html` → `src/app/page.tsx`
Replaces the current `_landing/*` sections entirely (Hero, ParticleNetwork, Terminal, etc. are retired).
- Header nav: Library → `/reference`, Shop → `/shop`, Sign in → `/login`.
- **Hero**: H1 "Everyone else asks you to trust them. We publish the numbers." + lede (mentions live compound count) + two buttons: "Read the library" (primary → library), "See the seven vials" (secondary → shop).
- **The ledger** (2-col auto-fit ≥420px, 1px rule between): left = GLP-3 Retatrutide 30 mg batch history table (columns: Assayed | Lot | bar | Purity | Measured; mono; current lot in teal; bar width = (purity−99)×100%, min 4%) + line "30.00 mg labelled on every row" / "<lot> shipping now" + link "The full assay →" to the product page. Right (bg #F4F5F6) = 2×2 tally grid (vials on file / with a purity figure / print no purity / went out undated) built from VIALS, a note giving min–max purity, then a wrapped row of mono links to all 7 products.
- **The reference**: kicker with "{n} compounds · {n} categories · free to read"; H2 "Graded by evidence, not by enthusiasm."; paragraph including live count of no-dose entries (currently 41); a **dashed teal search box** ("Look up — [a compound, a brand name, an indication] SEARCH") that submits to `/reference?q=`; right column = Grade | Evidence | Count table from `EVIDENCE_TO_GRADE`, then category chips with counts linking to `/reference?cat=`.
- **Two businesses**: left = Bench subscription card (monthly/annual from `PRICING`, footnote, CTA → signup); right = Shop card (assayed/pending counts, cold-chain line, CTA → shop).
- Footer.

### 2. Auth — `Auth.dc.html` → `/signup`, `/login`, `/reset-password`
One layout, three modes via tab row (Create account / Sign in / Reset password). Two columns ≥860px (form 1.4fr | reasons 1fr, bg #F4F5F6, 1px rule between); stacked below.
- Signup fields: Email, Password ("at least 10 characters"), **Date of birth as three numeric inputs (MM / DD / YYYY)**, digits only. Under-18 → note "Peptide Cortex is for adults. Accounts cannot be created under 18." and CTA note "Nothing was created." CTA disabled (opacity .4) until email regex passes, password present, DOB complete and ≥18. Consent line under form links to Terms + Privacy.
- Login: email + password. Reset: email only → success state "If an account exists for <email>, a reset link is on its way." with "Back to sign in" link.
- Right column "reasons" list: Recall / Age / The bench (copy in file). Below: "Reading the library needs no account. Keeping a bench, or buying, does."
- On success → `/dashboard` (the Bench).

### 3. App shell — `App.dc.html` → `/dashboard` (bench), `/reference` (library), `/reference/[id]` (compound)
Single shell, three views (`?v=bench|library|compound&c=<id>&q=&cat=`). Header: brand → bench; "The bench · Free|Pro" kicker; nav Bench | Library (active underlined) | "Shop ↗" (ink-3) | account handle in mono (`k.reyes`). **Prototype only**: clicking the handle toggles free/pro — in production tier comes from the Supabase subscription row.
- **Layout**: ≥900px two columns `minmax(0,1.55fr) minmax(320px,1fr)` with 1px rule; main left, side column right. <900px single column; when the math panel is open on mobile the side column moves **above** main (order swap) with a 1px rule.
- **Side column** has two states: *Notes* (default) — 2–3 `k / v` items that change per view (see `notes` in logic) — and *The math* (opened by "Open the math" link). Math panel: two inputs (mg in vial, mL water; mL defaults to 2; mg pre-fills from the first vial of the compound), a ruled working (`mg ÷ mL = mg/mL`, `× 0.01 mL = mcg/unit`, `Whole vial = mL×100 units`), a units table (5/10/20/50/100 u → mL, mcg; rows above vial volume omitted), a third-person sentence ("This solution contains X mcg per unit on a U-100 syringe, Y mg per mL, Z mg in total."), and **"Keep this preparation"** → persists `"30 mg in 2 mL"` (prototype: sessionStorage `pc-prep`; production: user row). Label flips to "Preparation kept"; a status line reads "kept · 30 mg in 2 mL" / "nothing kept yet".
- **Bench view**: title "Your bench, one compound." (free) / "Your bench." (pro); subtitle "1 vial · reading is free" / "{n} vials on file · {n} compounds on the schedule". A row of vial glyphs (label, qty·purity floored to integer %, fill height from `STACK.supply`%, cap colour teal for bpc-157, caption = days of supply or lot). Below: table "On the bench · free tier" / "Schedule · next 24 h" with rows name / sub / right-hand mono (schedule + "mg in mL · site" for pro; grade + CV for free). **Free tier shows retatrutide only**; pro shows all `STACK` ids. Free bench also shows the Pro upgrade block with monthly/annual price and `proCta`.
- **Library view**: search input bound to `?q`; subtitle "{results} of {total} · {category} · “{q}”"; category filter row (All + categories with counts, active underlined); result rows: name, brand (from fullName parentheses), category, purpose, grade, "CV n". Empty state text when no results.
- **Compound view**: back link "The library"; name + brand; kicker with category; **grade** letter and **CV** as 5 dots (filled ink for score); fact grid Purpose / Mechanism / Effects / Dosing / Bottom line. **Dosing rule**: if `dosage` matches `NO_DOSE` regex render exactly `"No human dose established."` — never a dash. Vials on file list (qty · lot · mfg or "undated" · purity to 2dp or **"no purity figure"** in ink-3). Stacks-with links. **Cautions and interactions in a boxed block below the facts.** If the compound is sold, a "Buy" link to `/shop/<slug>` (map in `SHOP_BY_ID`). Pro upgrade affordance sits **top-right of compound pages only** (free tier).

### 4. Shop — `Shop.dc.html` → `/shop`
Header nav: Catalogue (current, underlined) | "Cart · n" (mono). Grid of 7 product cards in fixed order (never re-sort): № , name, sub, size, price, **price per mg**, purpose, lot block. Lot states: `assayed` → purity (3dp), measured mg + "+x% over label", mfg/exp; `pending` → `PENDING_LINE` + expected month or `EXPECTED_PLACEHOLDER`. Bracketed values (`[ $ TBC ]`, `[ expected — month TBC ]`) render as-is in mono — they are flagged placeholders, not promises.

### 5. Product — `Product.dc.html` → `/shop/[slug]`
Kicker "№ n of 7". Two columns: left = name/sub/size, price + per-mg, fact grid (purpose, action…), "Add to cart" primary button + "View cart →" link after adding, note "Checkout needs an account · 18+". Right = **the assay**: lot code, purity, labelled vs measured mg, batch history table (same ledger component as Home), shelf line `SHELF`. Cross-link to the compound page in the library.

### 6. Cart — `Cart.dc.html` → `/cart`
Line rows (name, size × qty · lot, total), qty +/− (mono), subtotal, "Checkout" primary → `/checkout`. Empty state links back to catalogue. Prototype stores in sessionStorage (`pc-shop-cart`); production: server actions in `src/app/shop/actions.ts`.

### 7. Checkout — `Checkout.dc.html` → `/checkout`
≥960px two columns 1.5fr | 320px sticky summary (bg #F4F5F6). Sections: **Shipping address** (US only: name, line 1, line 2, city, state, zip), **Method** (radio rows from `SHIPPING`: Standard / Priority / Overnight; price or `[ $ TBC ]`; ETA + "guaranteed"/"estimate"; note explains clock starts at payment confirmation + USPS hand-off), **Payment** (radio rows from `PAYMENT`: Crypto "redirect · minutes", Zelle "in your bank app · ~1 business day"), **Refund policy** block with `REFUND_STATUS` tag. CTA label comes from the chosen rail (`p.cta`) else "Choose a payment method"; disabled until cart non-empty + address complete + rail picked; one-line reason beside it. Place → `createOrder(lines, ship, shippingMethodId, providerId)` → `{orderId, paymentReference, intent}`; `intent.redirectUrl` → send buyer there (BTCPay, then `/order/[ref]` confirming); `intent.instructions` → render the Zelle sheet (§8). `[ $ TBC ]` shipping prices are genuinely unset; do not invent them.

### 8. Zelle instruction sheet — `Zelle.dc.html` → `/order/zelle`
Single column sheet: kicker "Order placed · pay by Zelle"; three large facts — **handle** (`ZELLE_HANDLE`), **exact amount**, **memo code** (order ref e.g. `PC-7K3M`) — each with a "Copy" button (flips to "Copied" for 1.6 s). Steps in prose. Button "Go to the order" → `/order?s=awaiting`; note "The code stays on your order page too."

### 9. Order — `Order.dc.html` → `/order/[ref]`
State machine from `shop-data.STATES`: awaiting · confirming · paid · shipped · delivered · expired · cancelled (prototype exposes a state switcher row; remove in prod). Head + next-step copy per state. **Timeline** rows: Placed / Payment matched|confirmed / Handed to USPS / Delivered (+ terminal row for expired/cancelled): done = filled ink dot, current = teal dot, future = hollow ink-3; dates computed from `placedAt` (+1 d payment for Zelle, +2/+6 d ship/deliver Zelle vs +1/+5 crypto). Awaiting state repeats the Zelle facts with copy buttons. Shipped+ shows USPS tracking + carrier. Right column summary: lines with lot codes ("no lot yet" if pending), payment rail, subtotal, shipping, address, method long-form, `SHELF`. Refund line with ref (hidden on terminal states).

### 10. Legal — `Legal.dc.html` → `/terms`, `/privacy`, `/refund-policy`, `/eu`
≥760px: 200px left tab column (Terms / Privacy / Refunds) | content; stacked below. Content = kicker, title, meta line, lede, then `k / v` sections (label column 140px, 100px mobile). Copy is final and lives in the `PAGES` object in the file. **EU** page hides tabs and header nav (`/eu` is what the edge block serves).

## Route map (prototype → Next.js)
| Prototype | Route |
|---|---|
| Home | `/` |
| Auth?m=signup / login / reset | `/signup` · `/login` · `/reset-password` |
| App?v=bench | `/dashboard` |
| App?v=library[&q&cat] | `/reference` |
| App?v=compound&c=id | `/reference/[id]` (new dynamic route) |
| Shop | `/shop` (new page; `shop/actions.ts` exists) |
| Product?p=slug | `/shop/[slug]` (new) |
| Cart | `/cart` (new) |
| Checkout | `/checkout` (new) |
| Zelle | `/order/zelle` (new) |
| Order?s=state | `/order/[ref]` (new) |
| Legal?page=terms/privacy/refund/eu | `/terms` · `/privacy` · `/refund-policy` · `/eu` |

Out of scope — leave as-is and keep reachable from the new bench shell: interaction checker (InteractionCheck), bloodwork (BloodworkOverlay), AI chat, protocol planner, dosing reference, vial scanner. Do not touch `src/lib/stripe.ts` or `src/app/api/stripe/*`. Wire — do not reimplement — `src/lib/shop/**`, `src/app/shop/actions.ts`, `src/app/admin/orders/`, the BTCPay webhook and `supabase/shop_*.sql`.

## Interactions & behaviour
- Responsive: two-column → one-column at 900px (app), 960px (checkout/order), 860px (auth), 760px (legal). Headers and navs `flex-wrap`. All breakpoints use container/window width measured on mount (prototype uses ResizeObserver); in Next use CSS media queries.
- No animations beyond colour transitions on hover. No toasts, no modals; feedback is inline text (button label flips, note beside CTA).
- Forms never block typing; validation only gates the CTA and writes a one-line reason.
- Tier: `free` shows one bench peptide + upgrade block; `pro` shows full stack schedule. Tier label is in the header kicker.
- Null handling is mandatory copy: purity null → "no purity figure"; mfg null → "undated"; dosage N/A → "No human dose established."; price null → "[ $ TBC ]"; lot pending → "no lot yet" / `PENDING_LINE`.

## State
- Session: `tier`, cart lines `[{slug, qty}]`, order `{ref, lines, ship, method, pay, placedAt, subtotalCents}`, kept preparation string.
- Page: view/query/category filter (URL), math inputs mg/ml, `mathOpen`, copied-button key, auth fields.
- Data: `catalog.ts` (COMPOUNDS, CATEGORIES, EVIDENCE_TO_GRADE, VIALS, STACK), shop payload (PRODUCTS with lot history, SHIPPING, PAYMENT, STATES, LEGAL/REFUND strings). Read `docs/BACKEND-CONTRACT.md` for order/table shapes.

## Assets
None. No images, icons or SVG art — the vial glyphs on the bench are CSS boxes. Fonts from Google Fonts.

## Files in this folder
Home, Auth, App, Shop, Product, Cart, Checkout, Zelle, Order, Legal (`.dc.html`) · library.js, vials.js, catalog.js, shop-data.js, cart.js (data/mocks) · support.js (prototype runtime, ignore).


## Tools.dc.html — the intelligence layer

One file, five tools, tab-switched on `?tool=`: `interactions` · `bloodwork` · `planner` · `dosing` · `scanner`. `?tier=free|pro`, `?phone=1` for the scanner's phone capture page. Bench-shell tokens throughout: #E6E9EB ground, #1A1D1F ink, #1A8A9E accent, Cormorant Garamond / Jost / JetBrains Mono, 1px rules, zero radius, no shadows.

Gating: bloodwork, planner and scanner are Pro. Interactions is free at 3 checks a day. **The dosing reference is never gated**, same rule as the math and side effects.

### Rules the screens enforce (audited, this revision)

- Dosing: research-tier peptides render `NO_DOSE_LINE` — "No human dose established." — in italic serif. Never a blank, dash, em dash or "N/A". Every published figure carries a source column (FDA label · regional label · product PI · published trial); no-dose rows read "nothing to cite · research-tier · no approval".
- **Count correction.** The brief's 81/43 split does not hold in this prototype's `library.js`: anchored classification gives **51 entries with a published figure and 73 without**. The earlier classifier reported 49/75 by matching "no … dose" anywhere in the prose, which discarded cited figures inside otherwise no-dose entries. `NO_DOSE` is now anchored to the opening statement, and both filter chips count live off the data rather than a hard-coded number. Reconcile the true split against `src/lib/catalog.ts` before integration — if 81/43 is correct there, the prototype snapshot is the stale side.
- A no-dose entry that still carries preclinical, discontinued-programme or community-reported figures prints them beneath the no-dose line, rule-separated and labelled "not a dose · what the literature contains instead" (`lib.noDoseContext`). 25 entries are in that state. Neither discarding them nor printing them as an amount was acceptable.
- Dosing has no body-weight, goal, experience or frequency input, and no calculator. Look-up and three filters only.
- Bloodwork never marks, ranks, flags or colours a figure. Inks are ink and grey only; the printed range is shown as the lab printed it, never as a target. Copy states direction across panels and which peptides the literature studies alongside which markers. It never evaluates a value and never recommends a change.
- Planner rows carry peptide · amount · source · time. Where a peptide has no published human dose the amount column prints "No human dose established." with "nothing to cite" beneath — never a number. BPC-157 in the sample plan is that state.
- Every AI surface is labelled AI-generated · Claude at the point of output, in the refinement thread, and on the kept-history panels.
- Full disclaimer, uncollapsed, at the foot of every tool and of the phone capture page.
- First AI use opens a full-screen consent page (v1.0) with what is sent, what is not, who processes it, what is kept, and a decline that keeps the free reference surfaces open. Not a banner.
- Vocabulary: peptides, never compounds; batches, never vials, for lot records.
