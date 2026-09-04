# Shop → frontend handoff

**Do not send this while the main frontend rebuild is still running.** It is
written to *extend* a finished site, not to start one. Sending it mid-build
introduces new scope into work already in flight.

**Send it when:** the new frontend is built and you are happy with it.

**Send with it:** `docs/shop-sample-payload.json` — the real seven-product data.
That file matters more than the prompt. A designer given placeholder values makes
`pending` look tidy, and tidy is the one thing that state must not be.

---

## The prompt

```
The site you've built now needs a shop section. Seven products.

Match the design language you've already established — typography, colour,
spacing, component style. Nothing below is a visual instruction except where a
rule is load-bearing for the product; treat the rest as yours.

Two screens: a catalogue grid, and a product page.

THE DATA
Real values are in the attached shop-sample-payload.json. Design against those,
not placeholders. The layout has to survive:
  - 99.62% sitting beside $4.17 / mg
  - a four-row measured-component table totalling 90.65 mg against an 80 mg label
  - four products that have a DATE where a number should be

WHAT THE SHOP IS FOR
The entire positioning is that we publish the independent assay for every batch
and the price per milligram, and let the reader draw their own conclusions about
everyone else. We never mention a competitor. The numbers do the arguing, so the
numbers need to be the loudest thing on the page.

HARD RULES — product decisions, not style preferences. Each one is invisible in
a mockup, which is why they're written down.

1. Never sort, rank, filter or badge by unit price. Per-mg compares within a
   compound only. NAD+ at $0.075/mg beside Semax at $6.00/mg says nothing about
   value, so a "best value" badge built on it would actively mislead. Sort by
   sortOrder.

2. KLOW's unitPriceDisplay is null on purpose, not missing. Blends get no per-mg
   figure — it's four different molecules. The measured component table takes
   its place, and it's a stronger block than a percentage anyway: it shows the
   exact ratio AND that the vial holds more than the label claims.

3. The four pending products must show their expected month AND the sentence
   "This product ships with no published assay until then." Do not make this
   state look comfortable, resolved, or tidy. It should read as a gap we're
   admitting. If pending looks fine, the published figures on the other
   products stop meaning anything.

4. No "verify" link, badge, QR code, or scan affordance anywhere. There is
   nothing to link to yet. Leave room for one — it arrives later.

5. GLP-3's lot history — 99.62 / 99.73 / 99.46 across three consecutive
   batches — is the most important block on the site. Anyone can post one COA
   for their current batch. Almost nobody can show a run of them. Give it real
   weight, not a footnote at the bottom.

NUMERICS
Every purity, milligram, price, lot code and date should be monospaced and
column-aligned — it's an instrument-panel feel, and it makes the figures
scannable, which is the whole point. If you haven't already picked a mono face
for data, JetBrains Mono is the house choice.

LEGAL — appears on every shop page, small type, not hidden:
"For research and reference purposes only. Not intended as dosing instructions
for human or animal use, and not for human consumption. Consult a licensed
physician before any medical decisions. Adults 18+. US shipping only."

Read-only for now. No cart, no checkout, no quantity selectors.
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
