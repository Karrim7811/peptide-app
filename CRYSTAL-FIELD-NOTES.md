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

## Deferred to iteration 2

- Motion: gentle parallax drift, per-particle rotation, slow breathing of the whole cloud, light catching on crystals.
- Scroll states: zoom-in transition from "atmospheric cloud" to actual peptide molecule structure.
- Interactivity: cursor influence on the field; the Neural Teal accent color enters here.
- Wordmark reveal animation (letters easing in from cloud).

## Deferred to iteration 3

- Mobile / narrow-viewport tuning (smaller particle count, denser cloud relative to viewport, wordmark size curve).
- Reduced-motion respect for `prefers-reduced-motion`.
- Below-the-hero sections (peptide overview, dosing reference, etc.).

## How to view

```
npm run dev
# → http://localhost:3000/peptides-v2/ipamorelin
```

What to look for:
- Cloud reads as soft and atmospheric, not punched-out against the parchment.
- Wordmark feels embedded — a handful of particles sit visibly in front of the letterforms, the rest drift behind.
- Edge of the cloud is lobed and natural, not a perfect circle.
- Most particles are quiet; a few crystal motes and cream highlights catch the eye.
- Amino letters render in JetBrains Mono (not a fallback) after the font loads.
