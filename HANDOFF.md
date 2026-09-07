# Handoff — 2026-09-07

Read `CLAUDE.md` first, then this. Where they disagree, this is newer.
Supersedes the 2026-09-06 handoff.

`main` = pushed and deployed. **341 tests passing, `tsc --noEmit` clean,
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

## Where to start

1. **The bench at `/dashboard`.** The only signed-in surface still on the older
   Mirror styling, now that everything around it is V3. It works — do not treat
   this as a bug hunt. `App.dc.html`'s bench view is the target. Note it wires
   to real user data through `src/lib/mirror/load.ts`, so this is the highest-
   regression-risk screen left; the public ones were mostly pure functions.
2. **The protocol planner.** `/api/protocol-plan` and `/api/protocol-consult`
   exist and nothing calls them. Same situation the vial scanner was in
   yesterday. `Tools.dc.html`'s planner view is the design.
3. **Interactions and bloodwork** are live inside the dashboard
   (`InteractionCheck`, `BloodworkOverlay`) and work. They are a restyle, not a
   build, and are the lowest-value item on this list.

**Read the element you are rebuilding.** Every style in the prototypes is inline
on the element and the values are exact. Approximating drifts, and it shows
immediately next to the screens that were transcribed.

---

## What this session did

**The whole public site, rebuilt from V3 and deployed.** Home, the library at
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

## The shop cannot take an order yet, and prices are not the first reason

Verified against the live database on 2026-09-07, not carried over from a
previous handoff: **there are no shop tables in production.** `shop_products`,
`shop_lots`, `shop_orders` and `shop_order_items` do not exist. `createOrder`
queries `shop_products` to resolve slugs before it ever reaches pricing, so an
order fails before shipping is consulted. Setting the USPS prices first changes
nothing.

The order the blockers actually resolve in:

1. Apply the three migrations. Nothing else matters until this is done.
2. Set the three USPS prices in `shipping.ts`. A code change, not a dashboard
   setting.
3. `SHOP_ZELLE_HANDLE`, or the Zelle adapter throws.
4. `SHOP_ADMIN_USER_ID`. **Easy to miss** — without it the admin queue 404s to
   everyone, so a Zelle payment can never be marked paid and nothing ever
   ships, while checkout looks like it is working.
5. A bank account under the shop entity.
6. Lot codes for the four pending products.

BTCPay's four variables are only needed if crypto ships at launch. Zelle alone
can take an order.

## Blocked on Karim, not on code

Unchanged from yesterday except where noted.

1. **Three shipping prices.** `orderTotals()` throws until they are set, so
   checkout is disabled and says so. Carrier and service are chosen; only the
   numbers are missing. Second in the order above, not first — the tables have
   to exist before pricing is ever reached.
2. **Apply the migrations**, in order: `shop_schema.sql`, `shop_seed.sql`,
   `shop_orders_schema.sql`. None are applied.
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

**The design's QR phone hand-off for the scanner is not built.** It needs a
session-token table that does not exist. The device-camera path is what §16.8
actually specifies and is what shipped.

---

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

## Verification state

`npm test` 341 passing across 24 files · `npx tsc --noEmit` clean ·
`npx next build` succeeds · `grep -rlE "D14D7EHWHFH9|XAKRSW4WN85N|VJUDHK6MDGT3"
.next/static` returns nothing · working tree clean · nothing unpushed ·
production deployment READY.
