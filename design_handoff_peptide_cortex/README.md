# Handoff: Peptide Cortex — "The Mirror"

## Overview

A full redesign of Peptide Cortex, replacing the current multi-page dashboard with a single
zoomable surface called **the Mirror**, plus a marketing home page, auth, and pricing.

The core idea: the current app spreads a user's stack across ~18 sidebar routes (`/stack`,
`/log`, `/cycle`, `/bloodwork`, `/checker`, `/reconstitution`…), so the user has to assemble
the picture themselves. The Mirror inverts that — one continuous field the user zooms
*into*, where relationships between compounds are the primary object and the old routes
become contextual tools that appear when a compound makes them relevant.

Target repo: the existing Next.js app (`peptide-app/`), App Router, Supabase, Tailwind.

---

## About the design files

The five files in this bundle are **design references written as standalone HTML**. They are
prototypes of intended look and behaviour — **not production code to copy**. They use a
lightweight in-browser component runtime and inline styles, neither of which belongs in the
target app.

**The task is to recreate these designs as React components in `peptide-app/`**, using its
existing environment: Next.js App Router, TypeScript, Tailwind, Supabase client, and the
lucide-react icon set already in use. Read the HTML for layout, exact values, copy, and
interaction logic; write idiomatic React/Tailwind to match.

`catalog.js` is the exception — see **Data layer** below. Its *content* is real and derived
from the repo's own source; its module format should be adapted to the app's conventions.

## Fidelity

**High-fidelity.** Colours, type, spacing, motion timings and copy are final. Recreate
pixel-accurately. Every hex value, font size and duration in this document is what the
prototype renders.

---

## Screens

### 1. Home — `Peptide Cortex Home.dc.html` → replaces `src/app/page.tsx` + `_landing/`

Marketing page. Sections top to bottom: nav bar, hero with animated field, "the problem"
(the current app's fragmentation stated plainly), the four zoom layers explained, the
three grounds, evidence-honesty section, closing CTA, legal footer.

### 2. Auth — `Peptide Cortex Auth.dc.html` → replaces `src/app/login/page.tsx` + `src/app/signup/page.tsx`

Two-column: left is an animated field panel with rotating copy, right is the form. A single
component with a `mode` prop (`'login' | 'signup'`) and an in-page tab switch.

**This design was reconciled field-for-field against the existing routes.** Preserve exactly:

| | Login | Signup |
|---|---|---|
| Fields | email, password | email, **date of birth**, password, confirm password (in this order) |
| Autocomplete | `email`, `current-password` | `email`, `bday`, `new-password`, `new-password` |
| Submit | `supabase.auth.signInWithPassword({ email, password })` → `/dashboard` | `supabase.auth.signUp({ email, password, options: { data: { dob }, emailRedirectTo } })` → confirmation state |
| Validation | non-empty | passwords match · password ≥ 6 chars · DOB present · age ≥ 18 |

- The DOB input carries `max={todayMinus18Years}` so the native picker cannot offer an
  under-18 date. Compute it, don't hardcode.
- Error strings are the repo's own, verbatim: `"Passwords do not match."`,
  `"Password must be at least 6 characters."`, `"Please enter your date of birth."`,
  `"You must be 18 or older to create an account."`
- Signup resolves to a **"Check your email"** state with the address echoed back — it does
  not log the user in.
- **No OAuth.** Google (#29) and Apple (#28) are listed as absent on web in the migration
  doc; the design deliberately has no social buttons.
- **No AI-consent checkbox at signup.** That is a separate first-AI-call gate owned by
  `AiConsentModal` (persists `user_metadata.ai_consent_granted` v1.0). Leave it there.

### 3. Pricing — `Peptide Cortex Pricing.dc.html` → replaces `src/app/pricing/page.tsx`

Monthly/annual toggle, two plan cards, a diagram explaining the free tier, a
safety-never-paywalled block, 5-item FAQ accordion, closing CTA.

Prices: **$14.99/mo**, **$119.88/yr** (renders exactly $9.99/mo, saves $60, 33% off), plus a
**one-month free trial** on Pro. Every price string is derived from two numbers — keep it
that way; hardcoded copy is how the badge and footnote fell out of sync during design.

### 4. The Mirror — `Peptide Cortex Mirror.dc.html` → replaces `src/app/dashboard/page.tsx`

The product. Four zoom layers over one field:

| Layer | Shows | Enter by |
|---|---|---|
| 1 · WHOLE | Your regions as glowing nodes | default |
| 2 · REGION | Compounds in one category, on one or two rings | click a region / scroll down |
| 3 · COMPOUND | One compound centred with a molecular scaffold, its stacking partners in orbit | click a compound |
| 4 · VERIFY | Tabs: THE MATH · THE RECORD · ROTATION · CYCLE | click a tool |

Navigation: **scroll over the field = zoom** (480ms throttle, ±12px deadzone), **Esc = out**,
breadcrumb is the only nav. A vertical rail on the right marks the current layer
(WHOLE ↕ MOLECULE). **Drag = rotate** the orbit, layer 3 only (`cursor: grab`).

Layer 4 deliberately drops all atmosphere — no particles, no motion. It is the verify surface.

---

## Layout

Three horizontal bands in a `flex-column`, `height: 100vh`, `overflow: hidden`:

- **Header** (`flex-shrink: 0`) — status dot, breadcrumb, ground toggle, tier toggle, Ledger, avatar
- **Stage** (`flex: 1; min-height: 0; display: flex; flex-wrap: wrap; overflow: auto`)
  - **Field** — `flex: 1 1 480px; min-width: 300px; height: 100%; position: relative; overflow: hidden`
  - **Panel** — `flex: 1 1 360px; max-width: 520px; min-width: 300px; overflow: auto`
- **Footer** (`flex-shrink: 0`) — ask bar, suggestion chips, hint

**Responsive with no media queries.** The stage is a wrapping flex row: the panel sits as a
right rail on desktop and stacks under the field below ~800px. Reproduce this with flex-wrap,
not breakpoints.

The **Ledger** is a full-bleed `position: absolute; inset: 0; z-index: 20` overlay — the plain,
sortable record. Deliberately styleless by comparison: "the form is for understanding, the
Ledger is for proving."

---

## Design tokens

Three grounds, switched by writing CSS custom properties onto the root element. **Midnight is
default.**

| Token | Midnight | Dusk | Daylight |
|---|---|---|---|
| `--bg` | `#030308` | `#1C2430` | `#F7F4EE` |
| `--panel` | `#0C0C14` | `#243040` | `#FFFFFF` |
| `--panelHi` | `#14141E` | `#2B3848` | `#F1EDE4` |
| `--panelHot` | `#12120A` | `#2E2E20` | `#FBF3DF` |
| `--hair` | `rgba(255,255,255,.1)` | `rgba(255,255,255,.12)` | `rgba(26,25,21,.14)` |
| `--ink` | `#FFFFFF` | `#F4F8FC` | `#1A1915` |
| `--dim` | `#B8C5D6` | `#B4C0CE` | `#4A473F` |
| `--faint` | `#8A97AC` | `#A4B0BE` | `#615C54` |
| `--faintest` | `#7A879A` | `#94A2B2` | `#6E6960` |
| `--accent` | `#B06BE0` | `#AF91EB` | `#6B4FA8` |
| `--gold` | `#F7B731` | `#F0BE5A` | `#B8860B` |

Every one of those text tiers clears **4.5:1** against its ground — verified, and the values
were tuned specifically to get there. Don't nudge them.

**Category hues** (four families across 12 categories):

| Family | Midnight | Dusk | Daylight | Categories |
|---|---|---|---|---|
| `cy` | `#00E5FF` | `#78E6F5` | `#127080` | Healing/Recovery, Immune, Skin/Hair, Muscle |
| `pu` | `#B06BE0` | `#AF91EB` | `#5B3F97` | GH Axis, Cognition, Sleep, Longevity |
| `gr` | `#22A06B` | `#5FCF9B` | `#1B8055` | Metabolic/Weight, GI/Bone |
| `go` | `#F7B731` | `#F0BE5A` | `#B8860B` | Cardio, Sexual Health — **also the tension colour** |

**Type**
- Display — Cormorant Garamond 300, `clamp(26px, 3.4vw, 58px)` hero, 29px panel narration
- Body — Jost 200/300/400, 14–16px, `line-height: 1.75–1.8`
- Data/labels — JetBrains Mono 300–500, 9–12px, `letter-spacing: .08–.32em`, uppercase
- Numerals — Jost 200 at 32–52px

**Geometry:** no border radius anywhere except status dots and avatars. Dividers are 1px gaps
in a `--hair` background, not borders. Minimum tap target 44px throughout.

**Motion** (all suppressed under `prefers-reduced-motion`)

| Name | Duration | Meaning |
|---|---|---|
| `cxbreathe` | 11s | the field is alive |
| `cxdriftA/B` | 26s / 34s | particle layers drift in opposition |
| `cxthin` | 3.4s | **supply running out** — fastest, because it needs attention |
| `cxmarch` | 1.5s | dashed edge = interrupted relationship |
| `cxpulse` | 2.4s | Cortex is listening |
| entrances | 340–560ms `cubic-bezier(.2,.7,.2,1)` | |

---

## Data layer

`catalog.js` is **generated from the repo's own source** and its content is correct:

- 58 compounds parsed from `src/lib/peptide-knowledge.ts` — every prose field
  (`primaryPurpose`, `whatItDoes`, `keyEffects`, `dosageRange`, `riskCautions`,
  `drugInteractions`, `bottomLine`) carried through **unedited**
- 12 regions = the `goalCategory` values
- Edges = the real `stacksWellWith` arrays
- Marker keys, labels and units verbatim from `src/lib/bloodwork-markers.ts`

### ⚠ Evidence grades — read this before changing anything

Grades map **one-to-one** from `evidenceLevel`, with no tiebreaker:

```
A  FDA-approved Rx (labeled use)                              19 compounds
B  Region-specific approval (not US FDA)                       2
C  Mixed/unclear regulatory status                             7
D  Research/compounded/adjunct (no established indication)    27
—  Physiology/diagnostic target (not a therapy)                3
```

An earlier revision used `cvRating` as a tiebreaker. **`cvRating` is a cardiovascular score** —
it is paired with `cvNotes`, and all five GLP-1 agonists carry 5/5. Using it fabricated an
evidence distinction between Semaglutide (cv 5) and Somatropin (cv 1) despite identical
evidence levels. It must never touch the evidence grade. It appears in exactly one place in
the UI, labelled as itself, carrying `cvNotes` as its body text.

### Known data defect in the source

`GHK-Cu` is filed under `goalCategory: 'GH Axis'` while its `primaryPurpose` is `Skin / Hair`,
and it has inherited GH-axis `keyEffects` text. The Mirror detects this class of mismatch
automatically and surfaces it as "LIBRARY DISAGREES WITH ITSELF" rather than guessing. Worth
fixing in the source spreadsheet; keep the detector either way.

### Supabase mapping

| Design constant | Table |
|---|---|
| `STACK` | `stack_items` |
| `DOSE_LOG` | `dose_logs` |
| `MARKERS` | `bloodwork_results` |
| `CYCLE` | `cycles` |
| `SITES` | `injection_sites` (geometry only — see below) |
| `COMPOUNDS`, `CATEGORIES` | local bundle, not a table |

**Do not store aggregates.** `SITES` carries only `id/label/x/y`; injection counts are derived
at read time from the filtered dose log. A stored `uses` count cannot respond to a filter, and
that is precisely how the free tier leaked a locked compound's injection history during design.
The same applies to `CYCLE.adherence` and any `COUNTS.*` you add.

---

## Tiers — implement server-side

Free = **1 resolved compound**; Pro = unlimited. Everything else on Free stays open: the full
58-compound library, all evidence grades and sources, dose log, and reconstitution maths.

**Three states, visually distinct — do not collapse to two:**

| State | Meaning | Node treatment |
|---|---|---|
| Resolved | yours, readable | solid fill, full-opacity stroke |
| **Locked** | **yours, withheld by tier** | dashed ring at its own hue, `opacity .35` |
| Not yours | in the library only | faint, no ring |

A locked compound still **draws its edges** out to unheld neighbours — that is the entire
argument for a 1-compound free tier and it is what the pricing page illustrates.

### Rules learned the hard way

Eight separate paywall leaks appeared during design. Every one had the same shape. Three rules
prevent all of them:

1. **One accessor per gated claim.** `labsOn`, `siteUsage()`, `cycleReport()` each own an answer
   that several surfaces read. Gating at display sites reproduces the bug every time — a second
   consumer always gets missed.
2. **Never conflate "locked" with "not owned."** The tier withholds *resolution*; it never
   revokes *ownership*. Ownership-facing surfaces (history, reconstitution maths, region
   membership, "regions holding nothing of yours") must be tier-blind. Only comparison and
   tension maths filter by tier.
3. **Derive, don't store.** See the aggregates note above.

Gate these on Free: bloodwork attach, cross-stack synthesis in Cortex answers, cycle adherence,
supply comparison, rotation beyond resolved compounds.

**Never gate:** reconstitution arithmetic, cautions, contraindications, interaction text — for
locked compounds too. The pricing page prints this as a promise; the code has to keep it.

---

## Interactions

- **Zoom** — wheel over the field; 480ms throttle, ±12px deadzone; up = in, down = out
- **Esc** — one layer out, or close the Ledger
- **Drag** — layer 3 only; offsets the orbit angle; uses pointer capture; `cursor: grab`
- **Ask bar** — doubles as compound search (exact/prefix match navigates to the compound);
  otherwise pattern-matches supply / interactions / labs / cycle intents and **moves the view**
  as it answers
- **Ground toggle** — rewrites custom properties on the root; 420ms transition
- **FAQ accordion** (pricing) — single-open, first open by default, re-click collapses

### Label placement — non-trivial, read before reimplementing

Node labels are **laid out after all node positions are known**, not placed at fixed offsets.
Each label tests 8+ candidate positions (four sides at two distances, plus diagonals) scored
against: every node's ring (weight 1), the field footer and the zoom rail as real rects
(weight 6), already-placed labels (weight 1.5), and pane edges. Cheapest wins.

Details that matter:
- Clamp candidates to the pane **before** scoring, not after — clamping a winner afterwards can
  push it back onto something it had avoided.
- The title is `nowrap`, so the reserved box must be **at least the title's width**; capping it
  makes the collision maths trust a box the text overflows.
- Regions with >8 compounds resolve onto **two concentric rings** — a single ring leaves no
  radial room for labels.
- Long names truncate on both ring layers.
- The cached field size must be re-measured on update; a stale value silently pushes the SVG's
  bottom edge past the visible pane and labels land on chrome the engine thinks is elsewhere.

---

## Copy voice

Cortex narrates in first person, one observation at a time, and states what it cannot do:

> "This is the thinning node — 4 days of supply against 15 days left in the cycle."
> "This one is yours — 41 days logged — but Free will not resolve it. The arithmetic and the
> record below stay open regardless."
> "Adherence is measured across your whole stack, so I am withholding it while 5 compounds are
> locked."

Never concatenate a taxonomy enum into prose. `evidenceLevel` values are labels, not sentences —
map them (`"nothing behind it carries an approved indication"`), don't interpolate them.

Every compound view carries: *"EDUCATIONAL REFERENCE ONLY · CORTEX DESCRIBES HOW COMPOUNDS ARE
STUDIED · IT DOES NOT DIAGNOSE, TREAT OR PRESCRIBE."*

---

## Suggested build order

1. Design tokens → Tailwind config + a `ThemeProvider` writing the three grounds
2. `catalog.ts` — port the generator, keep grades one-to-one from `evidenceLevel`
3. Entitlement module — `held()`, `ownedEntry()`, `labsOn`, `siteUsage()`, `cycleReport()`,
   enforced server-side
4. Auth (smallest, and the contract is already specified above)
5. Pricing
6. The Mirror — field geometry and the label placer first; they are the hard part
7. Home
8. Redirect the old routes: `/stack`, `/log`, `/cycle`, `/bloodwork`, `/reconstitution`,
   `/sites`, `/checker` → the Mirror layer or Ledger tab that replaces each

---

## Files in this bundle

| File | Purpose |
|---|---|
| `Peptide Cortex Mirror.dc.html` | The product — all four layers, tiers, Ledger |
| `Peptide Cortex Home.dc.html` | Marketing home |
| `Peptide Cortex Auth.dc.html` | Sign in + create account |
| `Peptide Cortex Pricing.dc.html` | Plans, trial, FAQ |
| `catalog.js` | 58 compounds, 12 regions, sample user data, Supabase mapping |

Open any `.dc.html` directly in a browser to interact with it.

The sample user data (6-compound stack, 41-day cycle, 8 bloodwork markers, dose log) is
realistic placeholder — replace with live Supabase reads, keeping the derived-not-stored rule.
