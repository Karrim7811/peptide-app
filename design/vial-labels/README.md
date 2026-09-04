# Peptide Cortex — RUO vial labels

Print-ready label artwork for 2–3 mL lyophilised peptide vials. One label per
entry in `peptides.json`; each label's DataMatrix encodes that batch's Janoshik
test report URL, so scanning a vial opens its own certificate of analysis.

```bash
npm install
npm run build          # dark skin (default)
node generate-labels.mjs light
```

Outputs `labels-<skin>/<slug>.svg` at true 53 × 26 mm, plus `sheet-<skin>.html`
— a contact sheet showing every label with its scan metrics. The sheet's print
stylesheet drops all chrome and prints the artwork at actual size.

## PNG export

```bash
node export-png.mjs             # dark, 1200 dpi → 2504 × 1228 px
node export-png.mjs light       # light skin
node export-png.mjs dark 2400   # higher, if a printer insists
```

Rendering goes through headless Chrome, not sharp/librsvg. The artwork calls
for Cormorant Garamond and Jost as webfonts and librsvg will not fetch them —
it silently substitutes a fallback, so the labels come out subtly wrong with no
error. Chrome loads the real faces.

1200 dpi is the default because label presses image at 600–1200; beyond that
the file grows without adding anything a press can reproduce. Prefer the SVGs
for anything going to a printer — they are resolution-independent, and PNG is
the wrong format to hand a press if it will take vector.

## Editing

`peptides.json` is the single source of truth:

```json
{ "slug": "63074-BPC157_10mg_2ST291UD8DZM", "compound": "BPC-157",
  "qty": "10 mg", "purity": "99.19%", "lot": "JA-63074",
  "mfg": "2025-04", "exp": "2027-04" }
```

- `slug` — the Janoshik report slug. This is what the DataMatrix encodes.
- `purity` — transcribed from the linked report. **Leave `null` if unknown**;
  the label then prints no purity claim rather than an invented one.
- `lot` — `JA-<task number>`, which ties the vial to its report by the same key
  the DataMatrix resolves to.
- `blend` — composition descriptor, used in place of purity on blend products.
- `shelfLife` — the in-use limit printed under the reconstitution field.

## Data provenance

Every purity figure was transcribed from the linked Janoshik report. Five
judgment calls were made in getting report values onto labels; all are
reversible in `peptides.json`.

- **Purity is floored, not rounded.** Reports give 5–6 significant figures
  (`99.189%`); labels print two decimals with the remainder truncated
  (`99.18%`), so the printed claim is never higher than the measured value.
- **Nominal quantity is printed, not measured.** Every vial tested over its
  label weight — `30 mg` products measured 32–36 mg. The label states what is
  sold; the linked report shows what was found.
- **Two reports cover two vials each.** `68244-T30` and `68243-R30` each print
  two results in one cell (`99.614%; 99.658%`). The label carries the **lower**
  of the pair, so both vials meet the printed claim.
- **Two blends carry no purity at all.** `102113-KLOW` and `70756-Glow` spend
  all three Results rows on analytes, so their reports print no Purity row.
  Those labels show a composition descriptor instead of an inferred number.
  KLOW's fourth component (`KPV: 11.20 mg`) appears only in that report's
  Comments box.
- **Expiry is a 24-month default,** derived from MFG. No report states an expiry
  — this is the usual convention for lyophilised peptide at −20 °C, but it is an
  assumption, not measured data. Confirm before printing.

- **Post-reconstitution shelf life is convention, not measurement.** The
  Janoshik reports test purity and content only — they say nothing about
  stability in solution. Values are conservative in-use limits for
  reconstitution with bacteriostatic water at 2–8 °C: 28 days for most, 14 for
  HGH and Tesamorelin, which are meaningfully less stable once in solution.
  Confirm against your own handling guidance before printing.

MFG is derived from the manufacturer batch code where it encodes a date
(`WBS20250420` → `2025-04`), otherwise from the report's analysis date.

## Type

Both faces come from the live site (peptidecortex.com), which ships exactly two
— there is no monospace anywhere in the brand:

| Role | Face | Site precedent |
|---|---|---|
| Wordmark, compound name | Cormorant Garamond | `.nav-logo-main` at `0.16em`, `.hero-logo`, `.hero-stat-num` |
| Everything else | Jost, uppercase | `.nav-link` / `.btn-*` at 10–11 px, `0.3em` |

Three deliberate departures from the web values, all for print:

- **Weight.** The site sets Cormorant at 300. It is a high-contrast Garamond and
  its hairlines drop out under thermal transfer below ~3 mm, so the label uses
  400 on the compound name and 500 on the 1.6 mm wordmark. Tracking is
  unchanged, so the mark's silhouette still matches.
- **Figures.** Lining + tabular are forced (`lnum`, `tnum`). Cormorant defaults
  to old-style, which sets the 5 and 7 of `BPC-157` below the baseline — a
  misreading risk on a compound identifier.
- **Greys.** Field labels sit at 1.05 mm, where `--mid` `#B0AAA0` goes
  illegible, so they step up one stop.

One compound-name size is computed across the whole set and applied to every
label. Fitting each name to its own zone put MOTS-c at 5.4 mm beside
Tesamorelin at 3.7 mm, which reads as an accident when the vials sit together.

## Layout

53 × 26 mm: a 50 mm wrap (measured circumference, Ø ≈ 15.9 mm) plus a 3 mm
self-adhering flap.

Height went 20 → 26 mm when the type scale grew and the reconstitution block
was added. With the wrap fixed at 50 mm, area can only come from height.
**This needs ≥26 mm of straight body below the shoulder — check a real vial
before a print run.** If it overhangs, drop `TYPE` one step and set `H` to 24.

```
0    3                                   36.5             53
├────┼────────────────────────────────────┼────────────────┤
│flap│ wordmark                           │                │
│    │ COMPOUND NAME                      │   DataMatrix   │
│    │ qty · purity                       │   12.5 mm      │
│    │ LOT · MFG · EXP        (overprint)  │                │
│    │ DATE OF RECONSTITUTION             ├────────────────┤
│    │ ┌────────── write-on ──────────┐   │ scan / storage │
│    │ USE WITHIN n DAYS · 2–8 °C         │                │
├────┴────────────────────────────────────┴────────────────┤ 20.6
│  RESEARCH USE ONLY · NOT FOR HUMAN CONSUMPTION           │
└──────────────────────────────────────────────────────────┘ 26
```

Two decisions worth keeping if the design is revised:

- **The warning runs the full width, edge to edge.** On a Ø14.75 mm body only
  about 23 mm of the 50 mm wrap is visible at once, so anything confined to one
  panel can be hidden by how the vial happens to be sitting. The band is legible
  at any rotation.
- **The warning sits outside every variable zone.** Batch data is overprinted
  after the shell is printed; a mis-registered overprint cannot erase the
  warning because there is no overlap.
- **The reconstitution field is a light patch on a black label.** It is the one
  place the dark skin inverts, because a date inked onto black stock would be
  invisible. That inversion also flags it as the field to fill in.

## The 2D code

DataMatrix ECC200, 12.5 mm, encoding `janoshik.com/tests/<slug>`.

Every sizing decision here is forced by the payload, so it is worth recording:

- **The `https://` scheme is dropped.** With it, a 57-character URL needs a
  32×32 grid — 0.313 mm per module at 10 mm, under the ~0.375 mm floor for a
  phone camera. Without it the payload fits 26×26. iOS Camera and Google Lens
  both linkify a bare `janoshik.com/…`, and the URL redirects to
  verify.janoshik.com regardless.
- **DataMatrix, not QR,** even though the audience is consumers with phones. QR
  mandates a 4-module quiet zone against DataMatrix's 1, costing ~3 mm of
  footprint. With only 15.4 mm above the warning band, QR at a comparable
  X-dimension does not fit.
- **12.5 mm, not 10 mm,** because the slugs are not uniform: 7 of the 23 are
  long enough to force a 32×32 grid. At 10 mm those would be 0.313 mm. 12.5 mm
  puts the worst case at 0.391 mm and the best at 0.521 mm, so one code size and
  one print setup covers the whole line.
- **12.5 mm is the ceiling.** It spans ~27% of the vial circumference; curving a
  2D code further starts costing read rates on a Ø14.75 mm body.

### Verifying

`_verify.mjs` rasterises every generated label and decodes its DataMatrix,
confirming it resolves to the right URL. All 23 decode, and still decode when
degraded to 100 dpi (≈1.5 px per module) — a wide margin over any real scan.

```bash
npm install --no-save zxing-wasm sharp && node _verify.mjs
```

Re-run it after changing `peptides.json`, the code size, or the payload format.

> **Stale counts.** The two figures above — "7 of the 23" and "All 23 decode" —
> date from when this set held 23 labels. It now holds 27. The four `JA-2050xx`
> batches were added afterwards and have not been through `_verify.mjs`, so the
> decode claim covers 23 of the current 27. Re-run the verifier before a print
> run and update both numbers to what it actually reports.

### Shortening the payload

If `peptidecortex.com/t/<key>` were set up to redirect to the matching Janoshik
report, every symbol would drop to 24×24 or below. That would allow a ~10 mm
code — less curvature, more margin, and a smaller footprint — while keeping the
scan on your own domain so the destination can change later. Worth doing if
these go to volume.

## Production

| | |
|---|---|
| Bleed | Add 1 mm all round on export; the artwork box is trim size. |
| Process | Thermal transfer or digital. Smallest type is 0.95 mm (≈2.7 pt), well below the floor for flexo. |
| Material | Polypropylene or vinyl, cryo-grade adhesive. Paper lifts at −20 °C and fails on condensation. |
| Fonts | **Outline all type before sending to print.** |
| Overprint zone | `x 26.6–36.3, y 1.6–14.6` — the dashed box. LOT / MFG / EXP only; everything else is static per compound. |
| Code contrast | Print the DataMatrix at full density. Do not scale, screen, or overprint it. |
