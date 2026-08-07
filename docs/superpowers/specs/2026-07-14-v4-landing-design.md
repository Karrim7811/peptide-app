# V4 Landing — Dark "Intelligence Layer" Marketing Surface

**Date:** 2026-07-14
**Surface:** Web app (`src/`) only. iOS app (`ios-native/`) untouched.
**Source of truth:** `design_handoff_peptide_cortex_v4/` (`README.md` + `Peptide Cortex v4.dc.html`).

## 1. Goal

Rebuild `src/app/page.tsx` as the V4 dark, single-scroll "Intelligence Layer for Peptide
Research" marketing surface: a fixed particle-network canvas behind sequential scenes
(corpus → mechanisms → peptides-as-nodes → synthesis → terminal), followed by four
interactive feature sections (interaction checker, curated stacks, bloodwork analyzer,
Cortex AI chat), a trust band, two-SKU pricing, and a final CTA. Match V4's exact colors,
type, copy, spacing, and signature motion, expressed in the app's React/Next + Tailwind
conventions and wired to real data where it's free and anonymous-safe.

## 2. Owner decisions (settled)

1. **Brand:** Go dark, all-in. V4 dark palette supersedes the light-brand lock in
   `CLAUDE.md` §16.2. Whole app migrates to dark *eventually*; **this spec ships the
   landing page**. Internal app routes (dashboard, /checker, /ai-chat, etc.) keep the
   light theme for now and are restyled in follow-up work.
2. **Gated-widget behavior:** *Live where safe, demo where gated.*
   - Checker: real 63-compound autocomplete (`ALL_PEPTIDES`), verdicts computed
     client-side from a curated local interaction map, labeled illustrative, with a
     "Run the full checker →" link to `/checker`. No API call from the public page.
   - Curated Stacks: real named-stack data, rendered live.
   - Full-stack scan, Bloodwork, Chat, Terminal: labeled illustrative demos (prototype's
     canned data + animations) each with an "Open in app →" CTA to the real tool.
3. **Waitlist CTA:** No waitlist endpoint/table. Hero + final CTA "Request Access" forms
   take an email and route to `/signup?email=<encoded>` (prefilled). Success-swap UI is
   dropped in favor of navigation.

## 3. Non-goals

- No new API routes, no Supabase schema change, no Stripe change.
- No restyle of internal authenticated app routes (follow-up effort).
- No real waitlist capture; no live AI calls from the anonymous landing page.
- No new external dependencies (pure CSS + canvas + existing Google Fonts).

## 4. Brand tokens & globals

**`tailwind.config.js`** — add a dark token group *alongside* existing light `cx.*`
(nothing overwritten):

```
cx.ink      #050505   page bg / cards
cx.panel    #09111F   terminal & card fills (low alpha)
cx.panel2   #070A10   terminal cells, chat/analysis panels
cx.panel3   #0A1421   autocomplete dropdown fill
cx.cy       #00E5FF   primary accent
cx.pu       #7C3AED   secondary accent
cx.go       #F7B731   climax accent (sparingly)
cx.cymid    #3BA7F0   pipeline gradient mid / "in range"
cx.pumid    #B06BE0   pipeline gradient / "monitor"
cx.dim      #B8C5D6   body copy
cx.muted    #8A97AC   secondary body
cx.faint    #6B7688   captions
cx.faintest #4A5568   micro-labels / disclaimers
```

Add `mono: ['JetBrains Mono','monospace']` to `fontFamily`.

**`layout.tsx`** — extend the Google Fonts `<link>` to include
`JetBrains+Mono:wght@300;400;500;600`. Landing renders its own dark surface; the global
`<body>` light background stays (landing wraps itself in `cx.ink`). Do **not** flip the
global body theme (would break the still-light internal routes).

**`public/manifest.json`** — update `theme_color`/`background_color` from `#0f172a` to
`#050505`; fix the app name to "Peptide Cortex" while here (stale-manifest cleanup, §13.4).

**`CLAUDE.md` §16.2** — append a dated note recording the reversal: V4 dark palette
approved 2026-07-14, supersedes the light-brand lock for the landing (and eventually the
app). Keep the JetBrains Mono / two-SKU / hard-edged decisions (already consistent).

## 5. Component architecture

Rebuild the monolith into focused client components. `page.tsx` becomes a thin `'use client'`
shell that composes them and mounts the canvas.

```
src/app/page.tsx                     shell: <ParticleNetwork/> + sections, mode state
src/app/_landing/
  Nav.tsx            fixed nav, glass-on-scroll, dot color tracks active mode
  Hero.tsx           #s1, email→/signup form, staggered v2rise entrance
  Corpus.tsx         #s2, auto-cycling paper feed (12 titles)
  Mechanisms.tsx     #s3 top (mode 2, purple) — Cormorant H2
  PeptideNodes.tsx   #s3 bottom (mode 3, cyan) — 3 stat numerals (66/12/10)
  Synthesis.tsx      #s4 (mode 4, gold), 5-stage reasoning pipeline
  Terminal.tsx       #s5, sample reference cockpit (3-col hairline grid, v2bar)
  Checker.tsx        #check, real autocomplete + local verdict map + stack-scan demo
  Stacks.tsx         #stacks, real curated stacks grid, per-row reveal stagger
  Bloodwork.tsx      #blood, illustrative markers + analysis, scroll auto-run demo
  Chat.tsx           #ai, canned Q&A demo w/ typewriter, "Open in app →"
  Trust.tsx          3 hairline cells
  Pricing.tsx        3 cards, Pro highlighted; real Stripe checkout wiring
  FinalCta.tsx       #cta, radial glow, second email→/signup form
  Footer.tsx
  _lib/
    ParticleNetwork.tsx   fixed canvas, 6 modes, mouse repel, reduced-motion static
    useReveal.ts          IntersectionObserver fade+rise (threshold .15, delay stagger)
    useSceneMode.ts       IO over [data-mode] → active mode 0..5 (shared via context/prop)
    tokens.ts             hex constants mirrored for canvas/inline use
```

Each component: one section, self-contained, presentational except Checker/Stacks/Pricing
which read real data. Motion hooks are shared and individually testable.

## 6. Section specs

Copy, type, colors, and spacing are lifted verbatim from the prototype (README §"Screens"
and the `.dc.html`). Notable per-section wiring:

- **Nav (§1):** wordmark "PEPTIDE CORTEX". Links Product · How it works · Checker · Pricing
  (in-page anchors). "Request Access" → `#cta`. Glass bg + cyan hairline appears at
  `scrollY>30`; dot color = mode 4→gold, 2→purple, else cyan.
- **Hero (§2):** H1 "PROTOCOL / INTELLIGENCE" (gradient). Email input + "Request Access";
  submit → `router.push('/signup?email=' + encodeURIComponent(email))`. Fine print 18+/
  educational verbatim.
- **Corpus (§4):** 12-title paper feed, masked, cycles every 900ms; reduced-motion shows a
  static dimmed list.
- **Mechanisms / PeptideNodes (§5–6):** Cormorant headlines; stats 66 compounds · 12 goal
  categories · 10 curated stacks (10 in cyan). Background modes 2 (purple mech anchors) and
  3 (cyan peptide-vial anchors).
- **Synthesis (§7):** pipeline LITERATURE→MECHANISMS→PATHWAYS→SYNERGIES→REFERENCE, staged
  glow 420ms stagger on scroll-in; color ramp cyan→purple→gold.
- **Terminal (§8):** 3-col hairline grid: evidence score bars (v2bar), mechanism chips,
  reference summary + "HIGH literature support". "ILLUSTRATIVE · SAMPLE" badge + disclaimer.
- **Checker (§9):** two inputs, autocomplete filters real `ALL_PEPTIDES` (`@/lib/peptides`).
  Defaults BPC-157 × TB-500. "Analyze →" runs scan-line then a verdict from a local
  `INTERACTION_SAMPLES` map (the prototype's 6 keyed pairs) with fallback "NO DIRECT SIGNAL".
  Severity states/colors: STUDIED TOGETHER (cy) · CAUTION (go) · MONITOR (pu) · NO DIRECT
  SIGNAL (muted) · SAME COMPOUND (muted). Sub-panel "Full-stack scan": meds×recs matrix demo,
  auto-runs on scroll. Below the card: "Run the full checker →" → `/checker`. Disclaimer verbatim.
- **Stacks (§10):** REAL data. The existing `/stacks/page.tsx` holds a local
  `STACKS: Stack[]` (`{ name, goal, components: {peptide,dose,frequency}[], description,
  duration, difficulty: 'Beginner'|'Intermediate'|'Advanced', tags }`). **Extract `STACKS`
  + the `Stack`/`StackComponent` types to `src/lib/stacks.ts`** and import in both the
  landing and the existing `/stacks` page (no behavior change to `/stacks`). Landing card =
  index number, difficulty badge (Beginner cy / Intermediate pu / Advanced go), Cormorant
  title (`name`), one-line `goal`, compound chips (`components.map(c => c.peptide)`) —
  **no doses/frequencies shown** on the marketing card. Render all real stacks (min 300px
  cols, hairline gaps, per-row reveal stagger). "Open the library →" → `/stacks`.
- **Bloodwork (§11):** illustrative — dashed "bloodpanel_2026.pdf" chip, 8 parsed markers with
  level bars, right-side analysis with 4 grouped recs, scan-line, auto-run on scroll. Full
  disclaimer verbatim. "Open the analyzer →" → `/bloodwork`.
- **Chat (§12):** canned opening + 4 Q&A pairs w/ typewriter, suggested chips, fallback.
  Header "context: your stack · 6 compounds" (demo copy). Disclaimer verbatim. "Chat in app →"
  → `/ai-chat`.
- **Trust (§13):** SOURCED (cy) / REFERENCE, NOT RX (pu) / YOUR DATA (go) — verbatim promises.
- **Pricing (§14):** Free $0 / Pro $9.99·mo (highlighted, cyan side borders) / Lifetime $99.99.
  CTAs: Free "Start Free" → `/signup`; Pro/Lifetime → the existing Stripe checkout flow used by
  `/pricing` (reuse its create-checkout call/params; if that requires an authenticated session,
  route logged-out users to `/signup` first, matching current pricing behavior). No monthly/
  yearly toggle.
- **Final CTA (§15):** radial cyan glow, H2 "Enter the intelligence layer." (gradient), second
  email→/signup form, fine print verbatim.
- **Footer (§16):** align wordmark to full "PEPTIDE CORTEX". Terms → `/terms`, Privacy →
  `/privacy`, Contact → `mailto:hello@peptidecortex.com`. Copyright verbatim.

## 7. Particle network (signature)

Port `startNetwork()` into `ParticleNetwork.tsx` faithfully: fixed full-viewport canvas
(z-0), 60–150 nodes scaled by viewport (density prop default 1), proximity lines, mouse
repel within 130px, per-mode formations 0–5 (hero rings, corpus drift, mechanism anchors
purple, peptide vial-glyph anchors cyan, synthesis vertical pipeline gold, quiet drift),
color lerp toward `modeColor(mode)` at 0.05/frame. Active mode comes from `useSceneMode`
(shared IO over `[data-mode]`). `prefers-reduced-motion` OR a `reduceMotion` prop → draw a
single static network (`drawStatic`) and no rAF loop. Radial vignette overlay at z-1; all
content z-2. Clean up rAF + listeners on unmount.

## 8. Accessibility & compliance

- Respect `prefers-reduced-motion` for canvas, paper-feed cycle, pipeline, typewriter,
  reveals (reveals resolve to visible immediately).
- Canvas is decorative: `aria-hidden`, `pointer-events:none`.
- Every medical-adjacent section keeps its educational-use disclaimer **verbatim** from the
  prototype (disclaimer parity, `CLAUDE.md` working principles) — copy the exact strings from
  the `.dc.html`, do not paraphrase. No "your dose" phrasing anywhere. Sample/illustrative
  surfaces stay labeled "ILLUSTRATIVE" / "sample".
- **AI-consent routing:** any surface that fires a real Claude-backed request MUST call
  `useAiConsent().requireConsent()` (from `@/components/AiConsentProvider`) and get `true`
  before the fetch. The landing page makes **no** live AI call (checker → local map;
  chat/bloodwork → canned demos), so the gate isn't triggered on the anonymous page; its
  "Run the full checker →" / "Open in app →" CTAs route to `/checker`, `/ai-chat`,
  `/bloodwork`, which already enforce consent. If any landing widget is later switched to a
  live call, the `requireConsent()` gate is a hard requirement, not optional.
- Email inputs use `type="email" required`; forms navigate rather than silently swap so
  behavior is truthful (no fake "you're on the waitlist").

## 9. Files touched

- `src/app/page.tsx` (rebuilt), `src/app/_landing/**` (new).
- `src/lib/stacks.ts` (new — `STACKS` + types extracted from `/stacks/page.tsx`);
  `src/app/stacks/page.tsx` (edited to import from it — no behavior change).
- `src/lib/landing-samples.ts` (new — checker verdict map, bloodwork + chat canned data,
  terminal figures; all clearly labeled sample data, keeps components lean).
- `tailwind.config.js` (dark tokens + mono), `src/app/layout.tsx` (font link).
- `public/manifest.json` (theme colors + name).
- `CLAUDE.md` (§16.2 reversal note).

## 10. Verification

- `npm run build` clean (no type errors).
- Drive the page (webapp-testing / browser): scroll top→bottom; confirm canvas modes shift,
  reveals fire, paper feed cycles, pipeline stages light, checker autocomplete filters real
  compounds and verdict renders, stack-scan + bloodwork auto-run on scroll, chat typewriter
  works, pricing/hero CTAs navigate to `/signup` and `/checker` etc.
- Toggle `prefers-reduced-motion` → static canvas, no animation loops, content visible.
- Verify no console 401/403 (no AI API is called from the anonymous page).
- Mobile viewport: no horizontal scroll; grids collapse (hairline `auto-fit` handles it).
```
