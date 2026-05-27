# Crystal Field — Iteration Notes

Branch: `feat/crystal-field-2026-05-27`

## What's in iteration 1

A static atmospheric "peptide at maximum zoom-out" hero composed at `/peptides-v2/ipamorelin`. The page is a single full-bleed hero with no navigation chrome and no scroll content below.

Three concentric layers, painted once on mount (no animation):

1. **Back canvas** (`z: 0`) — ~75% of particles, rendered behind the wordmark.
2. **Wordmark layer** (`z: 1`) — "IPAMORELIN" in Cormorant Garamond Light, calmly centered.
3. **Front canvas** (`z: 2`) — ~25% of particles, rendered in front of the wordmark with reduced opacity so it reads as foreground but doesn't compete.

The result is the wordmark feeling embedded in a circular brass cloud of crystal motes, single-letter amino codes, and faint molecular fragment hints.

## Files added

- `src/app/peptides-v2/layout.tsx` — full-bleed parchment wrapper, loads JetBrains Mono via `next/font/google` so the in-field amino letters render in the intended monospace.
- `src/app/peptides-v2/ipamorelin/page.tsx` — composes the back canvas, wordmark, and front canvas.
- `src/components/peptides-v2/CrystalField.tsx` — particle generator + Canvas 2D renderer; takes a `layer: 'back' | 'front'` prop and a stable `seed` (default `1337`) so both passes share the same particle set.

Nothing touched outside `peptides-v2` namespaces. Root layout, tailwind config, middleware, supabase, and all `/peptides/*` (none on this branch anyway) routes were left alone.

## Key parameters

| Parameter | Value | Notes |
|---|---|---|
| Total particles | `620` | inside the requested 500–700 target |
| Front-layer ratio | `0.25` | each particle assigned at generation time |
| Type mix | mote 50% / letter 30% / fragment 20% | matches brief |
| Mote sub-mix | hex 30 / pent 25 / tri 25 / needle 20 | balanced geometry, no single shape dominates |
| Fragment sub-mix | dipeptide 40 / aromatic 35 / tripeptide 25 | |
| Radial bias | `r = pow(random, 1.7)` | strong center bias, soft edge |
| Boundary noise | three sinusoidal lobes (3θ, 5θ, 7θ) at ±6/4/3% | gives an "imperfect circle" perimeter |
| Cloud radius | `max(min(w,h) * 0.46, w * 0.32)` | guarantees enough horizontal spread to embrace the wordmark on widescreens |
| Mote opacity | 0.15–0.55, with ~15% prominent (0.55–0.75) | most particles subtle, only a few catch the eye |
| Letter opacity | 0.20–0.65 | |
| Fragment opacity | 0.12–0.35 | barely-there, "almost-molecule" feel |
| Front-layer alpha multiplier | `0.75` | softens foreground without losing presence |
| Cream-highlight ratio | ~5% of motes | suggests light catching crystal edges |
| Seed | `1337` (default) | same value across both canvases ensures back/front draw a coherent shared cloud |

### Palette

```
Background:       #EDE3D0    warm parchment
Brass light:      #C9A876
Brass primary:    #A88B5E
Brass dark:       #7D6638
Cream highlight:  #FFFEF8    ~5% of motes
Ink (wordmark):   #1A1915
```

Neural Teal (`#00C9B1`) is reserved for later interactive states; not used this iteration.

### Typography

- Wordmark: `Cormorant Garamond` weight `300`, **roman** (non-italic), `clamp(4rem, 12vw, 16rem)`, letter-spacing `-0.02em`, color `#1A1915`.
- In-field amino letters: `JetBrains Mono` weight `300`, 9–14px, drawn via `canvas.fillText`. Loaded once in `peptides-v2/layout.tsx` via `next/font/google`. Canvas draw is gated on `document.fonts.ready` so the first paint uses the correct face, not a fallback.

## Autonomous decisions

- **Wordmark style: roman, not italic.** Italic felt scientific-floral and skewed botanical. Roman reads as apothecary plate / nineteenth-century display title — calmer, more authoritative, more "embedded artifact." Easy to flip in iteration 2 if you want it italic.
- **Single shared `CrystalField` component, called twice with different `layer` props.** Each instance generates the full particle list from the same seed and filters to its own layer at draw time. Keeps the component self-contained, avoids prop-drilling a 620-element array, and lets you tweak `FRONT_RATIO` in one place.
- **Particle positions stored in normalized polar (r 0–1, θ rad), projected to pixels at draw time.** Resize re-projects rather than re-generates, so the cloud stays stable visually as the window changes.
- **HiDPI by scaling canvas backing store to `devicePixelRatio`** and using `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Crisp on retina without doubling logical sizes everywhere.
- **Font-load gate before first draw** (`document.fonts.ready`). Without it, the canvas's first paint would render JetBrains Mono as fallback monospace, and on slow networks you'd see a flash.
- **Boundary noise is harmonic, not Perlin.** Three sine harmonics at θ multiples of 3/5/7 give a smooth, slightly lobed edge without pulling in a noise library. New-dep-free.
- **JetBrains Mono added via `next/font/google` in `peptides-v2/layout.tsx`**, not by editing the root layout. The brief said JetBrains Mono was "already loaded" but root `src/app/layout.tsx` only loads Cormorant Garamond and Jost. Scoping the font load to the `peptides-v2` route group leaves the rest of the app untouched and zero-cost.
- **Layout wrapper is `min-height: 100vh`, not `position: fixed`.** Fixed would have blocked future below-the-fold sections planned for later iterations. Flow positioning is the right default; the canvases inside use `position: fixed` to pin themselves to the viewport.

## What's in iteration 2

Iteration 2 turns the static specimen sheet into a viscerally-paced descent. Four commits, in order, on top of iteration 1:

1. `polish(crystal-field): tighten composition before motion` — `8801fd9`
2. `feat(crystal-field): ambient drift — particles breathe in place` — `6bd6440`
3. `feat(crystal-field): scroll-linked camera depth — five zoom states` — `4a5c152`
4. `feat(crystal-field): content overlays — sections emerge from the field` — `7b14e98`

### Part A — composition polish

- **Inner ring cleared**: particles can no longer occupy the inner 18% of the cloud (`MIN_R_NORM = 0.18` ≈ 80px on a 1440-wide viewport). Distribution is now `r = MIN_R_NORM + (1 - MIN_R_NORM) * pow(u, 1.7)`, preserving the soft falloff at the outer edge while opening a clean center for the wordmark.
- **Cloud center moved up**: `CLOUD_CY_FRAC = 0.45` (was `0.5`) — the cloud now centers on the wordmark's optical center, not the viewport's geometric center.
- **Wordmark letter-spacing**: `+0.04em` (was `-0.02em`). Engraved-monogram airier; the previous -0.02em was crowding the letterforms.
- **Wordmark vertical**: centerline at 45% of viewport (was 50%). Aligns with the new cloud center.

### Part B — ambient drift

The cloud is alive on load, before any scroll.

- One shared `CrystalField` component instead of two `<CrystalField layer="…" />` instances. It renders two canvases (back z:0, front z:2) and accepts the wordmark as `children` (z:1 between them). One particle list, one rAF loop — no risk of front/back desync.
- Per-particle drift state: `xNorm`, `yNorm` in cloud-local units of R; `vxNorm`, `vyNorm` random velocity. Magnitudes calibrated so on a typical viewport (R ≈ 460–480px) pixel speeds land in the brief's 0.05–0.20 px/frame range. Reference R baked into the conversion is `480`.
- Soft bounce against the cloud's lobed boundary (`boundaryNoise(theta) * 0.98`): reflect velocity component normal to the boundary, dampen to 0.85× so bounces settle rather than ricochet.
- Micro-rotation (`omega`) of ±0.05–0.20 deg/frame on crystals and fragments. Letters explicitly skip rotation accumulation (and the existing draw code already undoes any active rotation for letters, so they stay upright).
- `drawParticle` now takes `size`, `rotation`, `alpha` as parameters rather than reading them off the particle — lets the loop drive them from scroll progress without mutating the particle.

### Part C — scroll-linked camera depth

Five overlapping smoothstep transitions, all driven by one spring-smoothed `scrollYProgress` (`stiffness: 60, damping: 20`):

| Factor | Smoothstep range | Effect |
|---|---|---|
| `parallaxT` | 0.05 → 0.65 | outward push, magnitude `parallaxT * R * 1.8 * baseRNorm^0.7` |
| `sizeGrowT` | 0.0 → 0.55 | particle size × `(1 + 0.5 * t)` |
| `centerThinT` | 0.30 → 0.55 | alpha decay weighted by `(1 - baseRNorm) * 0.65` — hollows out the center |
| `coalK` | 0.55 → 0.92 | lerp draw position toward assigned molecule anchor |
| `sizeShrinkT` | 0.55 → 0.92 | particle size × `(1 - 0.85 * t)` — 5 piles don't blow out |
| `fadeOutT` | 0.85 → 1.00 | global alpha fade as the molecule SVG takes over |

Wordmark: `scale 1 → 1.3` over 0–25%, `opacity 1 → 0` over 10–25%.

Anchor assignment per particle: split the cloud into 5 vertical bands by initial cartesian x; particle goes to the anchor whose band it starts in. Coalescence motion looks natural because each particle moves the shortest plausible distance to its destination node.

Layout switched from `position: fixed / overflow: auto` to flow positioning + `min-height: 100vh` — the document scrolls now, so framer-motion's `useScroll()` works on `window` without needing a container target. Page has a `500vh` scroll spacer (5 viewports = ~1 viewport per state) behind a fixed visual surface.

`CrystalField` subscribes to the spring-smoothed progress MotionValue once via `progress.on('change')` and mirrors the value into a plain `useRef<number>`. The rAF loop reads `progressRef.current` synchronously each frame — no framer-motion overhead in the hot path.

### Part D — content overlays and molecule reveal

Specimen-sheet content floats inside the cloud rather than flowing below it. `src/components/peptides-v2/Overlays.tsx` exports `IdentitySection`, `ActionSection`, `UseSection`, `CautionsSection`, and `MoleculeOverlay`.

Section windows (label opacity / content opacity), four-stop fades (in-hold-out):

| Section | Label range | Content range |
|---|---|---|
| IDENTITY | 0.22–0.52 | 0.30–0.52 |
| ACTION | 0.48–0.76 | 0.54–0.76 |
| USE | 0.72–0.98 | 0.78–0.98 |
| CAUTIONS | 0.86–end | 0.88–end |
| Molecule | — | 0.78–0.96 (opacity), 0.92 → 1.0 (scale-in) |

Field positions are scattered (not a single column): IDENTITY uses top-left/top-right/center-bottom/middle-right; USE uses four corners arranged to clear the molecule reveal. ACTION is a single centered prose block.

Molecule SVG: viewBox 0 0 580 280, smooth quadratic chain `M 90 220 Q 140 202 190 190 Q 240 184 290 180 Q 340 184 390 190 Q 440 202 490 220` with five brass nodes (r=11, brass-light fill, brass-deep stroke) and three-letter codes (Aib · His · D-2-Nal · D-Phe · Lys) in JetBrains Mono below each.

### Decisions made autonomously in iteration 2

- **Spring tuning kept at brief defaults** (stiffness 60, damping 20). Tried looser (40/15) — felt drift-y after the user stops scrolling. Tighter (90/30) — read as snappy, not optical. 60/20 sits right at the "still feels physical, doesn't keep moving after you stop" line.
- **Parallax magnitude `1.8 × R` with `baseRNorm^0.7`**, not a linear factor. Linear made center particles feel sticky; the power 0.7 keeps near-center particles slower than edge ones but doesn't pin them. Edge particles travel ~1.8 × R from base by mid-descent, well into off-screen territory.
- **Anchor assignment by base x band**, not nearest-anchor. Nearest-anchor would have some particles travelling massive distances; banding keeps every motion natural. Side effect: the cosmos resolves with a faint left-to-right gradient as it coalesces, which reads as motion rather than chaos.
- **Size shrinks during coalescence** (0.85× reduction). Without this, 124 particles per anchor at 1.5× their original size produced 5 visually-overwhelming brass blobs. Shrinking them lets the molecule's actual nodes (drawn as r=11 SVG circles) read as the destination.
- **Global fade to 0 at scroll 0.85–1.0** so the molecule SVG sits on a clean stage at the bottom of the scroll. Otherwise the molecule appears overlaid on a haze of coalesced particles, which muddies the resolution.
- **Mechanism prose extrapolated**: source data only had "Ghrelin receptor agonist (GHS): stimulates GH release". Wrote a fuller sentence specifying GHS-R1a selectivity (no cortisol/prolactin/aldosterone perturbation) — accurate to literature, and necessary to fill the centered prose block at a readable length.
- **Clinical Use extrapolated**: source had "Research". Rewrote as "Investigational support of the somatotrophic axis; body-composition and recovery research." — the educational/research framing the project requires.
- **Document-level scroll, not container scroll**. Iteration 1's notes said `min-height: 100vh` was already the layout, but the actual code had `position: fixed / overflow: auto`. Fixed for iteration 2: layout is now flow positioning so `useScroll()` works on the window.
- **500vh of scroll travel** = ~100vh per state. Tried 400vh (states felt rushed) and 700vh (felt like a slog before the molecule arrived). 500 is the goldilocks.
- **Molecule width `min(70vw, 720px)`** — wide enough to read as the destination, capped so it doesn't lose its compactness on 4K monitors.
- **Coalescence ends at scroll 0.92, not 1.0**. Leaves ~8% of scroll for the molecule to sit alone, fully resolved. The bottom of the scroll is "the truth" with no motion still happening.

## Deferred to iteration 3

- **Mobile / narrow-viewport tuning** (smaller particle count, denser cloud relative to viewport, wordmark size curve, content overlay positions that work on narrow screens — the floating-corner layout pattern needs a stacked alternative below ~640px).
- **Reduced-motion respect for `prefers-reduced-motion`**: should disable ambient drift and snap scroll states rather than animate them. Easy hook into the rAF loop and overlay opacity-only fades (no scale, no translate).
- **EVIDENCE section**: dose-response studies, sample sizes, study references. Sits between CAUTIONS and the paywall.
- **Paywall**: gating layer for non-Pro users at the deepest state.
- **Polish remaining**: cursor parallax (subtle field-tilt with mouse position), Neural Teal accent for interactive states (hover/focus), light-catching specular glints on a few crystals, fine-tune molecule node interactivity (hover for amino info).
- **`/peptides-v2` index route**: currently only `ipamorelin` exists. Other peptides need their own pages or a templated `[slug]` route.

## How to view

```
npm run dev
# → http://localhost:3000/peptides-v2/ipamorelin
```

What to look for (iteration 2):

**At rest (no scroll)**
- Cloud is alive: every particle drifts slowly, crystals and fragments rotate gently in place, letters stay upright.
- Inner ring is clear — no particles bunch on top of the wordmark.
- Cloud center and wordmark center align (both at 45% viewport height).
- Edge of the cloud is lobed and natural.

**Scroll 0–10%** (Hero)
- Essentially unchanged from rest. Maybe a hint of size growth starting.

**Scroll 10–30%** (First descent)
- IPAMORELIN scales up to ~1.3× and fades out — by 25% it should be completely gone.
- Edge particles begin drifting outward toward viewport edges.
- IDENTITY label fades in around scroll 25% (small, centered top, brass).

**Scroll 30–55%** (Mid-depth)
- Particles continue spreading; many edge particles now offscreen.
- Center hollows out — fewer particles in the middle area.
- IDENTITY content visible in four floating positions:
  - Formula `C₃₈H₄₉N₉O₅` top-left
  - Weight `711.9 Da` top-right
  - Sequence `Aib-His-D-2-Nal-D-Phe-Lys-NH₂` center-bottom
  - Class `Pentapeptide · GHS-R1a agonist` middle-right
- ACTION label appears around scroll 50%.

**Scroll 55–80%** (Deeper)
- Particles begin coalescing — the remaining ones drift toward 5 anchor positions arranged in an arc.
- IDENTITY content fades out; ACTION content fades in:
  - Mechanism prose in italic Cormorant, centered, max-width ~560px.
- USE label appears around scroll 75%.

**Scroll 80–100%** (Deepest — molecule reveal)
- Particles have piled at the 5 anchor positions and faded down.
- The five-node Ipamorelin molecule resolves at the center: brass circles connected by a smooth quadratic curve, three-letter codes below each (Aib · His · D-2-Nal · D-Phe · Lys).
- USE content visible in four corners:
  - Clinical Use (top-left), Typical Dose `200–300 mcg SC, 1–3× daily` (top-right)
  - Half-Life `~2 hours` (bottom-left), Route `Subcutaneous` (bottom-right)
- CAUTIONS label appears around scroll 90%, with Side Effects (left) and Contraindications (right) below.
- The page ends here. The molecule is the destination.

**Performance notes**
- Target: 60fps on a 2021+ MacBook Pro. Particle count is held at iteration 1's 620.
- One canvas pair, one rAF loop. Scroll progress mirrored from a framer-motion MotionValue into a plain ref read synchronously per frame.
