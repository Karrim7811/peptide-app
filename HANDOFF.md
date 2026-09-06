# Handoff — 2026-09-06

Read `CLAUDE.md` first, then this. Where they disagree, this is newer.
Supersedes the 2026-09-03 handoff; everything still open from it is carried
forward below.

`main` = pushed, working tree clean, **240 tests passing, `tsc --noEmit` clean,
`next build` succeeds.**

---

## Where to start tomorrow

1. **Zelle screen and order status** — the last two on the money path. Design is
   in the v3 handoff (`Zelle.dc.html`, `Order.dc.html`); the pattern is
   established by `/shop/cart` and `/shop/checkout`.
2. Then Home, Auth, Legal, and the bench shell with its five tool screens.
3. `docs/design-integration-prompt.md` is the standing brief for all of it.

**Before writing a page, read `Shop.dc.html`'s equivalent and transcribe the
inline styles.** They are exact, and the handoff says to read the element you are
rebuilding. Approximating drifts.

---

## What this session did

**The shop, front to back.** Data layer, checkout backend, both payment
adapters, the admin queue, and four screens of UI: `/shop`, `/shop/[slug]` (all
seven prerendered), `/shop/cart`, `/shop/checkout`.

**Closed a live leak.** All 27 Janoshik report codes were in the public JS
bundle — `catalog.ts` is imported by nine client components, and the codes were
there twice: as a `reportCode` field and as the tail of every slug. Both gone,
`REPORT_CODES` is server-only and keyed by lot, and a test serialises `VIALS` and
fails if a code reappears. Verified against `.next/static`, not just in a unit
test.

**Closed the same leak on the physical product.** Every printed label's
DataMatrix encoded `janoshik.com/tests/<slug>`, which resolves to a page naming
WBS-Shanghai Wibson. A label is the one surface a website redaction cannot
reach. Karim then removed the code entirely; the freed space went to the
reconstitution date field.

**Read the real assay figures off the reports.** The repo had rounded values and
had dropped the measured content entirely. Now exact: GLP-3 99.623% / 35.95 mg,
MOTS-c 99.114% / 12.33 mg, and `assayedAt` dates that turn three lots into a
nine-month record.

---

## Two things that are wrong and need a decision

### 1. Three printed labels claim a purity that no lab measured

`SX-51824` Semax, `SK-51825` Selank, `AD-51826` AOD-9604 — all showing
"99% HPLC". The lot codes are sequential with compound-initial prefixes; they
are not lab lots. A real assay never returns a round 99%.

**Nothing shipped — Karim confirmed the stock is still on the shelf**, so this is
a reprint, not a recall. Do not reprint from the old artwork. The current
generator will not reproduce it: it prints a purity only where one is recorded.

The NAD+ label on the Desktop is the correct model — no purity claim, blank
`LOT ___ MFG ___ EXP ___` to fill in by hand.

### 2. The dosing split in the briefs was wrong, and no count should be published

I wrote "81 of 124 carry a published range". That tested for the literal string
`"N/A"`, so an entry reading *"No human dose exists. Rodent work used 30–50
mg/kg…"* counted as HAVING a range. Three rules give three answers: 43/81,
63/61, 73/51. Claude Design caught it.

Every brief now says to count live off the entries. **The classification rule
still needs reconciling against `src/lib/catalog.ts`**, which is the source of
truth. Do not republish a hard number until it is.

---

## Blocked on Karim, not on code

1. **Three shipping prices.** `orderTotals()` throws until they are set, so
   checkout is disabled and says so on screen. This is deliberate — the
   alternative is charging a figure nobody chose. Nothing can be ordered until
   these exist. Carrier and service are chosen (USPS Ground Advantage / Priority
   / Priority Mail Express); only the numbers are missing.
2. **Apply the migrations**, in order: `shop_schema.sql`, `shop_seed.sql`,
   `shop_orders_schema.sql`. None are applied.
3. **Env**: `SHOP_ADMIN_USER_ID`, `SHOP_ZELLE_HANDLE`, `BTCPAY_URL`,
   `BTCPAY_STORE_ID`, `BTCPAY_API_KEY`, `BTCPAY_WEBHOOK_SECRET`.
4. **Shop entity + business bank account.** Blocks Zelle and both firewalls.
5. **Real assay dates** for VIP, Selank, Semax, NAD+ — `2026-10` is my
   placeholder and is flagged as such in `catalogue.ts`.
6. **Lot codes for those same four.** They are `null`, so `validatePackAssignment`
   refuses to pack them — correct behaviour, but it means those four are
   literally unshippable until codes exist.
7. **Refund policy** — my draft is in the checkout page and in the spec. Touches
   ToS, so it needs his sign-off.
8. Carried from August: **live Stripe prices** (live monthly is still $9.99 vs a
   $14.99 page; annual cannot be bought) and **Resend SMTP** (no transactional
   email at all, which is why the Zelle screen must not promise an emailed copy).

---

## Still open, lower priority

**The iOS build fails and has for 39 of its last 40 runs**, starting at the
Mirror redesign merge. Three pre-existing Swift errors, listed in a comment at
the top of `.github/workflows/ios-build.yml`. The workflow now only runs when
`ios-native/` changes, so it no longer emails on every web commit. Not fixed —
the app is App-Store-rejected and the web is the priority.

**`Vial.slug` no longer embeds a report code, but the label artwork filenames in
`design/vial-labels/labels-*/` were renamed to lot.** Anything referencing the old
filenames is stale.

**`design/liene-labels/` and `design/liene-4x7/`** appeared in the working tree
and are not mine. Gitignored as regenerable output, not deleted.

---

## Conventions this session added — do not "improve" these

- **`shopCards()` takes no arguments, and a test asserts its arity.** If a
  comparator appears in that signature it is the "best value" ranking arriving by
  the back door. Per-mg compares within a compound only.
- **A blend gets `unitPrice: null` and a reason to render**, never a gap and
  never a figure.
- **The view model returns `null` for an absent value, never `'—'` or `0`.** The
  component decides how to show an absence; the model must not decide for it by
  supplying a dash.
- **`mg()` prints two decimals.** The lab reports 11.20; trimming to 11.2 is a
  small unforced inaccuracy on a page whose argument is that it prints what the
  lab said, and it breaks column alignment.
- **Labels only render where something sits under them.** The purity gap on a
  pending card is a deliberate admission and works because it is rare; a card of
  empty labelled rows makes absence look routine.
- **The catalogue grid is flex-wrap, not grid.** Seven cards never divide evenly
  into a responsive column count, and grid cannot fill a short last row — the ink
  ground shows through as a black slab that reads as a missing product.
- **Everything read out of `localStorage` is untrusted input.** Bad JSON, bad
  slugs, hand-edited quantities are dropped or clamped at the boundary.
- **`order_items.unit_price_cents` is a snapshot** and the order-line name is
  composed from name + subtitle — "GLP-3" alone is a vendor nickname, and an
  order read six months later has no subtitle beside it.
- **The BTCPay webhook verifies HMAC over the raw body with `timingSafeEqual`
  before parsing.** A test reads the source and fails if that is swapped out.
- **The shop is never tier-gated.** THE MATH and side effects are never gated
  either.

## Verification state

`npm test` 240 passing across 18 files · `npx tsc --noEmit` clean ·
`npx next build` succeeds, all seven product pages prerendered ·
`grep -rlE "D14D7EHWHFH9|XAKRSW4WN85N|VJUDHK6MDGT3" .next/static` returns
nothing · working tree clean · nothing unpushed.
