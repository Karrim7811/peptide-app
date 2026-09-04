# Shop → frontend handoff

**Send when the main frontend rebuild is done.** This extends a finished site.

**Self-contained** — data is inline, no attachment needed. Never send the COA
images: each names the manufacturer in two fields, one carries a personal email
address, and every page has a scannable QR resolving to the lab record.
**Figures, never documents.**

**Two placeholders to replace before sending:**
1. The four `pending` products say `[MONTH TBC]` — that date is genuinely unset.
2. Shipping prices are unset. Fill them in or leave the bracketed markers.

---

## The prompt

```
The site you've built now needs a shop section. Seven products, five screens:
catalogue, product, cart, checkout, order status.

Match the design language you've already established — typography, colour,
spacing, component style. Nothing below is a visual instruction except where a
rule is load-bearing for the product. The rest is yours.


WHAT THE SHOP IS FOR

We sell research compounds. The entire positioning is that we publish the
independent lab assay for every batch, and the price per milligram, and let the
reader draw their own conclusions about everyone else. We never mention a
competitor and never claim anyone overcharges. The numbers do the arguing, so
the numbers need to be the loudest thing on the page.

Most shops here post a purity percentage with nothing behind it and price so
comparison is hard. We do the opposite. That contrast is the design brief.


THE DATA — real values. Design against these, not placeholders.

1. GLP-3 (Retatrutide) — 30 mg — $125.00 — $4.17 / mg
   Triple agonist at GLP-1, GIP and glucagon receptors. Metabolic / weight loss.
   ASSAYED: 99.623% purity · 35.95 mg measured against a 30 mg label
   lot JA-102107 · MFG 2026-01 · EXP 2028-01
   LOT HISTORY — nine months of consecutive batches:
      JA-102107   Jan 2026   99.623%   35.95 mg   ← shipping now
      JA-68243    Jun 2025   99.736%   31.72 mg
      JA-63071    Apr 2025   99.466%   32.61 mg

2. VIP — 5 mg — $30.00 — $6.00 / mg
   Vasoactive intestinal peptide.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

3. MOTS-c — 10 mg — $30.00 — $3.00 / mg
   Mitochondrial-derived peptide; activates AMPK.
   ASSAYED: 99.114% purity · 12.33 mg measured against a 10 mg label
   lot JA-102111 · MFG 2026-01 · EXP 2028-01

4. Selank — 5 mg — $30.00 — $6.00 / mg
   Tuftsin analogue; modulates GABA and monoamine systems. Nootropic/anxiolytic.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

5. Semax — 5 mg — $30.00 — $6.00 / mg
   ACTH(4-10) analogue; modulates BDNF and NGF. Nootropic/neuroprotective.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

6. KLOW — 80 mg — $100.00 — NO per-mg price (see rule 2)
   A four-component blend: GHK-Cu, BPC-157, TB-500, KPV.
   ASSAYED BY COMPOSITION · lot JA-102113 · MFG 2026-01 · EXP 2028-01
      GHK-Cu          57.45 mg
      BPC-157         11.12 mg
      TB-500 (TB4)    10.88 mg
      KPV             11.20 mg
      ─────────────────────────
      Measured        90.65 mg   against 80 mg labelled

7. NAD+ — 1000 mg — $75.00 — $0.075 / mg
   Nicotinamide adenine dinucleotide. A coenzyme, not a peptide.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

All products: cold chain, "USE WITHIN 28 DAYS · 2–8 °C".

OVERFILL. Where we have the figure, the vial holds more than the label claims —
MOTS-c 12.33 mg in a 10 mg vial, GLP-3 35.95 in a 30, KLOW 90.65 in an 80. That
is +23%, +20% and +13% of free compound, measured by a third party, and
essentially nobody in this market publishes it. Give it a place beside the
purity figure. Some products have no content figure; treat that as normal.

So the layout has to survive: 99.623% beside $4.17 / mg; a four-row measured
component table totalling more than its own label; and four products with a
date where a number should be.


SCREENS

1. CATALOGUE — seven products, fixed order 1–7 as listed above.

2. PRODUCT — assay block, price, per-mg, lot history where it exists, what the
   compound is, and for KLOW what is in it.

3. CART — lines, quantities, subtotal. No stock counts, ever.

4. CHECKOUT — US shipping address, then two choices:

   Shipping method:
      Standard    USPS Ground Advantage       2–5 business days   [$ TBC]
      Priority    USPS Priority Mail          1–3 business days   [$ TBC]
      Overnight   USPS Priority Mail Express  next business day   [$ TBC]
   Only Overnight is guaranteed by the carrier. The other two are estimates and
   must be worded as estimates.

   Payment method — these are two different journeys, not two radio buttons
   with the same outcome:
      • Crypto  → we redirect to a hosted checkout; the buyer returns to the
                  order page. Confirms in minutes.
      • Zelle   → nothing to redirect to. We show a handle, an exact amount, and
                  a reference code that MUST go in the memo. Payment happens in
                  their banking app. Confirmed by hand, usually within one
                  business day.
   The Zelle screen is the harder one and the more important one. If the
   reference code is easy to miss or hard to copy, we cannot match the payment
   to the order and it becomes a support ticket.

5. ORDER STATUS — the order, its current state, and what happens next.


HARD RULES — product decisions, not style. Each is invisible in a mockup, which
is exactly why it is written down.

1. Never sort, rank, filter or badge by unit price. Per-mg compares WITHIN a
   compound — it exists so a buyer can weigh our retatrutide against someone
   else's. NAD+ at $0.075/mg beside Semax at $6.00/mg says nothing about value,
   so a "best value" badge would actively mislead. Fixed order, 1–7.

2. KLOW has no per-mg price on purpose. Four molecules; a price per milligram of
   unspecified mixture is meaningless. The component table replaces it — and it
   is stronger anyway, showing the exact ratio AND that the vial is overfilled.

3. The four pending products must show their expected month AND the sentence
   "This product ships with no published assay until then."
   Do not make this state look comfortable, resolved, or tidy. It should read as
   a gap we are admitting to. If pending looks fine, the published figures on
   the other three stop meaning anything — that tension is the entire point.

4. No "verify" link, badge, QR code, or scan affordance anywhere. There is
   nothing to link to yet. Leave room for one; it arrives later.

5. GLP-3's lot history is the most important block on the site. Anyone can post
   one certificate for the batch they are currently selling. Almost nobody can
   show nine months of consecutive batches holding 99.4%+. The DATES are what
   make it a record rather than three loose numbers — keep them on every row.
   Give it real weight, not a footnote.

6. "Awaiting payment" after a Zelle checkout is the NORMAL state, not an error.
   It clears when we match the payment by hand. Do not render it as a warning, a
   spinner, or anything red. A correct system must not be made to look broken.

7. Delivery estimates run from payment confirmation, not from checkout. On the
   Zelle rail an order can sit unconfirmed for a day, so a next-day SERVICE is
   not a next-day DELIVERY. Word every date accordingly.

8. Never display stock levels or scarcity ("only 3 left"). It is the opposite of
   what this shop claims to be.

9. Refunds are manual — neither payment method gives the buyer a card issuer to
   appeal to. The refund policy must be visible at checkout, not buried.


NUMERICS

Every purity, milligram, price, lot code, reference code and date should be
monospaced and column-aligned. It reads as instrument panel rather than
marketing, and makes the figures scannable, which is the point. If you have not
already chosen a mono face for data, JetBrains Mono is the house choice.


LEGAL — on every shop page, small type, not hidden or collapsed:

"For research and reference purposes only. Not intended as dosing instructions
for human or animal use, and not for human consumption. Consult a licensed
physician before any medical decisions. Adults 18+. US shipping only."

Checkout requires a signed-in account and 18+. There is no guest checkout.
```

---

## Why the backend is not in this handoff

Data, schema, pricing logic, payment adapters and the admin queue stay in the app
repo. The rules that matter most have no visual form — report codes never
reaching the client, no unit price on blends, never ranking by $/mg, RLS over
health data, lot-level recall traceability, HMAC verification on the payment
webhook. A tool optimising for visual output drops those silently and the result
still looks correct.

`docs/BACKEND-CONTRACT.md` §13 is the interface.
