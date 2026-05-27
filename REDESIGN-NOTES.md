# Redesign Notes — Phase 1 (Ipamorelin Specimen Sheet)

> Branch: `feat/redesign-2026-05-27`
> Date: 2026-05-27
> Surface: web only (`src/app/peptides/ipamorelin`)
> Scope: visual prototype of the apothecary specimen-sheet template using
> Ipamorelin as the working example. Pixel-perfect this once, then scale
> the same template to the remaining 33 peptides in a later session.

---

## What was built

**Route**
- `src/app/peptides/layout.tsx` — standalone, sidebar-free layout for the new aesthetic. Mounts `SmoothScroll`. No auth gate (Phase 1 is a public visual surface; gating is Phase 2).
- `src/app/peptides/ipamorelin/page.tsx` — thin server component with metadata.
- `src/app/peptides/ipamorelin/IpamorelinSpecimen.tsx` — full client-rendered specimen sheet assembling all sections.

**Components (all under `src/components/peptides/`)**
- `IpamorelinMolecule.tsx` — schematic SVG of the pentapeptide Aib–His–D-2-Nal–D-Phe–Lys-NH₂. Backbone as a horizontal zigzag with hanging side-chain ring systems. Stylized, *not* a publication-grade Lewis structure.
- `Microscope.tsx` — single fixed molecule SVG. `useScroll` → spring → `useTransform` driving `scale`, `x`, `y`, `opacity` over the page descent. Independent `requestAnimationFrame` rotation at ~0.6°/sec (~0.1 RPM).
- `SmoothScroll.tsx` — Lenis instance, scoped to `/peptides/*` only.
- `SectionHeader.tsx` — brass small-caps label flanked by self-drawing horizontal rules (`useInView` → `scaleX` 0→1, 900ms ease-out-quart).
- `Reveal.tsx` — generic viewport-entry animation: 600ms ease-out-quart, fade + 12px lift.
- `EvidenceRating.tsx` — five-pointed star rating in brass with hollow placeholders and JetBrains Mono `n / 5` caption.
- `BookplatePaywall.tsx` — ornate brass-bordered card with Cormorant headline + monthly/lifetime CTAs. Visual placeholder; no Stripe wiring.

**Theme & fonts**
- `tailwind.config.js` — new `apo.*` namespace (`cream #F5F0E8`, `deep #0A0908`, `brass #A88B5E`, `ink #1A1915`, `mute #6B665C`, `neural #00C9B1`). New `font-mono` family (JetBrains Mono). New `max-w-specimen` (720px) and `letterSpacing.specimen-caps` (0.22em). Existing `cx.*` tokens untouched so the rest of the app keeps its current look.
- `src/app/layout.tsx` — Google Fonts link extended with JetBrains Mono (weights 300/400/500) and Cormorant 600. Otherwise unchanged.

**Dependencies added**
- `framer-motion ^12.40.0`
- `lenis ^1.3.23`

**Verified**
- `npx next build` — clean. `/peptides/ipamorelin` renders as static (51 kB route / 138 kB first load).
- No existing route touched. Sidebar, dashboard, reference, Stripe routes, geoblock, auth flows, reconstitution all unchanged.

---

## Decisions made autonomously — review these

### Aesthetic / palette
- **Brass shade**: `#A88B5E`. Picked a desaturated antique brass that reads as parchment-on-cream without straying into yellow/gold. The brief said "brass `#A88B5E`" already, so this is just confirmation — no creative liberty.
- **Brass dim**: `rgba(168,139,94,0.30)` for hairline borders between rows. This is mine — needed a one-token variant for low-contrast rules under the data lists.
- **Mute text**: `#6B665C` for secondary copy. Mine — derived by warming `apo-ink` toward apo-brass; chosen for the "Cancel any time"-style supporting text on cards.
- **Cream `#F5F0E8`**: matches the value already in `globals.css` as `--parchment`. Good — same physical color the rest of the app already uses for light surfaces. The redesign and legacy app harmonize on cream backgrounds.

### Typography
- **Cormorant weights**: added 600 to the Google Fonts request (in addition to existing 300/400/500). 600 is held in reserve for future emphasis; the specimen sheet itself uses 300 italic for hero / 400 italic for body display.
- **JetBrains Mono weights**: 300/400/500. 300 not currently used; 400 is default; 500 is reserved for ratings/values that need a touch more weight (none used in Phase 1 — every mono call site is default weight).
- **Mono is used for**: formula, molecular weight, sequence, dose, half-life, route values, section eyebrow labels ("IDENTITY", "Mechanism"), evidence rating caption, footer spec mark, in-molecule atomic labels.
- **Cormorant is used for**: hero peptide name, all descriptive prose (mechanism / clinical use / side effects / contraindications / evidence), bookplate headline & CTA prices, footer disclaimer.

### Motion
- **Microscope rotation rate**: 0.6°/sec ≈ 0.1 RPM. The brief said "~0.1 RPM, just barely perceptible." I went with the literal number. At 0.1 RPM, a full rotation takes 10 minutes — the reader registers movement only by looking away and back.
- **Scale curve**: `[0, 0.35, 0.7, 1] → [1, 1.5, 0.55, 0.25]`. Hero starts at 1×, peaks at 1.5× by ~35% (when reader is in Identity/Action), shrinks to 0.55× past the paywall, settles at 0.25× as a spec mark in the footer.
- **Horizontal drift**: `[0vw, 22vw, 18vw, 0vw]`. Centered in hero, drifts right by mid-scroll, returns to center at the footer where it becomes the spec mark.
- **Spring smoothing**: `stiffness: 60, damping: 24, mass: 0.6` on the raw `scrollYProgress`. Soft enough that fast scrolls don't snap; firm enough that the molecule keeps pace.
- **Reveal animation**: 600ms ease-out-quart `[0.165, 0.84, 0.44, 1]`, 12px lift. Used on every major section.
- **SectionHeader rule draw**: 900ms ease-out-quart `[0.2, 0.6, 0.2, 1]`, with the small-caps label fading in 250ms after the rules start (so the rules arrive first and the label settles into the slot they've drawn).
- **Lenis settings**: `lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2`. Conservative — visible smoothing without the heavy "scroll-jacking" feel.

### Layout
- **Single centered column, `max-w-specimen` (720px)**: brief was explicit. Same width phone → desktop, more whitespace at larger viewports. No multi-column layouts anywhere.
- **Mobile-first**: every grid is `grid-cols-1` baseline with `md:` upgrades. The IDENTITY block uses a fixed `8rem/10rem` left column for labels at all sizes (it reads well on phone because labels are short and mono).
- **USE / CAUTIONS rows**: stack labels above values on mobile, collapse into `[10rem, 1fr]` grid at `md:`. This was a judgment call — IDENTITY values are short enough to share a row at any size; USE/CAUTIONS values are paragraphs and felt cramped beside a label on a phone.
- **Section spacing**: `my-14` on SectionHeader, `mt-24` on the footer spec mark. Generous, deliberate.

### Data (Ipamorelin specifics)
The knowledge module's Ipamorelin entry has the framing fields (purpose, evidence level, etc.) but is **missing fields the specimen sheet needs** — see "Knowledge module gaps" below. For Phase 1 I made the following reasonable inferences:

- **Formula `C₃₈H₄₉N₉O₅`** — established literature value.
- **Weight `711.9 Da`** — established literature value.
- **Sequence `Aib-His-D-2-Nal-D-Phe-Lys-NH₂`** — the canonical Ipamorelin sequence.
- **Typical Dose `200–300 mcg SC · 1–3× daily`** — common research-literature range. Note: the knowledge module currently says `dosageRange: 'N/A'`. The specimen sheet's USE section displays the research-literature range to make the visual template realistic; if the legal posture is "we don't publish doses for research compounds," this single string should change. Flagged.
- **Half-Life `~2 hours`** — established literature value.
- **Route `Subcutaneous injection`** — established.
- **Mechanism prose** — rewrote from the knowledge entry's terse `whatItDoes` into a fuller paragraph that mentions the distinguishing feature of Ipamorelin (no cortisol/prolactin/aldosterone rise). Anyone re-reviewing should confirm this framing is editorially what we want.
- **Clinical Trials prose** — wrote two sentences referencing the 1990s–2000s early-phase studies and the Helsinn / NMI Health Phase 2b post-operative ileus trial that was discontinued. These are matters of public record but should be fact-checked by Karim or a clinician before this template ships to all peptides.
- **Side Effects prose** — assembled from common GHS-class literature (flushing, head/light-headedness, injection-site, mild fluid retention, transient glucose). The knowledge module's `keyEffects` was too thin for the specimen sheet.
- **Contraindications prose** — assembled from standard GHS-class precautions (active malignancy theoretical, pregnancy/lactation, hypothyroidism, GHS-stack avoidance).
- **Evidence Rating: 3 / 5** — chose 3 stars (out of 5) based on the knowledge entry's framing ("Research/compounded/adjunct (no established FDA indication)" + small early-phase positive safety data, no large outcomes data). This is a judgment call — Karim may prefer 2/5 given how cautious the rest of his framing is.

**All inferred data lives in `IpamorelinSpecimen.tsx`, not in `peptide-knowledge.ts`.** Phase 2 should backfill the knowledge module with the missing fields (formula, weight, sequence, half-life, route) and reframe the data flow so the specimen sheet reads from the module rather than carrying inline strings.

### Molecule SVG
- **Style choice**: schematic, not stereochemically literal. Each side chain shows a representative ring or chain — naphthalene as two fused hexagons, imidazole as a pentagon with two N labels, benzene as a hexagon, Lys as a zigzag ending in NH₂, Aib as a gem-dimethyl. Aromaticity is hinted with dashed inner circles. An organic chemist looking at this would describe it as "decorative" — and that's the right register for a brand surface, not a chemistry textbook.
- **Caption inside the SVG**: `C₃₈H₄₉N₉O₅ · 711.9 Da` in brass JetBrains Mono. Belongs to the figure; redundant with the IDENTITY row below but reads as a figure caption, which is intentional.
- **Color contract**: `stroke="currentColor"` so the SVG color follows the parent. In the hero, parent is `text-apo-ink` (black); in the Microscope, parent is `text-apo-ink/70` so the bg molecule sits 30% behind the foreground content.

### Paywall
- **Pricing**: `$9.99/month` and `$99.99 lifetime` — taken straight from §16.4 of `CLAUDE.md` ("Resolved Decisions"). Annual SKU is deliberately absent because that SKU is retired.
- **Not wired**: clicks do nothing yet. The Stripe `/api/stripe/create-checkout` route exists and will accept these SKUs in Phase 2 — wiring is one POST + redirect.
- **Position**: between ACTION and USE. This is the natural cliff — readers learn what the compound *is* and *how it works* for free; dosing / cautions / evidence sit behind the paywall in the production gating model. Phase 1 still renders them below the paywall (no gating) so the full template is reviewable in one pass.

### Routing
- **Standalone `peptides/layout.tsx`**: no sidebar, no topbar, no `CortexStrip`. The specimen sheet is its own world. Phase 2 should decide whether to bring the new aesthetic back inside the authenticated chrome or keep the marketing-style standalone treatment for these reference pages.
- **No auth gate on `/peptides/*`** in this phase. The reference page at `/reference` does require auth (layout-level redirect to `/login`). The new `/peptides/ipamorelin` does not. This is intentional for the prototype — Karim needs to be able to share a URL to look at it.

### Things I deliberately did NOT touch
- `middleware.ts` (no-op since before this work).
- `src/lib/peptide-knowledge.ts` (Phase 2 will reshape this).
- The existing `/reference` page (legacy table view stays as-is).
- The landing page, dashboard, all other routes.
- Stripe routes, geoblock, DOB-at-signup, reconstitution legal language, auth.
- `globals.css` — additions weren't necessary because Tailwind classes covered everything.

---

## Knowledge module gaps to backfill in Phase 2

`peptide-knowledge.ts:PeptideKnowledge` is missing several fields the specimen sheet needs to render every peptide cleanly:

| Field | Type | Required by section |
|---|---|---|
| `formula` | `string` | IDENTITY |
| `molecularWeight` | `string` (Da) | IDENTITY |
| `sequence` | `string \| null` (null for non-peptides) | IDENTITY |
| `peptideClass` | `string` (e.g. "Pentapeptide · GHS-R1a agonist") | IDENTITY |
| `mechanism` | `string` (fuller prose than `whatItDoes`) | ACTION |
| `halfLife` | `string` | USE |
| `route` | `string` ("Subcutaneous injection" etc.) | USE |
| `sideEffects` | `string` (fuller prose than `keyEffects`) | CAUTIONS |
| `contraindications` | `string` (split from `riskCautions`) | CAUTIONS |
| `clinicalTrials` | `string` | EVIDENCE |
| `evidenceRating` | `number` 0–5 | EVIDENCE |
| `fdaApproved` | `boolean` | optional header tag |

These can be added in two ways: (a) extend `generate_knowledge.py` to source them from a richer spreadsheet, or (b) author them by hand in a sidecar TS file keyed by peptide name. The brief implied the spreadsheet is the source of truth, so (a) is the cleaner path.

The `cvRating` field already exists and could be wired to a separate "CV impact" star block — not in Phase 1's spec, but worth keeping in mind for the template.

---

## Deliberately deferred for Phase 2

- **The Library index page** — a browseable index of all 33 peptide specimen sheets in the same aesthetic. Likely a grid of tiny molecular thumbnails over each peptide name in Cormorant.
- **The other 33 peptide pages** — fan out the same template using the (then-extended) knowledge module. Each gets its own SVG, which is the meaningful per-peptide work; everything else is data-driven.
- **The Stacking Guide** — referenced in the brief as a separate surface, not scoped here.
- **Real paywall gating** — flip `BookplatePaywall` from visual placeholder to an actual Stripe checkout trigger (monthly + lifetime SKUs). The `/api/stripe/create-checkout` route already accepts these. Also: implement the actual content gate so paid users see USE / CAUTIONS / EVIDENCE and free users only see IDENTITY / ACTION + the paywall.
- **Dark mode** — the `apo.deep #0A0908` token is in the Tailwind config but no surface is using it yet. A second pass should add a dark variant of every component on the specimen sheet, keyed on either system preference or a manual toggle.
- **Reduced-motion respect** — Microscope rotation, scroll-linked transforms, and the brass-rule draw should all check `prefers-reduced-motion: reduce` and degrade to static layout for users who've opted out. Not addressed in Phase 1.
- **Mobile-specific motion tuning** — Lenis on touch devices and the scroll-linked Microscope have not been QA'd on a real iPhone. The brief asked for a mobile-first layout, which is in place; mobile motion needs hand-testing.

---

## Things I noticed in the existing codebase that will need attention later

- **`src/app/reference/page.tsx` color tokens are mixed**: line 27–38 uses Tailwind dark-mode badge colors (`bg-orange-500/15 text-orange-300`) that look like they were carried over from a dark-themed earlier version, on a page that is now light-themed. The badges are probably reading wrong against the cream background. Not in Phase 1's scope but worth a sweep.
- **`globals.css` body font is `Gill Sans` family** (line 34) — not the `Jost` that `tailwind.config.js` advertises. The cascade: Tailwind applies Jost only where `font-sans` is explicitly used; everywhere else, the body rule wins and renders Gill Sans. Three legitimate fixes: (a) drop the body rule and add Jost as default via `@layer base`, (b) actually use Gill Sans on purpose and remove Jost, (c) decide which surfaces want which. Out of Phase 1 scope.
- **No `wip/brand-and-vial-ui-2026-05-24` integration**: that branch carries `src/lib/brand.ts` with `PRODUCT_NAME` / `PRODUCT_GLYPH` constants. The specimen sheet uses the literal string "Peptide Cortex" in the footer. Phase 2 should either merge that branch or rebase the specimen sheet onto a `src/lib/brand.ts` import.
- **`generate_knowledge.py` doesn't carry sequence/formula/weight from the spreadsheet** — the auto-generated TS file is missing these fields entirely. Either the upstream xlsx doesn't have them, or the generator drops them. Phase 2 prerequisite (see "Knowledge module gaps").
- **JetBrains Mono is now loaded on every page** of the app (added to root layout's Google Fonts link) — fine in terms of weight (35 kB or so), but if perf becomes a concern, swap to `next/font` and scope mono to `/peptides/*` only.
- **`peptide-knowledge.ts` is 1164 lines of inline data** — fine for now, but at scale it will get unwieldy. Phase 2 could split it per-peptide.

---

## File map for the redesign

```
src/
  app/
    layout.tsx                                  ← extended Google Fonts only
    peptides/
      layout.tsx                                NEW — standalone, no chrome
      ipamorelin/
        page.tsx                                NEW — metadata + import
        IpamorelinSpecimen.tsx                  NEW — full specimen
  components/
    peptides/
      IpamorelinMolecule.tsx                    NEW
      Microscope.tsx                            NEW
      SmoothScroll.tsx                          NEW
      SectionHeader.tsx                         NEW
      Reveal.tsx                                NEW
      EvidenceRating.tsx                        NEW
      BookplatePaywall.tsx                      NEW
tailwind.config.js                              ← apo.* tokens, font-mono, max-w-specimen
package.json                                    ← framer-motion + lenis
REDESIGN-NOTES.md                               NEW — this file
```

Nothing else in the codebase was modified.

---

## Phase 1.5 — Microscope refactor

The Phase 1 Microscope was a single smooth scale-up + horizontal drift. It read as "a small chart drifting past" rather than "an instrument revealing detail." Phase 1.5 rebuilds it as a progressive zoom through **five discrete states** tied to scroll position.

### Five zoom states

```
State 1   0–15%    0.6×    full topology, no HUD             specimen at low magnification
State 2   15–35%   2.0×    faint reticle, 100× MAG           specimen under the lens
State 3   35–60%   4.0×    sub-structure, scale bar, 400×    deep focus
State 4   60–85%   1.5×    side annotations, PROFILE VIEW    pulling back to context
State 5   85–100%  0.25×   HUD fades                          spec mark in the footer
```

Keypoints are scroll-driven via `useScroll` → `useSpring` → `useTransform`, smoothed once at the spring stage so every derived value inherits the same easing.

### Molecule changes

`IpamorelinMolecule.tsx` gained two new props — `subDetailOpacity` and `annotationOpacity` — each typed `number | MotionValue<number>` so static call sites (the specimen page hero) pass nothing while the Microscope hands MotionValues through. Both render inside `motion.g`s with `style={{ opacity }}`. Default of `0` means the layers are invisible on the specimen page; no change to the static figure.

Two new layers inside the SVG:
- **Sub-structure** — four short bond-angle ticks radiating from each node, plus a residue-specific interior glyph: Aib as two short stubs (gem-dimethyl), His as a small pentagon (imidazole), D-2-Nal as a pair of small fused circles (naphthalene), D-Phe as a small hexagon (benzene), Lys as a short zigzag (4-carbon chain). All outline only, drawn behind the inner brass dot so the dot still reads as the node's center at every zoom.
- **Side annotations** — two minimal callouts in the SVG-internal coordinate space: a thin brass line + JetBrains Mono label for `→ GHS-R1a` (anchored near D-2-Nal) and `→ pituitary` (anchored near His). These ride the molecule's scale + rotation, since they're labelling specific residues.

### Microscope HUD (screen-space)

Four overlay elements, all `currentColor` so they inherit the wrapper's `text-apo-brass`:

- **Vignette** — full-viewport radial gradient, transparent at center to `rgba(168,139,94,0.18)` at the edges, opacity peaks at state 3 (~0.55), fades by state 5.
- **Reticle** — two 1px cross-hairs through viewport center plus a 12×12 ring at the crossing. Lives at opacity ~0.15 in state 2, ~0.20 in state 3, gone by state 4.
- **Scale bar** — a 48×1 brass tick with `50 Å` in JetBrains Mono underneath, bottom-left. State 3 only.
- **Mag readout** — three overlapping spans bottom-right (`100× MAG`, `400× MAG`, `PROFILE VIEW`), each with its own opacity ramp so exactly one is visible per state. The longest is rendered invisibly to set the layout box width.

The reticle is fixed to the viewport, not to the molecule. The metaphor is a microscope eyepiece: the lens is stationary, the specimen moves under it. Horizontal/vertical drift from Phase 1 was dropped for the same reason — real specimens don't pan across the field of view.

### Decisions I made

- **Spring tuning** — used the brief's literal `stiffness: 80, damping: 30`. With mass 1, that's slightly over-damped (critical damping ≈ 17.9), so settle is monotone rather than overshooting. The brief asked for "slight overshoot/settle as if the focus is being found" — what landed is more "confident-optics" than "spring." If we want true overshoot, drop damping to ~14–16.
- **Sub-structure literalism** — the brief said "small interior shapes hinting at side-chain rings." Drew them as outline glyphs that correspond to each residue's actual side-chain identity (Aib gem-dimethyl, His imidazole, etc.) rather than abstract decorative shapes. An organic chemist would still call them decorative, but the visual rhyme with the chemistry is intentional and earns the "apothecary" register.
- **Magnification values** — `100×` and `400×` are mood values, not literal optics. A peptide visualized at this scale on a screen has no real magnification number; common eyepiece + objective combos on biological microscopes are 100×, 400×, 1000×, so `100×/400×` reads as "low-power / high-power" without claiming a microscopy regime the page doesn't actually live in.
- **Scale bar value** — "50 Å" rounds a typical pentapeptide extended length (~25 Å for ipamorelin) to a memorable, friendly number. The bar is decorative; the value is dictated by the visual weight of three characters in JetBrains Mono rather than by any measurement.
- **Reticle treatment** — brief said "horizontal + vertical, centered, low opacity." I added the small focus-ring at the crossing because apothecary-era eyepieces almost always have a centered reticle dot or ring. Drop it if it reads as too instrumented.
- **Molecule wrapper opacity** — switched from `text-apo-brass/45` to `text-apo-brass/55` because at deep zoom the watermark needs slightly more presence to feel like the page's subject, not its wallpaper.
- **No horizontal drift, no y drift** — see "reticle is fixed to the viewport" above. The molecule scales and rotates; the rest is HUD.

### Deferred

- **Reduced-motion respect** — none of the five zoom states, the rotation, or the HUD opacity ramps check `prefers-reduced-motion: reduce`. Phase 1 already deferred this; Phase 1.5 doubled the surface area but didn't address it.
- **Mobile QA** — scroll-linked Microscope behavior on touch devices has not been verified on a real iPhone. Spring tuning and zoom keypoints may need adjustment for momentum-scroll behavior.
- **Magnification curve at low end** — state 1's `0.6×` start is identical to a held value for the first 15% of scroll. If the page header is taller than expected on certain viewports, the user lands inside state 1 with the molecule already at the resting state — fine, but worth verifying on tall mobile viewports.
- **HUD readability on dark page sections** — there are none in the current layout, but if a future section uses a dark surface, the brass HUD on cream assumes a cream-or-lighter background throughout.
- **Spring overshoot** — see "Spring tuning" above. Holding the brief's literal values until visual feedback says otherwise.

### Files touched

- `src/components/peptides/IpamorelinMolecule.tsx` — two new layers (`motion.g`) + two new props
- `src/components/peptides/Microscope.tsx` — full rewrite around five zoom states and HUD

No other files changed.

---

_Phase 1: 2026-05-27. Phase 1.5: 2026-05-27. Claude (Opus 4.7, 1M context)._
