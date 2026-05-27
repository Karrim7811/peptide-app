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

## What's in iteration 3

Iteration 3 is the conceptual climax: the molecule resolved in iteration 2
dissolves back into dust and pours into an apothecary vial that rises from
below the viewport. Four commits, in order, on top of iteration 2:

1. `feat(crystal-field): HeroVial component — apothecary scale, brass typography, powder support` — `b91eab0`
2. `feat(crystal-field): vial reveal scroll state — materialize from below at 88-95%` — `1d476b7`
3. `feat(crystal-field): molecule dissolution and particle pour — cosmos resolves into powder` — `fb59eee`
4. `feat(crystal-field): final rest state — settled vial, ambient glint, page complete` — `cf08cdf`

### Part A — HeroVial component

`src/components/peptides-v2/HeroVial.tsx` — forked from `src/components/Vial.tsx` (which is untouched) and reshaped for hero context.

- 280×440 viewBox (5× the inventory vial). Interior geometry built from scratch around an apothecary specimen aesthetic: chunky screw-cap with shoulder + faint knurling, narrow neck, 22-px-radius rounded body.
- Glass is meaningfully transparent: a horizontal gradient (`#FFFFFF` 0.55 → `#F0EBE0` 0.18 → `#FFFFFF` 0.35) plus a faint vertical warm-cool tint. Visibly an empty bottle, not a frosted tube.
- Cap colour comes from `vialCapColor()` (Ipamorelin → `#D9A832` GH-axis gold). Cap-shadow stop overridden to `#7A5A1F` — patinated brass rather than plastic-clinical.
- Label paper: warm aged cream (`#FAF4E5` → `#F0E6CE`), hairline brass borders top/bottom. "Cortex Peptide" in Cormorant 500 small caps brass; peptide name in Cormorant 400 ink, ~2× larger. Dose text dropped.
- `powderHeight` prop (0–1) drives a stippled brass heap at the bottom of the body — filled rect base under a 9-point irregular top-edge path, 42 deterministic-seeded stipple circles, a few cream-highlight grains near the heap top, and a faint horizontal settling line. Not a smooth fill: granular crystalline material.
- `glint` prop (default 0.3) modulates two highlights: the static left-side specular and a 4-second SMIL `animateTransform` sweep that drifts a thin vertical band of light across the body.
- No due-now pulse, no `onClick` wrapping.

### Part B — Vial reveal scroll state

`src/app/peptides-v2/ipamorelin/page.tsx` gains a `VialReveal` component that wraps `HeroVial` in two nested `motion.div`s (outer handles centering; inner handles the `y`/`opacity`/`scale` transforms). MotionValue → numeric `powder` via `useMotionValueEvent` so the SVG re-renders only when the powder height changes.

Scroll keyframes:

| MotionValue | Range | Mapping |
|---|---|---|
| `vialY` | 0.88 → 0.95 | `60vh` → `0vh` (rise from below) |
| `vialOpacity` | 0.88 → 0.92 → 0.95 | `0` → `0.7` → `1` (eased fade-in) |
| `vialScale` | 0.88 → 0.95 | `1.2` → `1.0` (settle as it lands) |
| `powderHeight` | 0.90 → 0.97 | `0` → `0.35` (lags the rise) |

Cosmos timings compressed to make room:

| Factor | Old | New | Why |
|---|---|---|---|
| `coalK` | 0.55 → 0.92 | 0.55 → 0.85 | molecule fully resolved earlier |
| `sizeShrinkT` | 0.55 → 0.92 | 0.55 → 0.85 | matches coalescence end |
| `fadeOutT` | 0.85 → 1.0 | 0.80 → 0.90 | cloud gone before dust peak (particle budget) |

`MoleculeOverlay` now uses a 4-stop opacity transform `[0.78, 0.85, 0.88, 0.94] → [0, 1, 1, 0]` — it resolves, holds briefly, then dissolves to nothing. Scale settles by 0.85. `UseSection` and `CautionsSection` ranges tightened so both are gone by 0.95, leaving final rest clean.

### Part C+D — Dissolution and pour

A second particle pass added inside the existing `CrystalField` rAF loop. `generateDust(seed)` produces 200 `DustParticle`s (5 anchors × 40), each with:

- Origin jitter (small polar scatter around its anchor, 4–18 px) so the stream looks like dust shedding rather than a point source.
- A target inside the vial body — biased to the lower half (±90 px horizontal, +40..+170 px vertical of viewport center) so the accumulation reads as "pouring in".
- A quadratic bezier control point: midpoint of origin→target, offset perpendicular by `ctrlOffsetMag` (40–130 px) with a random sign per particle, so streams arc and braid.
- Per-particle `startT` (0.88 + 0–0.025) and `endT` (0.92 + 0–0.025) — staggers so the pour isn't monolithic.

Per-frame draw: skip if outside `[startT, endT]`. Compute `u`, evaluate the bezier, shrink the dot 1 → 0.55× as `u → 1`, lerp the colour from brass toward `#A88B5E` powder tint over `u ∈ [0.6, 1]`, alpha-envelope rise/hold/fall. Rendered onto the front canvas (above cloud remnants, below the z:4 vial).

Outside the 0.875–1.0 scroll window the dust pass short-circuits to a single conditional, costing nothing.

### Part E — Final rest state

By scroll 1.0 the page is the vial alone:

| Element | State at 1.0 |
|---|---|
| Cosmos particles | alpha 0, all culled by 0.90 |
| Molecule SVG | opacity 0 (from 0.94) |
| Dust particles | all past `endT` (max 0.945), skipped |
| USE / CAUTIONS overlays | windows closed at 0.95 |
| HeroVial | opacity 1, scale 1, y 0 |
| Powder | 35% of body height, label still legible above |
| Ambient glint | 4s sweep continues in perpetuity, baseline 0.3 |

`next build` clean. `/peptides-v2/ipamorelin` route is 47.9 kB First Load JS.

### Decisions made autonomously in iteration 3

- **Single canvas for dust, not a separate layer.** The brief offered both. Reusing the existing front canvas keeps the rAF loop single (a perf hard requirement) and avoids canvas ordering complications between cosmos remnants and arriving dust. The dust always sits visually above the cloud remnants because the cloud is already alpha-fading at this scroll.
- **Powder accumulation is scroll-driven (lagged), not particle-driven.** The brief explicitly green-lit this approximation. Computing exact powder volume from individual particle arrivals would be plausible-physics but visually identical to a smoothed `useTransform(progress, [0.90, 0.97], [0, 0.35])`. The lag (start at 0.90 rather than 0.88) reads as "heap forms as particles begin landing" without per-particle bookkeeping.
- **Label moved to the upper half of the body, not the middle.** First placement put the label band over y=232–340 in viewBox units; the powder heap at 35% would have sat behind it. Moved label to y=138–246 so the lower body is unobscured glass — the powder reads through, exactly the way a real specimen does.
- **Glint as SMIL `animateTransform`, not framer-motion / rAF.** Browser-handled animation costs zero React renders and zero JS frames. It's also visually identical to a JS-driven sweep. The brief mentioned a 4s period; SMIL handles it natively with `keyTimes`.
- **Cap shadow `#7A5A1F` (custom), not `vialCapColor().capShadow` (`#A6801F`).** The default GH-axis shadow is golden-clinical; an apothecary cap should patina toward iron-oxide. The custom stop sits between the cap colour and a deep brown — reads as aged brass, the original gold still visible.
- **Cosmos `fadeOutT` tightened to 0.80→0.90 (was 0.82→0.94).** With 200 dust particles spawning at 0.88, the 750-active-particle budget would have been blown if cosmos lingered. Tightening the fade leaves ~100 visible cloud particles when dust peaks, keeping total active ≤ ~300.
- **40 dust per anchor (not 30 or 50).** The brief's range was 30–50. At 40, the stream reads as "the molecule is breaking apart" without crowding. Fewer felt thin; more felt like a second cloud.
- **Bezier control-point sign is random per particle, magnitude varies.** Constant-sign curves would all bow the same way and read as a synchronized swarm. Random sign + 40–130 px magnitude gives a braiding, hand-poured feel.
- **Vial label content hardcoded to Ipamorelin.** Parameterization deferred to iteration 4 (when the templated peptide route lands).
- **No `prefers-reduced-motion` gating yet.** SMIL `animateTransform` and the spring-driven scroll pipeline will need it; explicitly out of scope per the brief.
- **Vial sits at z:4, above all overlays.** During the dust pour (0.88–0.95) the vial is fading in, and the dust needs to read as flying *to* the vial. Z-stacking it above lets the cap visually receive the stream.

## Deferred to iteration 4

- **Mobile / narrow-viewport tuning**. Vial at `size={1}` is 280×440; on a 375-wide viewport it overflows. Needs a size curve based on `min(vw, vh)`. Dust target offsets are in absolute px and assume the vial fits.
- **`prefers-reduced-motion`**. Disable ambient drift, vial rise/scale/glint sweep, snap scroll states. SMIL animation should respect `@media (prefers-reduced-motion: reduce)`.
- **EVIDENCE section**. Dose-response studies, sample sizes, study references. Sits between CAUTIONS and the vial — needs a scroll window that doesn't fight the dissolution.
- **Paywall**. Gating layer for non-Pro users at the deepest state.
- **Peptide parameterization for the vial label.** `HeroVial` already accepts `name` and `peptideName` props; the page currently hardcodes both to Ipamorelin. Generalize when the templated `[slug]` route lands.
- **Polish remaining from iteration 2**: cursor parallax, Neural Teal accent for interactive states, light-catching specular glints on a few crystals, molecule node interactivity (hover for amino info).
- **`/peptides-v2` index route**.

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

What to look for (iteration 3 additions):

**Scroll 0.85 — molecule resolved (compressed from 0.92)**
- The five-node Ipamorelin SVG is fully resolved and held in place at center.
- Cosmos particles have collapsed onto the 5 anchors and are fading rapidly (~50% gone).

**Scroll 0.88 — dissolution begins, vial appears below viewport**
- The molecule SVG opacity starts dropping.
- Dust particles begin spawning at the 5 anchor positions.
- The bottom edge of the vial cap may just be peeking up from below the viewport.

**Scroll 0.90 — dust streams visible, vial mid-rise**
- Strong streams of brass dust arcing from each anchor toward the rising vial. Curves braid: some bow left, some right.
- Vial is ~30% up from the bottom; opacity ~0.4; molecule SVG nearly gone.
- Cosmos is essentially invisible.

**Scroll 0.92 — peak pour**
- Vial is ~70% materialized, opacity ~0.7, still slightly oversized (scale ~1.07).
- Dust streams are at peak intensity, particles entering the cap and fading on contact.
- Powder heap beginning to form at the bottom of the vial (~10% of body height).

**Scroll 0.95 — vial settled, pour completing**
- Vial fully opaque, scale 1, sitting at center. Label legible: "Cortex Peptide" / "IPAMORELIN".
- Last few dust particles arriving and fading.
- Powder at ~25% of body height.
- USE and CAUTIONS content fully gone.

**Scroll 0.97 → 1.0 — final rest**
- Vial centered, powder at 35% of body height — a brass-tinted granular heap with stippled texture and a slightly irregular top edge.
- A thin vertical glint sweeps across the glass every 4 seconds.
- Nothing else on screen. Page ends here.
