# Handoff: Peptide Cortex — V4 Marketing Site & Product Surfaces

## Overview

This package specifies the **V4 design direction** for Peptide Cortex — "the intelligence layer for peptide research." It is a dark, cinematic marketing/landing page whose interactive sections double as real product surfaces: an interaction checker, a full-stack scan, a bloodwork analyzer, a Cortex AI chat, a curated protocol library, a sample research terminal, plus waitlist capture and pricing.

The goal of this handoff is to **update the existing Peptide Cortex web app to match V4** — both the visual language (dark cyan/purple/gold, the specific type system) and the feature surfaces described below.

## About the Design Files

The file in this bundle — `Peptide Cortex v4.dc.html` — is a **design reference created in HTML**. It is a prototype showing intended look and behavior, **not production code to copy directly**. It is written as a self-contained "Design Component" (a custom `<x-dc>` runtime with an inline `class Component` for logic); that wrapper is scaffolding for the prototyping environment, not something to port.

Your task: **recreate this design inside the app's existing environment** (React/Next, Vue, etc.) using its established component patterns, routing, and data layer. Lift the exact values below — colors, fonts, spacing, copy — but express them with the app's own conventions. Where the prototype hardcodes sample data (compounds, stacks, markers), wire the real equivalents from the app's data layer.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, and interaction behavior are all specified. Recreate the UI pixel-close using the codebase's existing libraries and patterns. The canvas particle-network background and the "reasoning pipeline" animation are signature elements — reproduce them, but a faithful approximation is acceptable if the app's stack makes an exact port impractical.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Background (base) | `#050505` | Page background, cards |
| Panel / deep blue | `#09111F` | Terminal & card fills (used at low alpha) |
| Panel darker | `#070A10` | Terminal cells, chat/analysis panels |
| Panel alt | `#0A1421` | Autocomplete dropdown fill |
| **Cyan (primary)** | `#00E5FF` | Primary accent, CTAs, links, "clear/studied" state |
| **Purple (secondary)** | `#7C3AED` | Mechanisms scene, "monitor" state, secondary accent |
| **Gold (climax)** | `#F7B731` | Synthesis/reasoning scene, "caution" state — reserved, used sparingly |
| Cyan-mid | `#3BA7F0` | Pipeline gradient midpoint, "in range" bars |
| Purple-mid | `#B06BE0` | Pipeline gradient, "monitor" verdict |
| Text primary | `#FFFFFF` | Headlines |
| Text dim (`--dim`) | `#B8C5D6` | Body copy |
| Text muted | `#8A97AC` | Secondary body, feed rows |
| Text faint | `#6B7688` | Captions, labels |
| Text faintest | `#4A5568` / `#3F4A5C` | Micro-labels, disclaimers |
| Hairline border | `rgba(255,255,255,0.07)` – `0.16` | Dividers, card borders |
| Link default | `#00E5FF` | `a` |
| Link hover | `#7C3AED` | `a:hover` |

CSS custom props used in the prototype: `--cy:#00E5FF; --pu:#7C3AED; --go:#F7B731; --dim:#B8C5D6;`

### Typography
Three Google fonts:
- **Jost** (weights 200, 300, 400, 500) — display headlines, hero, big numbers. Weight 200 for the largest type.
- **Cormorant Garamond** (300/400, plus italics) — editorial section headlines (`Understanding *mechanisms*`, stack names, rec titles).
- **JetBrains Mono** (300–600) — all labels, eyebrows, nav, buttons, terminal text, chips, disclaimers. This mono font carries the "research instrument" feel; letter-spacing `0.14em`–`0.42em`, usually `text-transform:uppercase`.

Body default: Jost 300, `#FFFFFF` on `#050505`, `-webkit-font-smoothing:antialiased`.

Type scale (clamp-based, responsive):
- Hero H1: `clamp(46px, 9vw, 124px)`, Jost 200, line-height 0.98
- Big scene numerals ("Structured literature"): `clamp(48px, 10vw, 150px)`, Jost 200
- Section H2 (Jost): `clamp(30px–42px, 4.5–8vw, 58–100px)`
- Section H2 (Cormorant): `clamp(34px, 5–6.5vw, 64–84px)`, weight 300
- Body: `clamp(14px, 1.4vw, 18px)`, line-height 1.9
- Eyebrow labels: 9–10px mono, letter-spacing 0.34em, uppercase
- Stat numerals: `clamp(36px, 4vw, 56px)`, Jost 200

### Spacing & layout
- Content max-widths: `1180px` (most sections), `1120px` (product proof), `1000px` (pricing), `820px` (chat)
- Section vertical padding: `10vh–16vh` typical; full-height scenes `min-height:100vh`
- Horizontal padding: `clamp(20px, 5vw, 60px)`
- Nav height: `66px`, fixed
- Grid gaps: `1px` on a `rgba(255,255,255,0.07–0.1)` background to create hairline-separated cells (used for pricing, trust, stacks, terminal, bloodwork). This is a signature pattern — cells are opaque `#050505`/`#070A10`, the 1px gap shows the border color through.
- **No border-radius anywhere.** Everything is hard-edged rectangles. This is intentional — do not round corners.

### Shadows / effects
- CTA hover glow: `box-shadow: 0 0 24px rgba(0,229,255,0.6)`
- Card depth (terminal/chat): `0 40px 120px rgba(0,0,0,0.6)`, plus faint `0 0 60px rgba(0,229,255,0.05)`
- Glow dots: `box-shadow: 0 0 12px <accent>` on small status dots
- Grid overlay texture (video slot): 44px `linear-gradient` grid at `rgba(0,229,255,0.05)`

### Keyframe animations (names from prototype)
- `v2rise` — fade + translateY(24–30px) up; entrance for reveals
- `v2pulse` — opacity+scale pulse on live dots (2.4s)
- `v2scan` — vertical light sweep across terminal header (6s linear)
- `v2scanline` — horizontal scan line for "analyzing" states (~1s)
- `v2bar` — scaleX(0→1) grow for score bars
- Reveal-on-scroll: opacity 0→1 + translateY(30px→0), `cubic-bezier(.2,.7,.2,1)`, 1s, IntersectionObserver at threshold 0.15, with optional `data-reveal-delay` stagger.

---

## Screens / Sections (top to bottom)

The page is a single scroll. Behind everything sits a **fixed full-viewport `<canvas>` particle network** (z-index 0) whose color and formation morph per section (see Interactions). A radial vignette overlay sits above it (z-index 1); all content is z-index 2.

### 1. Fixed Nav
- 66px tall, transparent at top; on scroll >30px gains `rgba(5,5,5,0.72)` bg + `blur(14px)` + faint cyan bottom border.
- Left: glowing dot (color tracks the active scene: cyan→purple→gold) + wordmark **"PEPTIDE CORTEX"** (JetBrains Mono, 13px, letter-spacing 0.34em, white).
- Center links (mono, 9.5px, uppercase, `--dim`): Product · How it works · Checker · Pricing.
- Right: **"Request Access"** button — cyan fill, black text, mono uppercase; hover adds cyan glow.

### 2. Hero — "Arrival + Waitlist" (`#s1`)
- Full-height, centered.
- Eyebrow with pulsing dot: "The Intelligence Layer for Peptide Research".
- H1: **"PROTOCOL"** (white) / **"INTELLIGENCE"** (cyan→purple gradient text). Jost 200, clamp to 124px.
- Sub: *"A reasoning layer for peptide research — it reads the literature, maps the mechanisms, and organizes it into a structured reference. Built for researchers, not patients."*
- **Waitlist form**: email input + "Request Access" button in a cyan-bordered bar. On submit, the input row swaps for a success state: "✓ You're on the waitlist. We'll be in touch." (In the app, wire to the real waitlist endpoint.)
- Fine print: "Adults 18+ · Educational & research use only · Not medical advice"
- Entrance: staggered `v2rise` on each element (0.3s–0.95s delays).

### 3. Product Proof (`#product`)
- Eyebrow "This is the product"; H2 "A research terminal — not a chatbot."
- **Demo video slot**: 16:8 panel with a cyan grid texture, a circular play button (hover glows), and "Watch the 90-second walkthrough". Replace with the real walkthrough video.

### 4. Scene 01 — The Corpus (`#s2`)
- Full-height centered. Eyebrow "01 · The corpus".
- Huge two-line display: "Structured" (white→grey gradient) / "literature." (cyan).
- Sub-label: "Peer-reviewed research · sourced to primary references".
- **Paper feed**: a masked, auto-cycling vertical list of 12 study titles (mono, faint), each with a `◇` marker and "· peer-reviewed" tag. Cycles ~every 900ms with a fade gradient. Titles are illustrative examples of the literature (angiogenesis/BPC-157, GLP-1 satiety, TB-500 kinetics, etc.).
- Closing line: "Structured, sourced and queryable — every claim traceable back to a primary reference, not a hallucination."

### 5. Scene 02 — Mechanisms (`#s3`, first half)
- Bottom-aligned. Eyebrow "02 · Mechanisms" (purple).
- H2 (Cormorant): "Understanding *mechanisms*, not just molecules."
- Body about VEGF, mTOR, IGF-1, TGF-β pathway mapping.

### 6. Scene 03 — Peptides as Nodes (`#s3`, second half)
- Right-aligned. Eyebrow "03 · Peptides as nodes".
- H2 (Cormorant): "Every vial, *mapped* into the graph."
- Three stats: **66** compounds mapped · **12** goal categories · **10** curated stacks (10 in cyan).
- (During these two scenes the background network forms labeled mechanism/peptide constellations — see Interactions.)

### 7. Scene 04 — Synthesis (`#s4`)
- Full-height centered, gold-accented (climax). Eyebrow "04 · Synthesis".
- H2: "Watch Cortex *reason.*" (reason = gold Cormorant italic).
- **Reasoning pipeline**: 5 stacked stages that light up sequentially (420ms stagger) with a colored glow, connected by gradient lines: LITERATURE → MECHANISMS → PATHWAYS → SYNERGIES → REFERENCE. Colors ramp cyan→purple→gold.

### 8. Scene 05 — The Terminal (sample output) (`#s5`)
- Eyebrow "05 · The terminal · sample output"; H2 "A reference cockpit for your research."
- Terminal card with a scanning light sweep in the header, title `CORTEX://reference-terminal`, and an "ILLUSTRATIVE · SAMPLE" badge.
- Three columns (hairline grid):
  - **Evidence · literature depth**: 5 score bars (BPC-157 Extensive 0.9, TB-500 Solid 0.72, GHK-Cu Moderate 0.58, CJC-1295 Moderate 0.5, AOD-9604 Emerging 0.32), bars animate with `v2bar`.
  - **Mechanism map**: pill chips (VEGF, mTOR, IGF-1, FGF-2, TGF-β, GH, Angiogenesis) + "↳ pathways referenced / relationships mapped / synergistic pairs flagged".
  - **Reference summary**: RECOVERY THEME sample list + big "HIGH" literature-support readout.
- Disclaimer: "Sample interface. Evidence and confidence figures are illustrative, not clinical guidance."

### 9. Interaction Checker (`#check`) — REAL FEATURE
- Eyebrow "Try it · interaction checker"; H2 (Cormorant) "Check two compounds *before they meet.*"
- Two searchable inputs (Compound A / Compound B), each with an autocomplete dropdown over a list of **66 compounds** (full list in the prototype's `buildChecker` array — wire to the app's real catalog). Defaults BPC-157 × TB-500.
- Selected pair line + "Analyze →" button. On analyze: a scan-line animation (~1s), then a verdict card with a severity badge + prose. Severity states: **STUDIED TOGETHER** (cyan), **CAUTION** (gold), **MONITOR** (purple), **NO DIRECT SIGNAL** (grey), **SAME COMPOUND** (grey). Known pairs are keyed in a `data` map; unknown pairs fall back to "No direct signal…". Wire to the app's real interaction data.
- **Full-stack scan** sub-panel: user's meds (Metformin, Lisinopril, Atorvastatin) × Cortex recommendations (BPC-157, CJC-1295, Tesamorelin). "Scan all →" builds a matrix of CLEAR / MONITOR cells with per-flag notes. Auto-runs on scroll into view.
- Disclaimer: "Educational reference only. Not medical advice. Verify against primary literature and a licensed physician."

### 10. Curated Stacks (`#stacks`) — REAL FEATURE
- Eyebrow "Protocol library · 10 curated stacks" (gold); H2 (Cormorant) "Stacks, *assembled for a goal.*"
- Responsive grid (min 300px cols, hairline gaps) of **10 stack cards**, each: index number, difficulty badge (Beginner cyan / Intermediate purple / Advanced gold), Cormorant title, one-line goal, compound chips. Stack data is in `buildStacks` — wire to the app's real stack library. Cards reveal on scroll with per-row stagger.

### 11. Bloodwork Analyzer (`#blood`) — REAL FEATURE
- Eyebrow "06 · Bloodwork analyzer" (gold); H2 (Cormorant) "Hand Cortex your labs. Get the *whole picture.*"
- Two-column panel:
  - **Left**: a dashed "uploaded PDF" chip (bloodpanel_2026.pdf · Labcorp · 14 markers), "Analyze →" button, and 8 parsed markers with value, status label (LOW/ELEVATED/BORDERLINE/IN RANGE), and a colored level bar (Total Testosterone, IGF-1, hs-CRP, HbA1c, Vitamin D, ApoB, Ferritin, TSH).
  - **Right**: analysis output. Idle state prompts "Press Analyze". On run: scan-line, then a reference summary + 4 grouped recommendations (GH/IGF-1 axis → CJC-1295+Ipamorelin; inflammation → BPC-157; metabolic → Tesamorelin/Semaglutide; recovery → TB-500), each with `border-left` accent and staggered `v2rise`. Auto-runs on scroll.
- Disclaimer: "Educational reference only. Cortex describes peptides studied in relation to your markers — it does not diagnose, treat, or prescribe. Review all bloodwork with a licensed physician."
- **In the app**: replace the mock PDF with a real upload → parser; markers and recommendations come from real data.

### 12. Cortex AI Chat (`#ai`) — REAL FEATURE
- Eyebrow "07 · Cortex AI" (purple); H2 (Cormorant) "Your peptide intelligence, *on call.*"
- Chat card: header with live dot, "CORTEX AI", and "context: your stack · 6 compounds". Scrollable thread (340px), suggested-question chips, input + "Ask →".
- Opening bot message, 4 canned Q&A pairs, typewriter effect on responses, fallback message for anything else. **In the app**, wire to the real LLM/reference backend; keep answers sourced and non-prescriptive.
- Disclaimer: "Educational reference only. Cortex cites how compounds are studied — it does not provide medical advice or personal dosing instructions."

### 13. Trust Band
- 3 hairline cells: **SOURCED** (cyan) / **REFERENCE, NOT RX** (purple) / **YOUR DATA** (gold) — each with a one-line promise (primary-literature sourcing; educational reference for adults 18+; row-level data isolation, never sold/trained on).

### 14. Pricing (`#pricing`)
- Eyebrow "Pricing"; H2 "Start free. Upgrade when it earns it."
- 3 hairline cards: **Free $0** (full library, stack/dose log, 3 checks/day) · **Pro $9.99/mo** (highlighted with cyan side borders + faint gradient; everything free + unlimited AI, bloodwork & protocol tools, unlimited checks) · **Lifetime $99.99** (everything Pro, no recurring, locked-in, early access). Each with a CTA linking to `#cta`.

### 15. Final CTA (`#cta`)
- Centered, radial cyan glow behind. Eyebrow "Access is limited"; H2 "Enter the *intelligence layer.*" (gradient). Second waitlist form (same behavior as hero). Fine print repeats the 18+ / educational disclaimer.

### 16. Footer
- Glow dot + "CORTEX" wordmark (note: hero/nav use "PEPTIDE CORTEX" — align the footer to the full wordmark when you build it), "© 2026 Peptide Cortex · Tigris Tech Labs · Research use only", and Terms / Privacy / Contact links.

---

## Interactions & Behavior

### Background particle network (signature)
A fixed `<canvas>` renders 60–150 nodes (scaled to viewport × `meshDensity` prop) connected by proximity lines. An IntersectionObserver tracks which section is most in view and sets a **mode (0–5)**; the network re-forms and its color lerps accordingly:
- **Mode 0 (hero):** nodes orbit in loose concentric rings, cyan, gentle pulse.
- **Mode 1 (corpus):** free-floating drifting field, cyan.
- **Mode 2 (mechanisms):** nodes cluster around 8 labeled anchors (VEGF, mTOR, IGF-1, FGF, TGF-β, GH, Inflammation, Angiogenesis), **purple**, anchors ringed and connected.
- **Mode 3 (peptides):** nodes cluster around 12 labeled peptide anchors drawn as little **vial icons**, cyan.
- **Mode 4 (synthesis):** nodes align into a vertical pipeline formation, **gold**.
- **Mode 5 (product/terminal/etc.):** quiet, low-opacity drifting field.
Mouse repels nearby nodes (within ~130px). `prefers-reduced-motion` / `reduceMotion` prop → a single static network is drawn instead of animating.

### Nav
Scroll listener toggles the glass background; the nav dot's color follows the active scene mode.

### Reveal on scroll
`[data-reveal]` elements fade+rise in via IntersectionObserver (threshold 0.15), optional `data-reveal-delay` stagger. Counters (`[data-count]`) count up with an ease-out cubic over 1.8s when scrolled into view.

### Feature interactions
- **Checker / stack scan / bloodwork**: button-triggered "analyzing" scan-line (~1–1.15s) then result render; checker also auto-runs once; stack scan and bloodwork auto-run on scroll-into-view.
- **Chat**: typewriter response (~14ms/2 chars), suggested-question chips, Enter-to-send.
- **Waitlist forms**: optimistic row→success swap on submit.

## State Management
Prototype uses local component state only. For the app:
- **Waitlist**: email → POST to real endpoint; success/error states.
- **Checker**: `compoundA`, `compoundB`, autocomplete query state, verdict result. Source compound list + interaction map from the app's data layer.
- **Stack scan**: user's meds (from profile) × recommendations; computed flag matrix.
- **Bloodwork**: uploaded file → parsed markers → analysis result. Loading/empty/error states.
- **Chat**: message thread, streaming/typing state, stack context. Wire to real backend.
- **Stacks / catalog**: from the app's real stack & compound data (the prototype hardcodes 10 stacks / 66 compounds as samples that mirror the real catalog).
- **Scene mode**: derived from scroll position via IntersectionObserver (presentational only).

## Assets
No external image assets — the design is pure CSS/canvas + Google Fonts (Jost, Cormorant Garamond, JetBrains Mono). Two placeholders to fill in the app:
- **Demo video** (Product Proof section) — the real 90-second walkthrough.
- **Bloodwork upload** — real PDF upload/parse replaces the mock chip.
Any icons (play triangle, vials, status dots, `◇`, `⬗`) are drawn with CSS/canvas/unicode — replace with the app's icon system if it has one.

## Honesty / compliance note
This design deliberately avoids fabricated metrics (no invented paper counts or confidence percentages). Cortex is positioned as an **educational reference / reasoning layer**, not a protocol generator or medical advisor. Every feature carries an educational-use disclaimer. **Preserve this framing and all disclaimers** when implementing — it is a deliberate credibility/liability decision. Legal should review the checker and bloodwork phrasing before launch.

---

## Integrating into the existing codebase (`peptide-app`)

The target is the real repo: **Next.js 14 (App Router) · TypeScript · Tailwind 3.4 · Supabase · Anthropic Claude · Stripe · lucide-react**. Everything below maps V4 onto what already exists. Read the repo's `CLAUDE.md` first — several conventions there interact with this design.

### ✅ Brand direction: APPROVED — V4 dark palette supersedes the locked light brand
The repo's `CLAUDE.md` §6 and §16.2 lock the current brand to a light parchment palette (`cx.parchment #FAFAF8`) with a deep clinical teal accent (`cx.teal #1A8A9E`). **The owner (Karim) has approved moving to the V4 dark direction** — a dark (`#050505`) surface with cyan `#00E5FF` / purple `#7C3AED` / gold `#F7B731`. This supersedes the light-brand lock; proceed with V4. Implementation notes:
- Add a new dark palette to `tailwind.config.js` (e.g. `cx.ink #050505`, `cx.cy #00E5FF`, `cx.pu #7C3AED`, `cx.go #F7B731`, plus the panel/text greys in the token table) rather than overwriting the existing `cx.*` light tokens — keep both until the migration is deliberate.
- Update the stale PWA `manifest.json` `theme_color`/`background_color` to the dark palette at the same time (currently `#0f172a`, per `CLAUDE.md` §13.4).

### Good news: type system already matches
V4's font trio — **Jost + Cormorant Garamond + JetBrains Mono** — is exactly the repo's chosen stack (`CLAUDE.md` §6, §16.3: Cormorant display, Jost UI, JetBrains Mono for all numeric/data content). No font migration needed; just apply the V4 weights/scale. Fonts already load in `src/app/layout.tsx`.

### No border-radius, hairline-grid pattern
V4 is fully hard-edged (no rounded corners) and uses the "1px-gap-over-a-border-color background" grid for cards. This differs from the current app's card styling — apply it as the new convention for any surface you rebuild in the V4 direction.

### Section → route / API / data map
Wire each V4 surface to what already exists rather than reimplementing:

| V4 section | Existing route / API | Data source |
|---|---|---|
| Hero + waitlist forms | Landing `src/app/page.tsx`; `/api/user-count` for the public counter | New waitlist endpoint (none exists yet) or reuse signup |
| Interaction Checker + verdicts | `src/app/checker` + `/api/check-interaction` (Claude Opus 4.5) | `src/lib/peptide-knowledge.ts` (81+ compounds — the real catalog; V4's 66-item array is a sample, use the real one). Persist to `interaction_checks` (rate-limit ledger) |
| Full-stack scan (meds × recs) | Same checker API, looped over pairs | User `stack_items` × recommended peptides |
| Curated Stacks / Protocol library | `src/app/stacks` (browser) + `/api/stack-finder` | Real named stacks (KLOW, GLOW, Wolverine, Tri-Heal, etc. — 24+, per `CLAUDE.md` §4; V4 shows 10 samples) |
| Bloodwork Analyzer | `src/app/bloodwork` + `/api/bloodwork-ocr` (Claude vision) + `/api/bloodwork-analyze` | Real PDF upload → parsed markers (`src/lib/bloodwork-markers.ts`); save to `bloodwork_results`. Replace V4's mock `bloodpanel_2026.pdf` chip with the real uploader |
| Cortex AI Chat | `src/app/ai-chat` + `/api/chat` | User's `stack_items` loaded as context. Replace V4's 4 canned Q&A with the real streaming endpoint |
| Reference terminal (sample) | Presentational only — no live wiring needed | Keep "ILLUSTRATIVE · SAMPLE" labeling |
| Pricing | `src/app/pricing` + `/api/stripe/create-checkout` | **Two SKUs only** per `CLAUDE.md` §16.4/§16.5: Pro `$9.99/mo` and Lifetime `$99.99` one-time. The annual `$79.99/yr` is retired. V4's three-card layout (Free/Pro/Lifetime) already matches this — do not add a monthly/yearly toggle |

### Gating, consent, compliance (do not drop)
- **Pro gating**: bloodwork, unlimited AI chat, unlimited checks, protocol tools are Pro-only. Use `isProUser()` from `src/lib/subscription.ts`. Free = 3 interaction checks/day, full reference library, stack/dose log — V4's Free-card copy already reflects this.
- **AI consent**: any surface that calls a Claude endpoint must go through the existing `AiConsentProvider` / `AiConsentModal` flow before the first call.
- **Disclaimers are mandatory** (`CLAUDE.md` working principle "Disclaimer parity"). V4 already carries per-section educational-use disclaimers written in the correct posture ("educational research reference, not medical advice; adults 18+; research purposes only"). Keep them verbatim — they inherit the same posture as `src/app/terms`.
- **Age gate**: signup collects real DOB (`profiles.dob`), not self-attestation (§16.10). V4's "Adults 18+" fine print is marketing copy, not the gate itself.
- **Reconstitution / dosing language**: V4 deliberately avoids individual dosing instructions and fabricated metrics — preserve that. Never introduce "your dose" phrasing (§16.9).

### Model / backend notes
- Claude model in web routes is `claude-opus-4-5`. The "analyzing…" scan-line animations in V4 map naturally onto real request latency / streaming states — use them as the loading state, then render the real response.
- Supabase RLS is the security floor; keep per-user reads. Watch the known Stripe-webhook-under-anon issue (`CLAUDE.md` §13.3) if you touch subscription writes.

---

## Files
- `Peptide Cortex v4.dc.html` — the full V4 design reference (this bundle). Colors, copy, layout, animations, and the sample data arrays all live here.
- `README.md` — this document (self-sufficient; a developer who wasn't in the design conversation can implement V4 from it alone).
