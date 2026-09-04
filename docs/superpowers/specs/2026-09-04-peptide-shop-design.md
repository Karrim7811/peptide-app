# Peptide Cortex — Shop: design

**Date:** 2026-09-04 · **Author:** Claude (Opus 5) with Karim Nasser · **Status:** approved, not implemented

A direct-sales storefront inside `peptidecortex.com`, positioned on published assay
data and per-mg unit pricing rather than on competitor comparison.

---

## 1. Why this exists, and what it changes

Peptide Cortex today is a reference and tracking product whose legal posture is
"educational research reference, not medical advice." Selling the compounds
changes what the surrounding content means: FDA reads *intended use* from a
seller's own material, so the Bible entries, Cortex AI output and the
reconstitution calculator become evidence about the products being sold.

This was raised before the design started. Karim's decision was **fully
integrated** — shop and app on one domain, one account, one surface. That is
recorded here as a deliberate, informed choice, not an oversight. Everything
below is designed to be as defensible as that choice allows.

Two firewalls survive the integration and are non-negotiable:

- **The shop never touches the subscription Stripe account.** Discovery of
  peptide sales on that account risks termination, a 90–180 day balance reserve,
  and MATCH-list placement — which would take the working subscription business
  with it.
- **The shop never touches the bank account that receives subscription revenue.**

## 2. Decisions log

| # | Decision | Rationale |
|---|---|---|
| D1 | Shop is fully integrated into `peptidecortex.com` | Karim, informed of the intended-use tradeoff |
| D2 | Lot history on the product page (SKU-level cart, lot-level evidence) | Five SKUs already carry multiple lots; the archive is the moat |
| D3 | Report codes and links are **not** published | Janoshik's public page names the client, the manufacturer, and a supplier-prefixed batch |
| D4 | Results shown as bare numbers, "report on file" | Truthful and substantiable; FTC substantiation needs possession, not publication |
| D5 | Karim commissions his own assays; verification goes live when they land | Removes the conflict entirely and upgrades the claim |
| D6 | All 7 launch SKUs list; unassayed ones show a dated `pending` | Karim |
| D7 | Pricing signal is **per-mg unit price only** | No margin disclosure, no cost breakdown — see §5 |
| D8 | Payment: self-hosted BTCPay + Zelle | Karim |
| D9 | Purchase requires a Cortex account | Age gate, order↔stack linkage, Zelle reference identity |
| D10 | US-only shipping, flat rate, shipped in-house | Consistent with the existing EU geoblock |

## 3. Launch catalogue — 7 SKUs

| # | Product | Price | $/mg | Lot(s) | Assay |
|---|---|---|---|---|---|
| 1 | **GLP-3 (Retatrutide) 30 mg** | $125 | 4.167 | `JA-102107`, `JA-68243`, `JA-63071` | purity 99.62 / 99.73 / 99.46 |
| 2 | VIP 5 mg | $30 | 6.000 | — | `pending` |
| 3 | **MOTS-c 10 mg** | $30 | 3.000 | `JA-102111` | purity 99.11 |
| 4 | Selank 5 mg | $30 | 6.000 | — | `pending` |
| 5 | Semax 5 mg | $30 | 6.000 | — | `pending` |
| 6 | **KLOW 80 mg** | $100 | n/a — blend | `JA-102113` | composition (below) |
| 7 | NAD+ 1000 mg | $75 | 0.075 | — | `pending` |

**KLOW `JA-102113`** (analysed 27 Jan 2026) is a *composition* assay, not a
purity assay, and will never yield a single percentage:

| Component | Measured |
|---|---|
| GHK-Cu | 57.45 mg |
| BPC-157 | 11.12 mg |
| TB-500 (TB4) | 10.88 mg |
| KPV | 11.20 mg |
| **Total** | **90.65 mg** vs **80 mg** labelled |

This drove the `assay_type` split in §4. It is also the strongest single block on
the site: competitors sell "80 mg blend" without disclosing the ratio.

Retatrutide 30 mg's three consecutive lots at 99.4%+ are the launch's best asset
and are available today.

**Not a blind test.** `JA-102113` reads "Assessment of a peptide vial or vials."
A separate Tirzepatide report *was* a blind test. Do not generalise the
blind-test claim across lots — check per report and only claim it where true.

## 4. Data model

Five new tables. Shapes are driven by lot history, recall traceability, and
structurally hiding the report code.

```
products              the sellable SKU
  id · slug · compound_id → existing catalog (nullable: blends, NAD+)
  name · size_display ('30 mg', '24 IU') · price_cents
  blend_components[] · active · sort_order

lots                  physical batches — existing VIALS, promoted
  id · product_id →
  lot_code                 'JA-102107'
  assay_state              'assayed' | 'pending' | 'none'      NOT NULL
  assay_type               'purity' | 'composition'
  purity_pct               nullable — when assay_type = 'purity'
  components[]             nullable — [{name, mg}] when 'composition'
  label_mg · measured_total_mg
  assay_expected_at        required when assay_state = 'pending'
  assay_lab · assay_report_code    <- stored, NEVER serialized to the client
  mfg · exp · shelf_life · received_at · is_current

inventory
  lot_id → · qty_on_hand · qty_reserved

orders
  id · user_id → auth.users · status
  subtotal · shipping · total
  payment_provider · provider_ref · payment_reference   ('PC-4F2A')
  shipping_address · created_at

order_items
  order_id → · product_id → · lot_id →      <- the lot actually shipped
  qty · unit_price_cents
```

### Load-bearing invariants

- **`assay_report_code` never leaves the server.** Enforced by the API response
  shape, not by template omission — a future session must not be able to
  reintroduce it while "improving the COA block." This is the redaction.
- **`assay_state` is an enum and never null.** Matches the existing repo
  convention: *"Those nulls are real and must render as states, not zeros."*
  `pending` is a dated promise; `none` never lists.
- **`order_items.lot_id` is the recall path.** Not marketing. It is the
  difference between notifying eleven customers and emailing the whole list.
- **`payment_provider` + `provider_ref` are generic.** No Stripe-shaped columns.
  Processors will change; that must be an adapter, not a migration.
- **`products.compound_id` is the integration hook** — pulls the Bible entry, and
  later lets a delivered order prefill stack and inventory. Nullable because KLOW
  is a blend and NAD+ is not a peptide.

## 5. Positioning and the pricing mechanic

The brief was to convey that other vendors overcharge **without stating a number
and without naming anyone**. The resolution: do not make a comparative claim at
all. Publish your own figures until the reader draws the conclusion themselves.

**Per-mg unit price on every card and every product page.** This is the whole
mechanic. It is a *unit*, not a claim — nothing to substantiate, no Lanham Act
exposure, no competitor to provoke. It works particularly well for this
catalogue: a 30 mg retatrutide vial competes against 5 mg and 10 mg vials with
smaller sticker prices, and per-mg normalisation turns the format into the
argument. The customer performs the comparison, in a unit we supplied.

### Two rules the unit price must obey

**Per-mg is comparable within a compound, never across the catalogue.** NAD+ at
$0.075/mg and Semax at $6.00/mg does not mean NAD+ is eighty times the value —
they are different molecules with different dose ranges. The figure exists so a
buyer can compare *our* retatrutide against *someone else's* retatrutide. So:
show it on the card and the product page, but **never sort, rank, or visually
compare the catalogue by it**, and never present it in a way that implies a
cross-compound ranking. A "best value" badge computed from $/mg would be
actively misleading and must not be built.

**Blends carry no per-mg figure.** KLOW is four molecules in one vial; a price
per milligram of *unspecified mixture* means nothing, and it is ambiguous
besides (per 80 mg labelled, or per 90.65 mg measured?). For `assay_type =
'composition'` products the component table replaces the unit price entirely —
which is the stronger disclosure anyway.

**Explicitly rejected:**

- *Full cost breakdown* — publishing landed cost tells competitors the buy price
  and hints at supplier and volume, which is the exact thing D3 protects.
- *Published fixed margin* — invites "so what is the landed cost?", and the claim
  fails the moment that is declined. Considered and dropped (D7).
- *Any statement about competitors' pricing* — comparative advertising requiring
  substantiation we do not have.

## 6. Product page

One skeleton for all seven, state-driven rather than per-product.

**Assay block — three states, two shapes:**

`assayed / purity`
> **99.62%** purity · third-party HPLC · report on file
> Lot `JA-102107` · MFG 2026-01 · EXP 2028-01

`assayed / composition`
> the four-row component table · **Measured 90.65 mg against 80 mg labelled**

`pending`
> Independent assay commissioned · results expected **[month]**
> *This product ships with no published assay until then.*

That last line is deliberately uncomfortable. If `pending` reads as soft, it
costs nothing to stay pending and the 99.62% elsewhere stops signalling.

**Below the fold:** compound entry from the existing library; lot history where
`count(lots) > 1`; per-mg price; RUO framing inherited from `/terms`.

**No verification affordance at launch.** No "click to verify," no hosted
redacted PDFs — an unverifiable COA is a picture of a claim, and blacking out a
third-party lab's document and republishing it is its own problem. The block is
built with an empty verification slot that lights up when Karim's own reports
land (D5), making the upgrade an announcement rather than a silent fix.

**Language:** "independent third-party assay," "report on file," the bare number.
Not the lab's name until the reports are his — Janoshik's public directory means
lab + compound + date narrows a search.

## 7. Payment rails

**BTCPay Server, self-hosted.** No underwriting, no chargebacks, no third party
that can deplatform the shop. Webhook confirms payment; the order advances
automatically. A crypto discount was discussed and is **deferred, not decided** —
it would be honest (crypto genuinely costs less and carries no chargeback
exposure) but it is a pricing decision, not a build decision. Ship at parity;
add it later if wanted. Tracked in §10.

**Zelle.** No merchant API, therefore **no automated reconciliation**. Checkout
displays the handle plus a short human-typable reference (`PC-4F2A`) for the
memo; the order parks in `awaiting_payment` until confirmed by hand. Requires a
**business** account under the shop entity — a personal Zelle taking commercial
volume gets flagged — and never the subscription bank account. Bank-set daily
limits can cap a large order; verify before launch.

Both sit behind one payment-provider interface. Losing or adding a processor is a
new adapter and a config change.

**Refunds are manual and self-enforced.** Neither rail gives the buyer an issuer
to appeal to. In a trust-first brand that is an asset: a visible, generous,
manually honoured refund policy is another thing this shop can show that others
cannot. It must actually be honoured.

## 8. Order lifecycle and admin

```
awaiting_payment -> paid -> packed -> shipped -> delivered
                 \-> expired    (crypto quote lapsed / Zelle never arrived)
                 \-> refunded
```

**`/admin/orders`**, gated to Karim's user id. Three views: awaiting payment
(with references to match), paid and needing packing, shipped.

**Marking an order packed assigns the lot physically pulled from the shelf.**
That is the only moment the vial and the database touch, and it is what populates
`order_items.lot_id`. Not optional.

## 9. Out of scope at launch

Guest checkout · live carrier rates · international shipping · subscriptions or
auto-reorder · discount codes · reviews · a card rail · automated Zelle
reconciliation (not possible) · migrating the existing Stripe subscription code
(stays untouched and unaware the shop exists).

## 10. Open items

1. ~~Confirm `GLP-3` = Retatrutide.~~ **Confirmed 2026-09-04 (Karim).** SKU 1 is
   Retatrutide and maps to lots `JA-102107` / `JA-68243` / `JA-63071`.
2. **`assay_expected_at` for the four pending SKUs** (VIP, Selank, Semax, NAD+) —
   a date is required before they can list.
3. ~~Prices.~~ **All seven set 2026-09-04 (Karim)** — see §3.
4. **Shop legal entity + business bank account** — prerequisite for D8 and both
   firewalls.
5. **Refund policy text** — needs Karim's sign-off; ToS changes require it.
6. **KLOW purity semantics** — confirm the product page should present component
   mg rather than any derived percentage.
7. **Verify the 21 existing purity figures** in `peptides.json` against their
   reports before publishing them. Janoshik sits behind Cloudflare and the reports
   are flat PNGs, so this is manual.
8. **Crypto discount** — deferred (§7). Launch at parity unless decided otherwise.
