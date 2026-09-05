# Prompt for Claude Design — self-audit Tools.dc.html, then export

The v2 zip contained ten `.dc.html` files and no `Tools.dc.html`, so the five
intelligence-layer screens were never audited against the rules. They carry the
heaviest legal constraints in the product and most of those constraints are
invisible in a design review.

This asks it to run the checks itself, fix what fails, then export — so the
integration starts from something already verified.

---

```
Before the next export, run these checks on Tools.dc.html and fix anything that
fails. These are not style notes — each one is a rule the product is built on,
and each is invisible in a design review, which is why they need checking
deliberately rather than by eye.

DOSING REFERENCE

  1. Do the research-tier peptides render "no human dose established"? 43 of the
     124 have no approval and nothing to cite. They must never show a blank, a
     dash, an em dash, "N/A", "—", or an empty cell. The absence is the content.

  2. Is there ANY input for body weight, goals, experience level or frequency?
     There must not be. The moment a figure is computed for a specific person it
     stops being a report of the literature and becomes advice. A weight-based
     calculator was considered twice and dropped twice — if one has reappeared,
     remove it.

  3. Does every published figure show its source beside it? An unattributed
     number is indistinguishable from a recommendation.

  4. Is the screen ungated? It must be readable at every tier, same as THE MATH
     and side effects.

BLOODWORK

  5. Does any copy — label, heading, result row, summary, tooltip — say or imply
     that a result is good, bad, high, low, optimal, concerning, or out of
     range? It must not. It describes which markers are commonly studied
     alongside which peptides. It never evaluates the person's result. Colour
     counts as saying it: a red or amber marker row is a diagnosis rendered in
     CSS.

  6. Does it ever recommend a change — more of something, less of something,
     stop, start, adjust? It must not.

PROTOCOL PLANNER

  7. Is the plan visibly AI-generated everywhere it appears, including in the
     refinement conversation and in any saved or printed view?

  8. If a plan includes a peptide with no published human dose, what does the
     amount column show? It must not show a number. Design that state — it will
     occur, and often — a large share of the 124 have no dose to report.

ALL FIVE

  9. Is AI output labelled as AI output on every screen that produces it, not
     only the chat-shaped ones?

  10. Does each carry the disclaimer, uncollapsed:
      "For research and reference purposes only. Not intended as dosing
      instructions for human or animal use, and not for human consumption.
      Consult a licensed physician before any medical decisions. Adults 18+."

  11. First AI use — is consent a real moment, or a dismissable banner? It
      should be the former.

  12. Vocabulary: "peptides" not "compounds" anywhere a user can see. "Batches"
      not "vials" for lot records — a vial is a container, those records are
      tested batches.

THEN EXPORT

Rebuild the handoff zip with every screen including Tools.dc.html, and tell me
which of the twelve checks failed and what you changed. If none failed, say so —
that is a useful answer too.

Before exporting, grep the whole package for these strings. They are lab report
codes and they must appear nowhere:
  D14D7EHWHFH9  XAKRSW4WN85N  VJUDHK6MDGT3  8S1BF8KMN7IM  WPDWU5NYUUME
Also grep for: WBS, Wibson, janoshik. The v2 fix stripped these from vials.js;
this confirms nothing reintroduced them.
```
