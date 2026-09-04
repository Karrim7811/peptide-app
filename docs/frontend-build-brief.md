# Frontend build brief — Claude Design

Supersedes `docs/shop-frontend-handoff.md`, which is folded in below.

**Before sending, replace two placeholders:** the four `pending` products say
`[MONTH TBC]`, and the three shipping prices say `[$ TBC]`. Both are genuinely
unset.

**Never send the COA images.** Each names the manufacturer in two fields, one
carries a personal email address, and every page has a scannable QR resolving to
the lab record. Figures, never documents.

---

```
Peptide Cortex — full frontend build.

Two businesses on one domain. A subscription app (a peptide reference library,
tracking tools and AI analysis) and a shop selling seven research compounds.
They share a brand and an account. They should not share chrome — see
ARCHITECTURE.

The visual language is yours. Everything below is either data you need or a rule
that is load-bearing for the product, the law, or the money. Where I say "must",
it is one of those three and not taste.


═══ SCOPE THIS PASS ═══

Build one vertical slice, end to end:

    landing → signup → dashboard → one compound → THE MATH → shop → checkout

Screens:
  1. Home / landing
  2. Auth — sign up, log in, reset password
  3. Dashboard (the app shell — see ARCHITECTURE)
  4. Compound detail
  5. Reference / search
  6. THE MATH (a panel inside the dashboard, not a route)
  7. Shop — catalogue, product, cart, checkout, order status
  8. Legal — terms, privacy, refund, EU

DEFERRED, deliberately: onboarding, stacks, stack finder, interaction checker,
AI chat, bloodwork, dose log, reminders, cycles, injection sites, notes,
vendors, regulatory, pricing page. Every one lives inside the app shell. Once
the shell and one feature page are right, they are variations in an established
language — designing 25 screens before knowing whether the language works is how
you get 25 mediocre ones.


═══ ARCHITECTURE ═══

ONE APP SHELL. Bench is it. Every signed-in app page lives inside it. Not
per-feature layouts — that becomes twenty layouts that drift apart.

THE SHOP SITS OUTSIDE THAT SHELL. Same brand, same account, different chrome.
This is a legal posture, not an aesthetic preference: the reference and AI side
is framed as educational material, the shop is commerce, and regulators read
intended use from how a seller presents its own content. Those two things
reading as structurally different is the point. Do not fold the shop into the
app shell as another tab.


═══ DATA ═══

Wire real data. Read catalog.ts and the shop catalogue in the project.

This matters more than usual. Of the 124 compounds, fourteen state outright that
no human dose exists. Several vials have null purity. Several have no dates at
all. Those are the cases that break layouts, and they are invisible if you
design against six tidy examples.

VIEWPORTS: mobile first. This audience checks protocols on a phone and the
install pattern is iPhone home screen (PWA).

PROTOTYPE DEPTH: working cart and flow, but not persistence. The real cart wires
to server actions that already exist, so building storage duplicates work that
gets thrown away. The flow does need to be clickable — the Zelle screen and the
order states cannot be judged standing still.


═══ 1. LANDING ═══

Data-led. The assay ledger and the 124-compound reference are the hero.

It has to sell both businesses at once: the reference depth sells the
subscription, the assay ledger sells the shop. Not product-led — dashboard
screenshots and a pro pitch is what every SaaS landing page looks like, and it
says nothing about why this one is different. Not editorial either; long-form on
why published assays matter is slow to convert and expensive to write well.

The differentiator, stated plainly: everyone else asks you to trust them. We
publish the numbers and let you check.


═══ 2. AUTH ═══

Sign up, log in, reset password.

SIGNUP COLLECTS DATE OF BIRTH and refuses under-18s. Not a checkbox, not "I
confirm I am 18+" — an actual date, stored. It is enforced in the database and
again at checkout. Design it as a normal required field, not as a barrier.


═══ 3. DASHBOARD / APP SHELL ═══

The signed-in home. Everything in the app hangs off this.

FREE / PRO: design both states for every gated feature in this pass. The paywall
is the business model, and retrofitting it into finished screens is how you get
locked features that look broken instead of desirable. A locked feature should
make someone want it, not make them think something failed.

Pricing, when it appears: $14.99/month or $119.88/year, one-month free trial.
Never hardcode those — they come from pricing.ts.

TWO THINGS ARE NEVER GATED, and both are deliberate:
  • THE MATH — even for compounds a free user has not unlocked.
  • Side effects — and no upgrade affordance may appear anywhere near them.
Putting an upgrade prompt beside safety information is the wrong pairing.


═══ 4. COMPOUND DETAIL ═══

One of 124. Carries purpose, mechanism, effects, cautions, interactions,
evidence grade (A–D), and a cardiovascular rating 0–5.

MUST: never render a dose the data does not state. Fourteen entries say outright
that no human dose exists, and a test enforces that they keep saying so. Do not
fill those with a placeholder, an animal-derived figure, or a dash that reads as
zero. "No human dose established" is the content, not an empty state.

The evidence grade maps 1:1 from the evidence level. The CV rating must never
influence how a grade is displayed — they are different axes and conflating them
invents distinctions that do not exist.


═══ 5. REFERENCE / SEARCH ═══

All 124, searchable. Search covers compound names, brand names, and indications
— someone types "Botox" or "fat loss", not always an exact compound name.


═══ 6. THE MATH ═══

A panel inside the dashboard shell. Not its own route. It is already called THE
MATH in the app; its current headings read "SOLUTION CHEMISTRY · WORKING SHOWN"
and "VIAL CONTENTS". Keep that register.

THIS IS THE HIGHEST-LEGAL-RISK SURFACE IN THE PRODUCT. Apple rejected the iOS
app under Guideline 1.4.2 over exactly this and the same US exposure applies on
web. The screen was deliberately reframed in response. Do not design a
reconstitution calculator, and never a dose calculator.

  It describes what is in a vial of solution. It does not tell a person what to
  do with it. Those are different products and only one is legal for us to ship.

  INPUT asks what concentration the user wants to PREPARE — mg of compound, mL
  of solvent. Never "what's your dose?"

  OUTPUT describes the resulting solution: "this solution contains X mcg per Y
  units on a U-100 syringe." A statement about chemistry, in the third person.

  NEVER: "draw X for your dose", "your dose is", "inject", "take", or any
  imperative addressed to the reader. No second person in the output at all.

  NO INPUTS FOR BODY WEIGHT, GOALS, EXPERIENCE OR FREQUENCY. Any of them turn
  solution chemistry into personalised medical advice, which is the line the
  reframing exists to stay behind. If a field would make the answer specific to
  the person rather than to the vial, it does not belong.

  SHOW THE WORKING. Arithmetic a user can check reads as a tool; a single
  confident number reads as an instruction.

  MANDATORY BANNER above the arithmetic, inside the panel, never collapsed:
  "For research and reference purposes only. Not intended as dosing instructions
  for human or animal use. Consult a licensed physician before any medical
  decisions."

  If anything persists, it persists a PREPARATION — "30 mg in 3 mL" — never a
  dose.

  NEVER TIER-GATED. No locked variant, no blur, no upgrade affordance. It looks
  the same to everyone.


═══ 7. THE SHOP ═══

Five screens: catalogue, product, cart, checkout, order status.

WHAT THE SHOP IS FOR

We publish the independent lab assay for every batch and the price per
milligram, and let the reader draw their own conclusions about everyone else. We
never mention a competitor and never claim anyone overcharges. The numbers do
the arguing, so the numbers are the loudest thing on the page.

Most shops here post a purity percentage with nothing behind it and price so
comparison is hard. We do the opposite. That contrast is the brief.

THE DATA — real values, not placeholders.

1. GLP-3 (Retatrutide) — 30 mg — $125.00 — $4.17 / mg
   Triple agonist at GLP-1, GIP and glucagon receptors. Metabolic / weight loss.
   ASSAYED: 99.623% purity · 35.95 mg measured against a 30 mg label
   lot JA-102107 · MFG 2026-01 · EXP 2028-01
   LOT HISTORY — nine months of consecutive batches:
      JA-102107   Jan 2026   99.623%   35.95 mg   ← shipping now
      JA-68243    Jun 2025   99.736%   31.72 mg
      JA-63071    Apr 2025   99.466%   32.61 mg

2. VIP — 5 mg — $30.00 — $6.00 / mg
   Vasoactive intestinal peptide.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

3. MOTS-c — 10 mg — $30.00 — $3.00 / mg
   Mitochondrial-derived peptide; activates AMPK.
   ASSAYED: 99.114% purity · 12.33 mg measured against a 10 mg label
   lot JA-102111 · MFG 2026-01 · EXP 2028-01

4. Selank — 5 mg — $30.00 — $6.00 / mg
   Tuftsin analogue; modulates GABA and monoamine systems.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

5. Semax — 5 mg — $30.00 — $6.00 / mg
   ACTH(4-10) analogue; modulates BDNF and NGF.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

6. KLOW — 80 mg — $100.00 — NO per-mg price (rule 2)
   A four-component blend: GHK-Cu, BPC-157, TB-500, KPV.
   ASSAYED BY COMPOSITION · lot JA-102113 · MFG 2026-01 · EXP 2028-01
      GHK-Cu          57.45 mg
      BPC-157         11.12 mg
      TB-500 (TB4)    10.88 mg
      KPV             11.20 mg
      ─────────────────────────
      Measured        90.65 mg   against 80 mg labelled

7. NAD+ — 1000 mg — $75.00 — $0.075 / mg
   Nicotinamide adenine dinucleotide. A coenzyme, not a peptide.
   PENDING: assay commissioned, results expected [MONTH TBC]. No lot code yet.

All products: cold chain, "USE WITHIN 28 DAYS · 2–8 °C".

CATALOGUE LAYOUT: cards, three up. Not a table. A table's main gesture is
reading down a column and comparing rows, and cross-compound comparison is the
one thing rule 1 forbids — it would be a layout that invites the mistake. Cards
everywhere, not a desktop-table/mobile-card split. Fixed order, 1–7.

OVERFILL: state it as two absolute figures, mg leading — "35.95 mg measured /
30 mg labelled". The percentage is our arithmetic on the lab's number, so keep
it secondary and quiet. A "+5.95 mg" gain framing drifts toward reading like a
discount. Where we have the figure the vial holds more than the label claims:
+23% on MOTS-c, +20% on GLP-3, +13% on KLOW, measured by a third party, and
essentially nobody in this market publishes it. Give it a place beside the
purity figure. Some products have no content figure; treat that as normal.

PENDING: an empty ruled assay block — the same columns as an assayed product,
left blank. Not struck-through: nothing was struck out, the measurement was
never taken, and strikethrough implies invalidation. Not a shorter plain-text
row either; that reads as unfinished design rather than deliberate. The empty
block shows the exact shape of what is missing.

CHECKOUT — US shipping address, then two choices.

  Shipping method:
     Standard    USPS Ground Advantage       2–5 business days   [$ TBC]
     Priority    USPS Priority Mail          1–3 business days   [$ TBC]
     Overnight   USPS Priority Mail Express  next business day   [$ TBC]
  Only Overnight is guaranteed by the carrier. The other two are estimates and
  must be worded as estimates.

  Payment — two different journeys, not two radio buttons with one outcome:
     • Crypto → we redirect to a hosted checkout; the buyer returns to the order
                page. Confirms in minutes.
     • Zelle  → nothing to redirect to. We show a handle, an exact amount, and a
                reference code that MUST go in the memo. Payment happens in
                their banking app. Confirmed by hand, usually within one
                business day.

ZELLE SCREEN — 2a, the instruction sheet. Retire 2b, the bank facsimile: if it
mimics a real bank's interface it teaches people that bank-like UI on a
third-party site is normal, which is the pattern phishing runs on. Even as
generic payment-slip styling it decorates, when the actual problem is whether
someone puts the right code in a memo field.

This is the hardest and most important screen in the shop. If the
reference code is missed or mistyped, money lands in a bank account matched to
no order, and that is a manual support problem every time. Include:
  - the reference code as the largest element on the screen
  - one-tap copy for both the code and the amount
  - three steps: open app → send exact amount → paste code in memo
  - the code shown again on the order page
  - a warning that a missing memo delays matching
  NOT an emailed or texted copy — there is no transactional email configured, so
  a screen promising one would be lying.
  Reference format: PC-7K3M. Four characters over an alphabet with no O, 0, I, 1
  or L. No year suffix — every extra character is a typo in a memo field and
  some banks truncate.
  Handle: pay@peptidecortex.com as a stand-in. Make it easy to swap.

ORDER STATES — seven, as states of one page:
  awaiting payment (Zelle) · payment confirming (crypto) · paid, preparing ·
  shipped with tracking · delivered · expired · cancelled/refunded

REFUND POLICY at checkout (draft, under legal review — treat as provisional):
"Refunds are handled by hand, not by a card network. Unopened vials with the
cold-chain seal intact can be returned within 14 days of delivery for a full
refund including original shipping. Opened vials can't be returned — we can't
verify how they were stored after they left us. Email us with your order
reference and we'll confirm within one business day."


═══ SHOP RULES — product decisions, not style ═══

Each is invisible in a mockup, which is exactly why it is written down. A design
that breaks all nine still looks good.

1. Never sort, rank, filter or badge by unit price. Per-mg compares WITHIN a
   compound — it exists so a buyer can weigh our retatrutide against someone
   else's. NAD+ at $0.075/mg beside Semax at $6.00/mg says nothing about value,
   so a "best value" badge would actively mislead.

2. KLOW has no per-mg price on purpose. Four molecules; a price per milligram of
   unspecified mixture is meaningless. The component table replaces it, and is
   stronger anyway — it shows the exact ratio AND that the vial is overfilled.

3. The four pending products must show their expected month AND the sentence
   "This product ships with no published assay until then." Do not make this
   state look comfortable or resolved. If pending looks fine, the published
   figures on the other three stop meaning anything.

4. No "verify" link, badge, QR code or scan affordance anywhere. There is
   nothing to link to yet. Leave room; it arrives later.

5. GLP-3's lot history is the most important block in the shop. Anyone can post
   one certificate for the batch they are currently selling. Almost nobody can
   show nine months of consecutive batches holding 99.4%+. The DATES are what
   make it a record rather than three loose numbers — keep them on every row.

6. "Awaiting payment" after a Zelle checkout is the NORMAL state, not an error.
   Do not render it as a warning, a spinner, or anything red. A correct system
   must not be made to look broken.

7. Delivery estimates run from payment confirmation, not from checkout. On the
   Zelle rail an order can sit unconfirmed for a day, so a next-day SERVICE is
   not a next-day DELIVERY.

8. Never display stock levels or scarcity. It is the opposite of what this shop
   claims to be.

9. THE SHOP IS NEVER TIER-GATED. A free user can buy. It is commerce, not a Pro
   feature.


═══ HOW MANY TAKES ═══

One take per screen. The only screen worth two was the Zelle sheet, and that
comparison has already happened — 2a won. Everything else is settled enough by
the rules above that a second option would be variation for its own sake rather
than a real decision to make.

If something below turns out to be genuinely ambiguous once you are in it, build
two and say which one you would keep — but do not go looking for places to.


═══ CROSS-CUTTING ═══

NUMERICS: every purity, milligram, price, lot code, reference code, lab value
and date is monospaced and column-aligned. It reads as instrument panel rather
than marketing and makes figures scannable, which is the whole point. If you
have not already chosen a mono face for data, JetBrains Mono is the house
choice.

LEGAL FOOTER on every page showing peptide content, dosing or AI output:
"For research and reference purposes only. Not intended as dosing instructions
for human or animal use, and not for human consumption. Consult a licensed
physician before any medical decisions. Adults 18+. US shipping only."

EU: traffic from the EU is geoblocked at the edge and lands on a /eu page. It
needs a state, and it should read as a deliberate policy rather than an error or
a failure.

CHECKOUT requires a signed-in account and 18+. There is no guest checkout.
```

---

## Why the backend is not in this brief

Data, schema, pricing logic, entitlements, payment adapters and the admin queue
stay in the app repo. The rules that matter most have no visual form — lab report
codes never reaching the client, no unit price on blends, never ranking by $/mg,
RLS over health data, lot-level recall traceability, HMAC verification on the
payment webhook. A tool optimising for visual output drops those silently and the
result still looks correct.

`docs/BACKEND-CONTRACT.md` is the interface; §13 covers the shop.
