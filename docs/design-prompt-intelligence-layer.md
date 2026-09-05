# Prompt for Claude Design — the intelligence layer

The v2 handoff covers the public site, the shop and the bench shell. It does not
cover the five screens below, which are the reason the product exists.

Runs in parallel with the Next.js integration of v2 — different screens, no
collision.

---

```
Second pass on Peptide Cortex. Your v2 handoff
(design_handoff_peptide_cortex_site) covers Home, Auth, the bench shell, Shop,
Product, Cart, Checkout, Zelle, Order and Legal. Match it exactly — same tokens,
same type scale, same 1px-rule structure, zero radius, no shadows, same voice.

It does not cover the half of the product that matters most. Five screens:

  1. INTERACTION CHECKER
  2. BLOODWORK
  3. PROTOCOL PLANNER
  4. DOSING REFERENCE
  5. VIAL SCANNER

Apple rejected the iOS app under Guidelines 1.4.1 and 1.4.2 for precisely these.
That rejection is why the web app exists at all. They are not secondary.

All five are signed-in surfaces and live inside the bench shell.


1. INTERACTION CHECKER

Someone runs three peptides, takes two prescriptions and a handful of
supplements, and has nowhere to find out whether that combination is a problem.
Their doctor usually has not heard of half of it. This answers that, and it is
the single most valuable thing the product does.

  Two things in, compared. Peptide, prescription, supplement or OTC drug — not
  restricted to the 124 in the library, so the inputs are free text with
  suggestions rather than a closed picker.
  An assessment WITH ITS REASONING, not a verdict. AI-generated and labelled as
  such. An interaction claim presented as settled fact is worse than useless.
  It exists today buried as a panel on the peptide view. Make it a destination.


2. BLOODWORK

Upload a lab report — Labcorp, Quest, any PDF, or a photo of one — and get an
educational overview of the markers against what the person is taking.

  Upload → parsed markers → overview → saved to history.
  Marker values, reference ranges and dates are dense numeric data. This is
  where monospaced, column-aligned figures earn their keep most in the product.
  PREVIOUS ANALYSES ARE THE POINT. One panel is a snapshot; four is a trend, and
  the trend is most of the value. Design for someone on their fourth upload, not
  their first — the empty state matters far less than the fourth-visit state.
  EDUCATIONAL OVERVIEW, NEVER A DIAGNOSIS. It describes which markers are
  commonly studied alongside which peptides. It never says a result is good or
  bad and never recommends a change.


3. PROTOCOL PLANNER

Goals plus current stack in, a structured protocol out. Conversational as well
as one-shot — it supports refining a plan by talking to it, not just generating
one and stopping. Design both: the generated plan, and the refinement.

  AI-generated, labelled. It plans a protocol; it does not prescribe one.


4. DOSING REFERENCE

What the published literature and drug labels actually say, per peptide.

  Many of the 124 carry a real range from a label or a trial. Show the source
  beside every figure — an unattributed number is indistinguishable from a
  recommendation. Do NOT hardcode a count. Three different classification rules gave three
  different splits (43/81, 63/61, 73/51) — the number depends entirely on
  whether a no-dose statement in prose counts, and on where in the string it
  is looked for. Count live off the entries and let the UI report what it
  actually found. The rule itself still needs reconciling against
  src/lib/catalog.ts, which is the source of truth.
  THE REST SAY SO AND MUST KEEP SAYING SO. Research-tier, no approval, nothing
  to cite. Render as "no human dose established" — never blank, never a dash.
  NO PERSONALISATION AT ALL. No body weight, no goals, no frequency, no
  calculator. A weight-based calculator was considered twice and dropped twice.
  It is not an omission to be helpfully filled in.
  NEVER TIER-GATED, same as THE MATH and side effects.


5. VIAL SCANNER

Photograph a vial label; it reads the peptide and the mg and adds it to the
stack. Typing vials in by hand is the friction that stops people using a tracker
past week two.

  SHOW WHAT IT READ BEFORE COMMITTING, and let it be corrected. A misread label
  entering someone's stack silently is worse than making them type it.
  PHONE HANDOFF — the interesting part. Most people are at a desktop with no
  camera and no vial in reach:
      desktop shows a QR → phone scans it, opens a capture page →
      phone takes the photo → it appears in the desktop session
  Design both ends. The phone page is almost nothing — camera, shutter, confirm
  — because it is used one-handed standing at a fridge. The desktop needs a
  waiting state and then the result, with no refresh.


ACROSS ALL FIVE

  Every AI output is labelled as AI output, every time.
  First AI use requires explicit consent to AI processing. Design it as a real
  moment, not a dismissable banner.
  Disclaimer on each: "For research and reference purposes only. Not intended as
  dosing instructions for human or animal use, and not for human consumption.
  Consult a licensed physician before any medical decisions. Adults 18+."
  PEPTIDES, never "compounds". BATCHES, never "vials", for lot records — a vial
  is a container; those records are tested batches.
  Free vs Pro states where gated. The dosing reference is never gated.
  Mobile first.

Do not copy any .js data file from the handoff folder. src/lib/catalog.ts and
src/lib/peptide-knowledge.ts are the source of truth.

One take per screen unless something turns out genuinely ambiguous.
```
