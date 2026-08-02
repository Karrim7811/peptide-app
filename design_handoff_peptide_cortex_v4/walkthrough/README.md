# Peptide Cortex — 90s Product Walkthrough · Claude Code handoff

A timeline-driven animated walkthrough (14 scenes, 90s) matched to the v4 landing
palette. Drop it into the landing where the play button already lives:
`src/app/_landing/ProductProof.tsx` ("Watch the … walkthrough").

## Files in this folder
- `Peptide Cortex Walkthrough.dc.html` — reference build. Open in a browser to preview
  and to **export an MP4** (Share → Export → Video). This is the source of truth for
  look + timing.
- `walkthrough.jsx` — all 14 scene components + palette/helpers (`Open`, `Problem`,
  `Corpus`, `Mechanisms`, `Nodes`, `Synthesis`, `Planner`, `Vial`, `Checker`,
  `Bloodwork`, `StackAlerts`, `Chat`, `Reference`, `Close`).
- `animations-v2.jsx` — the timeline engine (`SceneStage`, `Sprite`, easing, export).

## Scene order + durations (seconds)
```
Open 5 · Problem 5 · Corpus 6 · Mechanisms 6 · Nodes 6 · Synthesis 7 ·
Planner 6 · Vial 8 · Checker 8 · Bloodwork 7 · StackAlerts 6 · Chat 7 ·
Reference 6 · Close 7        → 90s total
(each scene carries "nat" = its natural length so the full choreography
plays, compressed, within the shorter "dur")
```

## Recommended integration — RECOMMENDED: ship the MP4
For a marketing landing page this is the cheapest, most robust path and avoids
shipping the animation engine to every visitor.

1. Open `Peptide Cortex Walkthrough.dc.html`, **Share → Export → Video**, save as
   `public/walkthrough.mp4` (grab a poster frame too → `public/walkthrough-poster.jpg`).
2. In `ProductProof.tsx`, make the existing play button open a modal / inline the
   `<video>`:
   ```tsx
   <video
     src="/walkthrough.mp4"
     poster="/walkthrough-poster.jpg"
     controls
     playsInline
     preload="none"          // lazy — don't block the landing
     style={{ width: '100%', aspectRatio: '16/9', background: '#050505' }}
   />
   ```
3. Keep the poster = the Open scene so the slot looks intentional before play.

## Alternative — render it live in React
Only if you want it to play inline without a video file. The scene components are
plain React (no app deps) and the engine is framework-agnostic:

- Convert both `.jsx` files to a client module (`'use client'`), or keep them JSX and
  let the app's bundler transpile.
- Mount once, client-side only (dynamic import, `ssr: false`) — the engine uses
  `requestAnimationFrame`, `localStorage`, and an SVG/`foreignObject` stage:
  ```tsx
  const Walkthrough = dynamic(() => import('./walkthrough'), { ssr: false });
  ```
- Scenes are wired via `SceneStage` with a scene list + component map (see the
  `Walkthrough` wrapper at the bottom of `walkthrough.jsx`). The scene list currently
  reads `window.OM_SCENES` (the DC authoring contract) — replace that with a literal
  array of `{name, dur}` when porting to the app.
- Fonts required: **Jost** (200–500), **Cormorant Garamond**, **JetBrains Mono**.

## Notes / guardrails (keep these)
- All copy is qualitative and sourced-in-tone — **no invented efficacy metrics**.
  Dosing/reconstitution figures (e.g. 250 mcg, 2 mL BAC, U-100) are **illustrative
  sample values**; keep any "sample / illustrative" framing if you surface them.
- Approval-news statuses (Approved / Phase 3 / Research only / Not approved) are
  examples — wire to the real `regulatory` data source before implying they're live.
- Palette: bg `#050505`, cyan `#00E5FF`, purple `#7C3AED`, gold `#F7B731`,
  dim `#B8C5D6`. Matches the landing exactly.
- Runs exactly 90s. Timing is still editable on the DC's timeline (drag scene blocks).
  "Watch the 90-second walkthrough" label is accurate as-is.
