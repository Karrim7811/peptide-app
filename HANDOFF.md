# Handoff — 2026-09-07

Read `CLAUDE.md` first, then this. Where they disagree, this is newer.
Supersedes the 2026-09-06 handoff.

`main` = pushed and deployed. **398 tests passing, `tsc --noEmit` clean,
`next build` succeeds, no assay report codes in `.next/static`.**
peptidecortex.com is serving the rebuilt site.

---

## Read this before you look for a design file

**The V3 design handoff is now IN the repo**, at
`design_handoff_peptide_cortex_site/`. The previous handoff told you to read
`Shop.dc.html`, `Zelle.dc.html` and `Order.dc.html` before writing a page, and
none of the three was in the repo. They were in a zip on the OneDrive Desktop,
in three revisions with nearly the same name, and only V3 carries
`Tools.dc.html`. That cost the first hour of this session. It will not cost you
one.

The seven prototype `.js` data files are deliberately NOT committed —
`WHY-THE-DATA-FILES-ARE-MISSING.md` in that folder says why and where the real
data lives. The `.dc.html` screens will not run standalone without them. They
are a reference to read, not a prototype to execute.

---

## The sign-in wall — built 2026-09-07. Age is 18, not 21.

The requirement the previous edit of this file recorded as unstarted:

> A login page ASAP. The site cannot be accessed without signing in, and
> without asking if the user is 21 or older. They can see some info about what
> the website is and what it does. They cannot go direct to the shop without
> acknowledging they are 21+, and to go to the shop they need to sign up.

Both open questions were put to Karim and settled; the reasoning is in
CLAUDE.md §16.13 so it is not re-asked. In short:

- **18, not 21.** No US law sets an age for research peptides; contract
  capacity is the only hook and 18 is the floor in 47 states. 21 was offered
  as the conservative posture for a seller and declined. Nothing about the age
  changed in code, SQL or copy. One age, everywhere.
- **The wall covers the shop, the bench and the tools.** The library, the
  dosing reference and the guides stay public, so Home keeps telling the truth
  and search engines keep the content that brings people to the shop.

**What shipped:**

- `src/app/shop/layout.tsx` — one gate over the catalogue, every product, the
  cart, checkout and the order pages. A signed-out visitor sees
  `src/components/shop/AgeGate.tsx` in place, at the URL they asked for. It
  is a signpost to the signup form (where the date of birth is collected), not
  a checkbox — §16.10 still holds. Signed-in visitors pass; the stored date is
  enforced at checkout as before.
- `src/lib/auth/next.ts` — `?next=` return-to, validated to a same-origin
  path. The auth screen, its three pages and their tab links carry it; the
  four gated tool pages (checker, bloodwork, planner, scanner) write it with `loginUrl()`. Tested.
- `src/middleware.ts` forwards the request path as `x-cortex-pathname`; the
  shop layout reads it (`src/lib/auth/pathname.ts`) so the visitor lands back
  on the product they clicked.

**Found on the way, and it matters more than the wall: the middleware had
never run.** It lived at the repo root as `middleware.ts`, and Next.js ignores
that location when a `src/` directory exists — the build manifest carried
`"middleware": {}`. The EU geoblock (§16.11) has therefore never blocked
anyone. Moved to `src/middleware.ts`; verified in the build output
(`ƒ Middleware 27.1 kB`) and by the header reaching the layout. **The geoblock
goes live with this deploy.** `request.geo` is only populated on Vercel, so it
cannot be exercised locally; watch `/eu` traffic after deploy. CLAUDE.md §13.2
called the middleware a no-op for a different, older reason; corrected.
- The bench and those four tools already redirected to `/login`; the tools
  now return the visitor to the page that refused them, and the bench is
  the default landing so it needs no parameter.

**Not done, on purpose:** no age interstitial for signed-in users, no
sessionStorage "I am 18" flag, no gate on the library. If any of those is
wanted it is a new decision, not a gap.

---

## Where to start

**All eleven V3 screens are built.** Home, Auth, Legal, the library, the
compound page, Shop, Product, Cart, Checkout, Zelle, Order, the bench, and all
five tools — interactions, bloodwork, planner, dosing, scanner.

What is left:

1. **The Mirror's own styling — first pass done 2026-09-07, see below.** It
   sits at `/mirror`, holds every write path, and now speaks V3 by default.
   What remains is optional: the panel and verify-tab LAYOUTS are the older
   Mirror design's, not App.dc.html's side column. No V3 file draws the field,
   so there is nothing to transcribe; treat any further pass as design work.

That is the whole list of remaining code. Everything else blocking launch is in
the shop section below and none of it can be done from this repo.

## The Mirror on paper — 2026-09-07

There is no V3 design for the Mirror. `design_handoff_peptide_cortex_site/`
lists it as out of scope ("leave as-is and keep reachable from the new bench
shell"), and `App.dc.html` draws the bench, not the field. So "make it speak
V3" could not mean transcribing a prototype. It meant the palette and the
chrome, and the Mirror's architecture made the palette almost free:

- **Every Mirror component reads ground tokens** — `var(--ink)`, `var(--panel)`,
  `bg-ground`, `text-faint` — resolved by `src/lib/design/grounds.ts`. So the
  V3 palette was added as a fourth ground, `paper`, and became the Mirror's
  default. Six hundred token usages followed without an edit.
- **The ground is scoped to the Mirror, not to `<html>`.** `DEFAULT_GROUND`
  is still midnight and must stay so: the AI consent screen, `/pricing`, the
  guides, `/welcome` and `/reset-password` still read the global variables
  and were designed dark. `MirrorShell` writes its own ground onto its root
  element (custom properties cascade; nothing in the Mirror portals), and
  `MirrorClient` remembers the choice under `cortex-mirror-ground`, separate
  from the site key. Switching one never moves the other. **Do not "simplify"
  this by changing `DEFAULT_GROUND`** — it repaints five other surfaces.
- **Two V3 inks do not pass as Mirror text.** Ink-3 `#7E878E` is 3.0:1 on
  paper and Ink-4 `#9AA3A9` is 2.1:1; the Mirror sets 9–10px mono in those
  tiers. Paper's `faint`/`faintest` are darkened until they clear 4.5:1, and
  the accent steps from `#1A8A9E` to `#156F80` for the same reason. The V3
  pages keep the lighter inks; they set them larger. `grounds.test.ts` now
  asserts the ratios for every ground — the file had promised 4.5:1 for two
  months with nothing checking it.
- **`MirrorShell` is the V3 chrome**: brand → bench, "The field · Free|Pro",
  Bench | Library | Shop ↗, then the Mirror's own row — breadcrumb, ground,
  tier preview, Bloodwork, Ledger — as segmented controls under a 1px ink
  rule. Zero radius, no shadows, tokens throughout so the dark grounds still
  work. Verified by screenshot in paper and midnight on a production build.
- The free-tier footer note said **"58 IN LIBRARY"**; the library has held 124
  for some time. It now reads `COUNTS.compounds`.
- `src/app/mirror/MarketPulse.tsx` was dead — nothing imported it — and the
  last file in the tree with `rounded-2xl` and a hex border. Removed.


`/api/protocol-consult` is still uncalled. It is a PRE-plan intake (goals in,
questions or a recommendation out) and was never the refinement thread — that
is `/api/protocol-refine`, which is built. Wiring consult as a guided intake on
the planner is optional polish, not a gap.

## /dashboard and /mirror — read this before moving anything

**The bench is at `/dashboard`. The Mirror is at `/mirror`, unchanged.**

The Mirror was not replaced. Twelve routes redirect into it carrying query
params only it reads — `?bloodwork=1`, `?tab=cycle`, `?ledger=1`,
`?tab=rotation` — and it holds every write path the app has: adding a stack
item, logging a dose, editing inventory, cycles, notes, side effects. The bench
is a read surface that understands none of that.

Ten routes still redirect there. `/checker` and `/bloodwork` were among them
and are now screens of their own.

If you point those redirects back at `/dashboard`, the app's only data entry
becomes reachable by no route at all. `docs/design-integration-prompt.md` §5
warns about exactly this. The eleven `revalidatePath` calls in
`src/app/dashboard/actions.ts` target `/mirror` for the same reason — the
actions file kept its path, the surface it revalidates did not.

**Read the element you are rebuilding.** Every style in the prototypes is inline
on the element and the values are exact. Approximating drifts, and it shows
immediately next to the screens that were transcribed.

---

## What this session did

**The whole public site plus the bench, planner and scanner, rebuilt from V3
and deployed.** Home, the library at
`/reference` and `/reference/[id]`, the dosing reference at `/dosing`, signup /
sign-in / `/forgot-password`, Terms, Privacy, Refunds, `/eu`, the Zelle sheet
and the order page. Plus the vial scanner at `/scanner`.

**Four things that were wrong rather than merely unbuilt:**

1. **Checkout was a dead end.** It collected the address fields, never read them
   into state, and its button called nothing. Now wired to `createOrder`.
2. **The library was behind auth while Home advertised it as free to read.** The
   most public page promised something the next click refused. So was the dosing
   reference, which the rules single out as never-gatable.
3. **`/dosing` was a redirect**, though CLAUDE.md §16.9a said a dosing reference
   was built. It is built now.
4. **The AI routes could still invent a dose.** See below.

---

## The dose count, settled

Five splits had been written into the docs (81/43, 49/75, 43/81, 63/61, 73/51).
None was a transcription error. **The question was asked as a binary and the
data has three states**, so every rule had to put the middle one on a side.

| State | n | What it is |
|---|---|---|
| `published` | 26 | An actual amount — a number attached to a dose unit |
| `labelOnly` | 25 | Points at a label, a PI, a country or a hospital protocol without naming an amount |
| `none` | 73 | No human dose. 25 in researched prose, 48 as the port's "N/A" |

The 81 and the 51 both counted `labelOnly` as published. "Product-specific
dosing (endocrinology)" is not a figure.

`src/lib/dosing.ts` computes this live and `dosing.test.ts` asserts it, so a
catalogue edit that moves an entry between states fails a test rather than
quietly changing a number on the home page. **Do not hard-code these anywhere.**

Ten of the 73 still cite rodent or discontinued-programme figures after the
no-dose sentence. `noDoseContext()` returns them and they render below the line,
labelled "not a dose". Adipotide is the clearest example — look at it before
changing anything here.

---

## The AI guardrail, and what it is not

`src/lib/ai-dose-guardrail.ts` is now interpolated into both `/api/chat` and
`/api/protocol-plan`. It names all 98 peptides with no published dose in full,
and closes the routes a number arrives through by name — animal studies, body
weight, allometric scaling, community protocols, a similar peptide, the model's
own general knowledge.

**It cannot make a model obey.** A test reads both route files and fails if the
import or the interpolation is removed, which is the part that can be enforced.
If you add a third route that can emit an amount, add it to that test's list.

---

## The shop: migrations are APPLIED, the rest is not code

**Applied to production on 2026-09-07** and verified: `shop_products`,
`shop_lots`, `shop_inventory`, `shop_orders`, `shop_order_items` and
`scan_sessions`. Seven products, nine lots, three assayed — matching
`catalogue.ts` exactly. Existing tables were untouched; `profiles` (12) and
`bloodwork_results` (56) are unchanged.

*A note for whoever checks: Supabase's table listing reports a stale row-count
ESTIMATE, not an exact count. It said `stack_items` was 9 before and 8 after,
which looked like data loss and was not — the exact count was 8 both times and
the planner estimate is 7. Count with `select count(*)` before panicking.*

What remains is **not code**. Nothing below can be done from this repo:

1. ~~Set the three USPS prices~~ — **DONE 2026-09-07.** $7.00 / $12.00 /
   $49.00, flat per order. See "Shipping, priced" below. Checkout completes on
   the code's side now; it still needs items 2 and 3.
2. `SHOP_ZELLE_HANDLE`, which needs a bank account under a shop entity.
3. `SHOP_ADMIN_USER_ID`. **Easy to miss** — without it the admin queue 404s to
   everyone, so a Zelle payment can never be marked paid and nothing ever
   ships, while checkout looks like it is working.
4. Lot codes and real assay dates for VIP, Selank, Semax and NAD+.
5. The §16.12 attorney review on the refund policy.

BTCPay's four variables are only needed if crypto ships at launch. Zelle alone
can take an order.

**What changed when the migrations landed:** checkout stopped failing at "no
such table" and now fails at "shipping is not priced". That is progress, but
the storefront now looks closer to working than it is. Checkout still refuses,
and says why.

## Blocked on Karim, not on code

Unchanged from yesterday except where noted.

1. ~~**Three shipping prices.**~~ Set 2026-09-07 — see below.
2. ~~**Apply the migrations.**~~ Applied and verified 2026-09-07.
3. **Env**: `SHOP_ADMIN_USER_ID`, `SHOP_ZELLE_HANDLE`, `BTCPAY_URL`,
   `BTCPAY_STORE_ID`, `BTCPAY_API_KEY`, `BTCPAY_WEBHOOK_SECRET`. The Zelle sheet
   has no fallback handle by design — with the var unset it tells the buyer the
   account does not exist yet and that nothing was charged.
4. **Shop entity + business bank account.** Blocks Zelle and both firewalls.
5. **Real assay dates** for VIP, Selank, Semax, NAD+ — `2026-10` is a
   placeholder, flagged as such in `catalogue.ts`.
6. **Lot codes for those same four.** Null, so `validatePackAssignment` refuses
   to pack them. Correct behaviour; they are unshippable until codes exist.
7. **Refund policy** — the copy is live and tagged `[ Draft · under legal
   review ]`. The tag stays until the §16.12 attorney review.
8. **Three printed labels claim a purity no lab measured** — `SX-51824` Semax,
   `SK-51825` Selank, `AD-51826` AOD-9604, all "99% HPLC". Nothing shipped;
   reprint, not recall. The current generator will not reproduce it.
9. Carried from August: **live Stripe prices** (live monthly is still $9.99
   against a $14.99 page; annual cannot be bought) and **Resend SMTP** — there
   is no transactional email at all, which is why the Zelle sheet must not
   promise an emailed copy.

---

## Shipping, priced — 2026-09-07

$7.00 standard · $12.00 priority · $49.00 overnight, **flat per order**, not
per vial and not by zone. Karim chose the set; the reasoning is in the header
of `src/lib/shop/orders/shipping.ts`.

**These are not quotes for a real parcel.** They were sized against typical
USPS commercial rates for a sub-pound small box: each tier covers postage plus
the box, and the two fast tiers also absorb a cold pack, which is why overnight
is priced as the cold-chain option rather than a convenience upsell. Re-price
them once a few orders have shipped and the real box weight is known —
`orderTotals()` snapshots the charge onto the order, so changing a number here
never rewrites what a past customer paid.

**The overnight trap is handled by wording, not by hiding it.** All three
methods stay available on both payment rails, and every window is quoted from
PAYMENT CLEARING rather than from checkout — `TRANSIT_FROM` in `shipping.ts`,
printed under the method list at checkout. On the Zelle rail confirmation is
manual, so a window quoted from checkout would be a promise that rail cannot
keep. The alternative — hiding overnight unless BTCPay is selected — was
considered and turned down: it makes the method list depend on the payment
rail, and two selections that quietly change each other are worse than one
honest sentence. **Do not shorten that line to fit a layout.**

**The refusal path is intact.** `sellableMethods()` still filters on a null
price and `orderTotals()` still throws, both still tested — an unpriced method
added later fails closed exactly as before. What changed is the data, not the
guard.

**Checkout is not open.** It now completes on the code's side, but a Zelle
order still cannot be marked paid without `SHOP_ADMIN_USER_ID`, and there is
no handle without `SHOP_ZELLE_HANDLE`. Those two, not shipping, are what is
between here and a first order.

## Fixed this session, worth knowing about

**Ten of the twelve production accounts had no date of birth**, including both
paid ones. `isAdult()` fails closed on a null and the field was collected only
at signup, so those accounts were refused at checkout with nothing in the app
that would ever ask again. Checkout now asks once, and `refuseDob()` will not
let a recorded date be overwritten — a field its holder can rewrite the moment
it refuses them is a checkbox with extra steps.

If you add a third place that writes `profiles.dob`, it goes through
`refuseDob()` too.

## Still open, lower priority

**The iOS build fails and has for 39 of its last 40 runs.** Three pre-existing
Swift errors, listed at the top of `.github/workflows/ios-build.yml`. It only
runs when `ios-native/` changes, so it no longer emails on every web commit.

**`/reconstitution`, `/checker`, `/bloodwork`, `/stack` and friends are
redirects** into the dashboard. That is the Mirror consolidation, not rot.
`/dosing` used to be one of them and is now a real page — do not assume the
others are equally stale without reading them.

~~**The design's QR phone hand-off for the scanner is not built.**~~ Stale:
it shipped in `1cf420c` and `scan_sessions` is applied (see "The one
unauthenticated write" below). The device-camera path remains the §16.8
default; the hand-off is the addition.

---

## The one unauthenticated write, and why it is shaped that way

`/api/scan-session/[token]/upload` is the only endpoint in this codebase that
writes without a session. The token in the path is the entire credential.

**Its check ORDER is the security property, not the checks.** Shape before
query; refuse before reading a 6 MB body; claim the token before calling
Claude, conditionally on `consumed_at` still being null, so two uploads racing
one token cannot both spend a vision call. If you refactor it, keep the order.

`scan_sessions` deliberately has no insert or update policy at all — not even
for authenticated users. Both writes are service-role, because the phone has no
session and nothing carrying one should be able to forge these rows.

The phone page fetches nothing. Checking whether a token is live would leak
whether it exists.

## Conventions added this session — do not "improve" these

- **No projected dates on the order timeline.** A step prints a recorded
  timestamp in mono or an estimate in italic serif, never a computed date. The
  prototype derived delivery dates from `placedAt`, so a delivery date existed
  the moment an order did. There is no `delivered_at` column; the Delivered row
  carries only the carrier's window.
- **Only `published` may render a number.** Everywhere. The library, the
  compound page, the dosing reference and both AI prompts.
- **Every dose figure carries its source.** A figure without one is
  indistinguishable from a recommendation.
- **The scanner's amount is null, never 0, when it cannot be parsed.** Zero
  milligrams is a claim about a vial; null is an admission about a photograph.
  IU is refused rather than converted — potency per IU is compound-specific.
- **An unresolved scanner reading is still shown.** A scanner that silently
  drops half a shelf is worse than one that says "not matched".
- **The Zelle handle has no fallback.** A stand-in address is an instruction to
  send money to someone who is not us.
- **Refund wording lives once**, in `src/lib/legal.ts`, shared by the refund
  page and checkout. A policy that differs at the point of sale from its own
  page is a discrepancy that gets read against you.
- **Grade and CV render as two figures with two labels.** Grade is regulatory
  status alone; CV is a separate axis and never moves it.
- **Cautions and interactions sit last, boxed, with nothing sold beside them.**
- **Carried forward and still true:** `shopCards()` takes no arguments and a
  test asserts its arity; a blend gets `unitPrice: null` and a reason; view
  models return `null` for an absence, never `'—'` or `0`; `mg()` prints two
  decimals; labels render only where something sits under them; the catalogue
  grid is flex-wrap, not grid; everything out of `localStorage` is untrusted;
  `order_items.unit_price_cents` is a snapshot; the BTCPay webhook verifies HMAC
  over the raw body before parsing; the shop is never tier-gated, and neither
  are THE MATH, side effects or the dosing reference.

## One mistake worth not repeating

I committed once with `tsc --noEmit` failing while the test suite was green
(fixed in the commit after). Running one check is not running the checks. The
same mistake is recorded in `046b7b6` from the previous session.

## The last pass — 2026-09-07, "finish all of it"

With the code list empty, the remaining in-repo debt was documentation that
contradicted the code, and two hygiene items CLAUDE.md §13 had carried since
May. All of it is done; what is left is listed under "Blocked on Karim".

- **`README.md` rewritten.** It said "PeptideTracker", "58 peptides",
  "max 20 users" and "dark theme". It now describes the product that ships.
- **`MARKETING.md` renamed and re-counted**, with a warning at the top: the
  scripts have never been audited for FTC health-claim language (roadmap
  C-5) and must not run before that and the §16.12 attorney review.
- **`public/manifest.json`** now carries the V3 palette and shortcuts to
  routes that exist (`/log` was a redirect). `viewport.themeColor` in the
  root layout moved from the old parchment to paper to match.
- **`.github/workflows/web.yml`** runs typecheck, tests and build on every
  push and PR touching the web app, plus a grep that the server-only vial
  report module never reaches `.next/static`. §13.8 ("no tests, no CI") was
  false on the tests for months — there are 431 — and is now false on CI too.
- **`CLAUDE.md` §7, §8 and §13 corrected** where they described a codebase
  that no longer exists: middleware location, the three "missing" tool UIs,
  the four "missing" tables, the manifest, the domains, the README.
- **`REFACTOR-ROADMAP.md`** has a status block at the top marking what has
  since been resolved. The item bodies are left as written; they are the
  reasoning, and several were resolved differently from how they proposed.

## Verification state

`npm test` 398 passing across 29 files · `npx tsc --noEmit` clean ·
`npx next build` succeeds · `grep -rlE "D14D7EHWHFH9|XAKRSW4WN85N|VJUDHK6MDGT3"
.next/static` returns nothing · working tree clean · nothing unpushed ·
production deployment READY.
