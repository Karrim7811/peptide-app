# Shop → frontend handoff

**Do not send this while the main frontend rebuild is still running.** It is
written to *extend* a finished site, not to start one. Sending it mid-build
introduces new scope into work already in flight.

**Send it when:** the new frontend is built and you are happy with it.

**Self-contained.** The data is inline, so this is one paste with no attachment.

**Before sending, check one thing:** the four `pending` products say "expected
October 2026". That date is a placeholder — replace it with the real one, or the
site ships a promise nobody made. Spec §10 item 2.

---

## The prompt

```
The site you've built now needs a shop section. Seven products, two screens:
a catalogue grid and a product page.

Match the design language you've already established — typography, colour,
spacing, component style. Nothing below is a visual instruction except where a
rule is load-bearing for the product. The rest is yours.


WHAT THE SHOP IS FOR

We sell research compounds. The entire positioning is that we publish the
independent lab assay for every batch, and the price per milligram, and then
let the reader draw their own conclusions about everyone else. We never mention
a competitor and we never claim anyone overcharges. The numbers do the arguing,
so the numbers need to be the loudest thing on the page.

Most shops in this market post a purity percentage with nothing behind it and
price in a way that makes comparison hard. We do the opposite. That contrast is
the design brief.


THE DATA — real values, not placeholders. Design against these.

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
   PENDING: assay commissioned, results expected October 2026. No lot code yet.

3. MOTS-c — 10 mg — $30.00 — $3.00 / mg
   Mitochondrial-derived peptide; activates AMPK.
   ASSAYED: 99.114% purity · 12.33 mg measured against a 10 mg label
   lot JA-102111 · MFG 2026-01 · EXP 2028-01

4. Selank — 5 mg — $30.00 — $6.00 / mg
   Tuftsin analogue; modulates GABA and monoamine systems. Nootropic/anxiolytic.
   PENDING: assay commissioned, results expected October 2026. No lot code yet.

5. Semax — 5 mg — $30.00 — $6.00 / mg
   ACTH(4-10) analogue; modulates BDNF and NGF. Nootropic/neuroprotective.
   PENDING: assay commissioned, results expected October 2026. No lot code yet.

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
   PENDING: assay commissioned, results expected October 2026. No lot code yet.

All products: cold chain, "USE WITHIN 28 DAYS · 2–8 °C".

So the layout has to survive: 99.623% sitting beside $4.17 / mg; a four-row
measured-component table totalling more than its own label; and four products
that have a date where a number should be.

OVERFILL. Where we have the figure, the vial holds more than the label claims —
MOTS-c is 12.33 mg in a 10 mg vial, KLOW 90.65 mg in an 80 mg one. That is
+23% and +13% of free compound, measured by a third party, and essentially
nobody in this market publishes it. Give it a place next to the purity figure.
Some products have no content figure yet; treat its absence as normal, not as
a broken layout.


HARD RULES — product decisions, not style preferences. Every one of these is
invisible in a mockup, which is exactly why they're written down.

1. Never sort, rank, filter or badge by unit price. Per-mg compares WITHIN a
   compound only — it exists so a buyer can weigh our retatrutide against
   someone else's. NAD+ at $0.075/mg beside Semax at $6.00/mg says nothing
   about value, so a "best value" badge built on it would actively mislead.
   Order the grid 1–7 as listed above.

2. KLOW has no per-mg price on purpose. It's four different molecules; a price
   per milligram of unspecified mixture is meaningless. The measured component
   table replaces it — and it's the stronger block anyway, because it shows the
   exact ratio AND that the vial holds more than the label claims. Nobody else
   in this market publishes that.

3. The four pending products must show their expected month AND the sentence
   "This product ships with no published assay until then."
   Do not make this state look comfortable, resolved, or tidy. It should read
   as a gap we're admitting to. If pending looks fine, the published figures on
   the other three stop meaning anything — that tension is the entire point of
   showing it at all.

4. No "verify" link, badge, QR code, or scan affordance anywhere. There is
   nothing to link to yet. Leave room for one — it arrives later.

5. GLP-3's lot history is the most important block on the site. Anyone can post
   one certificate for the batch they're currently selling. Almost nobody can
   show nine months of consecutive batches holding 99.4%+. The DATES are what
   make it a record rather than three loose numbers, so keep them on every row.
   It takes time to fake. Give it real weight — not a footnote.


NUMERICS

Every purity, milligram, price, lot code and date should be monospaced and
column-aligned. It reads as instrument panel rather than marketing, and it
makes the figures scannable, which is the whole point. If you haven't already
chosen a mono face for data, JetBrains Mono is the house choice.


LEGAL — on every shop page, small type, not hidden or collapsed:

"For research and reference purposes only. Not intended as dosing instructions
for human or animal use, and not for human consumption. Consult a licensed
physician before any medical decisions. Adults 18+. US shipping only."


SCOPE

Read-only. No cart, no checkout, no quantity selectors, no stock counts.
Payment comes later and is being built separately.
```

---

## Why the backend isn't in this handoff

The shop's data layer, schema, pricing logic and rules stay in the app repo. The
rules that matter most have no visual form — report codes never reaching the
client, no unit price on blends, never ranking by $/mg, RLS over health data,
lot-level recall traceability. A tool optimising for visual output drops those
silently and the result still looks correct.

`docs/BACKEND-CONTRACT.md` is the interface, the same channel the wider redesign
already uses.
